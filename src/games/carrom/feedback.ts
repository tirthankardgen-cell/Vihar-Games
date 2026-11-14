import { opposite, sideName, type Match, type Outcome } from "./engine.ts";
import type { Session } from "./persistence.ts";

export type FeedbackKind = "pocket" | "combo" | "foul" | "queen" | "cover" | "return" | "gift" | "debt" | "win" | "loss";
export type ShotFeedback = { kind: FeedbackKind; title: string; note: string };
type Perspective = Pick<Session, "mode" | "humanSide">;

export function resultFeedback(match: Match, { mode, humanSide }: Perspective): ShotFeedback | null {
  if (mode === "practice" && match.pieces.length === 0) return { kind: "win", title: "A clean sweep!", note: "All 19. Beautifully done." };
  if (!match.result) return null;
  const won = mode !== "computer" || match.result.winner === humanSide;
  const title = mode === "computer" ? won ? "You won!" : "Ravi wins." : `${sideName(match.result.winner)} wins!`;
  return { kind: won ? "win" : "loss", title, note: match.result.reason === "resignation" ? "A fresh board. A fresh start?" : won ? "That’s how you finish a board." : "A worthy rival. One more?" };
}

/** Feedback follows accepted outcomes, after queen returns, penalties and wins resolve. */
export function shotFeedback(before: Match, after: Match, outcome: Outcome, context: Perspective): ShotFeedback | null {
  if (resultFeedback(after, context)) return null;
  const actor = before.turn;
  const computer = context.mode === "computer" && actor !== context.humanSide;
  const another = computer ? "Ravi goes again." : context.mode === "pass-and-play" ? `${sideName(actor)} goes again.` : "The next shot is yours.";
  const foul = outcome.strikerPocketed || outcome.ejected.length > 0;
  if (foul) return { kind: "foul", title: "Foul!", note: context.mode === "practice" ? "No penalty here. Try again." : outcome.strikerPocketed ? computer ? "Ravi’s striker slipped in." : "Striker down. Shake it off." : "A coin left the board." };
  if (after.queen === "covered" && before.queen !== "covered") return { kind: "cover", title: context.mode === "practice" ? "Queen pocketed!" : "Queen covered!", note: context.mode === "practice" ? "A little touch of royalty." : computer ? "Ravi seals the royal deal." : "A royal touch. Now finish your set." };
  if (after.queen === "pending" && before.queen !== "pending") return { kind: "queen", title: "Hello, your majesty.", note: computer ? "Ravi has one shot to cover." : "One shot to cover the queen." };
  if (after.queen === "board" && (before.queen === "pending" || outcome.pockets.includes("q"))) return { kind: "return", title: "Not crowned yet.", note: before.queen === "pending" ? "Cover missed. The queen returns." : "Pocket your own coin before the queen." };
  if (after.messages.some(message => message.includes("final coin returns"))) return { kind: "return", title: "One step early.", note: "Cover the queen before the final coin." };
  const own = after.pocketed[actor].length - before.pocketed[actor].length;
  const other = opposite(actor);
  const credited = context.mode === "practice" ? own + after.pocketed[other].length - before.pocketed[other].length : own;
  if (credited > 1) return { kind: "combo", title: credited === 2 ? "Double delight!" : credited === 3 ? "Three’s a charm!" : "Pocket party!", note: `${credited} coins. ${another}` };
  if (credited === 1) return { kind: "pocket", title: ["Nice shot!", "Great shot!", "Silky smooth!", "What a touch!", "Right in the pocket!"][before.revision % 5], note: computer ? "Ravi found his angle." : another };
  if (after.debt[actor] < before.debt[actor]) return { kind: "debt", title: "Back on track.", note: after.debt[actor] === 0 ? "Penalty repaid. A fresh chance." : "One coin of debt repaid." };
  if (after.pocketed[other].length > before.pocketed[other].length) return { kind: "gift", title: "A little generous!", note: computer ? "That one’s a gift from Ravi." : "That coin belongs to your rival." };
  return null;
}
