import { opposite, sideName, type Match, type Outcome } from "./engine.ts";
import type { Session } from "./persistence.ts";

export type FeedbackKind = "pocket" | "combo" | "foul" | "queen" | "cover" | "return" | "gift" | "debt" | "win" | "loss";
export type ShotFeedback = { kind: FeedbackKind; title: string; note: string; label?: string; motif?: "jalebi" | "chai" | "spark" };
export const FEEDBACK_MS = 2400;
type Perspective = Pick<Session, "mode" | "humanSide">;

export function resultFeedback(match: Match, { mode, humanSide }: Perspective): ShotFeedback | null {
  if (mode === "practice" && match.pieces.length === 0) return { kind: "win", title: "Full paisa vasool!", label: "Board cleared", note: "All 19. Time for a victory chai." };
  if (!match.result) return null;
  const won = mode !== "computer" || match.result.winner === humanSide;
  const title = mode === "computer" ? won ? "You won!" : "Ravi wins." : `${sideName(match.result.winner)} wins!`;
  return { kind: won ? "win" : "loss", title, label: won ? "Shabash, champion" : "Phir se?", note: match.result.reason === "resignation" ? "Another board, another chance." : won ? "Mithai banti hai. What a finish!" : "Chai break. Comeback. One more?" };
}

/** Feedback follows accepted outcomes, after queen returns, penalties and wins resolve. */
export function shotFeedback(before: Match, after: Match, outcome: Outcome, context: Perspective): ShotFeedback | null {
  if (resultFeedback(after, context)) return null;
  const actor = before.turn;
  const computer = context.mode === "computer" && actor !== context.humanSide;
  const another = computer ? "Ravi goes again." : context.mode === "pass-and-play" ? `${sideName(actor)} goes again.` : "The next shot is yours.";
  const foul = outcome.strikerPocketed || outcome.ejected.length > 0;
  if (foul) return { kind: "foul", title: "Arre, foul!", label: "Foul", note: context.mode === "practice" ? "No penalty here. Try again." : outcome.strikerPocketed ? computer ? "Ravi’s striker slipped in." : "Striker down. Shake it off." : "A coin left the board." };
  if (after.queen === "covered" && before.queen !== "covered") return { kind: "cover", title: "Rani secured!", label: context.mode === "practice" ? "Queen pocketed" : "Queen covered", note: context.mode === "practice" ? "Royal touch. Keep the coins coming." : computer ? "Ravi has the queen. Game on." : "Queen is yours. Finish your set." };
  if (after.queen === "pending" && before.queen !== "pending") return { kind: "queen", title: "Rani has arrived!", label: "Queen pocketed · cover next", note: computer ? "Ravi has one shot to cover." : "Pocket your own coin on the next shot." };
  if (after.queen === "board" && (before.queen === "pending" || outcome.pockets.includes("q"))) return { kind: "return", title: "Rani, phir se!", label: "Queen returns", note: before.queen === "pending" ? "Cover missed. Back to the centre." : "Pocket your own coin before the queen." };
  if (after.messages.some(message => message.includes("final coin returns"))) return { kind: "return", title: "Arre, thoda sabr!", label: "Coin returned", note: "Cover the queen before the final coin." };
  const own = after.pocketed[actor].length - before.pocketed[actor].length;
  const other = opposite(actor);
  const credited = context.mode === "practice" ? own + after.pocketed[other].length - before.pocketed[other].length : own;
  if (credited > 1) return { kind: "combo", title: credited === 2 ? "Double dhamaka!" : credited === 3 ? "Teen ka tadka!" : "Patakha shot!", label: `${credited} coins · great shot`, note: another };
  if (credited === 1) {
    const lines = [
      { title: "Jalebi sweet!", motif: "jalebi" as const },
      { title: "Makkhan shot!", motif: "spark" as const },
      { title: "Wah, kya shot!", motif: "spark" as const },
      { title: "Ekdum kadak!", motif: "chai" as const },
      { title: "Shabash!", motif: "spark" as const },
      { title: "Chai-worthy shot!", motif: "chai" as const },
    ];
    return { kind: "pocket", ...lines[before.revision % lines.length], label: "Nice shot · +1", note: computer ? "Ravi found his angle." : another };
  }
  if (after.debt[actor] < before.debt[actor]) return { kind: "debt", title: after.debt[actor] === 0 ? "Hisaab settled!" : "Thoda hisaab clear!", label: "Penalty repaid", note: after.debt[actor] === 0 ? "All square. Find your next angle." : "One coin of debt repaid." };
  if (after.pocketed[other].length > before.pocketed[other].length) return { kind: "gift", title: "Mehmaan nawaazi!", label: "Opponent’s coin", note: computer ? "A little gift from Ravi." : "A little too generous to your rival." };
  return null;
}
