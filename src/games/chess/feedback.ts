import type { Color, Match } from "./engine.ts";

export function moveFeedback(before: Match, after: Match, humanSide?: Color) {
  if (after.result || after.moves.length !== before.moves.length + 1) return null;
  const san = after.notation.at(-1) ?? "";
  const id = after.revision;
  if (san.includes("+")) return { id, title: "Shah!", label: "Check · protect your king", tone: "alert" as const };
  if (humanSide && before.fen.split(" ")[1] !== humanSide) return null;
  if (san.includes("=")) return { id, title: "A royal upgrade!", label: "Pawn promoted", tone: "royal" as const };
  if (san.startsWith("O-O")) return { id, title: "Raja is safe.", label: "Castled", tone: "royal" as const };
  if (san.includes("x")) return { id, title: "Wah, kya chaal!", label: "Piece captured" };
  return null;
}
