import type { Match, Side } from "./engine.ts";

export type QueenJourney = { kind: "take" | "return" | "cover"; side: Side; x: number; y: number };

/** Animate accepted ownership only; a fouled or early pocket earns no queen. */
export function queenJourney(before: Match, after: Match): QueenJourney | null {
  if (before.queen === "board" && after.queen !== "board" && after.coverSide) {
    return { kind: "take", side: after.coverSide, x: 300, y: 300 };
  }
  if (before.queen === "pending" && after.queen === "board" && before.coverSide) {
    const queen = after.pieces.find(piece => piece.id === "q");
    if (queen) return { kind: "return", side: before.coverSide, x: queen.x, y: queen.y };
  }
  if (before.queen === "pending" && after.queen === "covered" && after.coverSide) {
    return { kind: "cover", side: after.coverSide, x: 300, y: 300 };
  }
  return null;
}
