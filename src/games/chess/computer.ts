import { Chess, type Move } from "chess.js";
import { claimReason, type Match, type MoveInput } from "./engine.ts";

export type Difficulty = "easy" | "medium" | "hard";
export const levels: Record<Difficulty, { depth: number; milliseconds: number }> = {
  easy: { depth: 1, milliseconds: 150 }, medium: { depth: 3, milliseconds: 650 }, hard: { depth: 5, milliseconds: 1500 },
};
const values = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
const timeout = Symbol("search timeout");

export function evaluate(board: Chess): number {
  let score = 0;
  const pieces = board.board().flat().filter((piece) => piece !== null);
  const endgame = pieces.filter((p) => p.type !== "p" && p.type !== "k").length <= 4;
  for (const piece of pieces) {
    const x = piece.square.charCodeAt(0) - 97, y = Number(piece.square[1]) - 1;
    const center = 7 - Math.abs(x - 3.5) - Math.abs(y - 3.5);
    const advance = piece.color === "w" ? y : 7 - y;
    const positional = piece.type === "p" ? advance * 9 + center * 3
      : piece.type === "k" ? endgame ? center * 9 : -center * 7
      : piece.type === "n" || piece.type === "b" ? center * 12 : center * 2;
    score += (piece.color === "w" ? 1 : -1) * (values[piece.type] + positional);
  }
  return score * (board.turn() === "w" ? 1 : -1);
}
function ordered(moves: Move[]): Move[] {
  return moves.sort((a, b) => priority(b) - priority(a));
}
function priority(move: Move): number {
  return (move.captured ? values[move.captured] * 10 - values[move.piece] : 0) + (move.promotion ? values[move.promotion] : 0) + (move.san.includes("+") ? 30 : 0);
}

export type ComputerDecision = { move: MoveInput } | { claim: true } | { acceptDraw: boolean };
export function chooseMove(match: Match, difficulty: Difficulty, random = Math.random): ComputerDecision | null {
  if (match.result) return null;
  const board = new Chess(match.fen);
  if (match.drawOffer && match.drawOffer !== board.turn()) return { acceptDraw: evaluate(board) < 80 };
  if (claimReason(match)) return { claim: true };
  const available = ordered(board.moves({ verbose: true }));
  if (!available.length) return null;
  const budget = levels[difficulty], deadline = performance.now() + budget.milliseconds;
  let best = available[0];
  function search(depth: number, alpha: number, beta: number, ply: number): number {
    if (performance.now() > deadline) throw timeout;
    if (board.isCheckmate()) return -100_000 + ply;
    if (board.isStalemate() || board.isInsufficientMaterial()) return 0;
    if (depth <= 0) return evaluate(board);
    let score = -Infinity;
    for (const move of ordered(board.moves({ verbose: true }))) {
      board.move(move);
      let candidate: number;
      try { candidate = -search(depth - 1, -beta, -alpha, ply + 1); } finally { board.undo(); }
      score = Math.max(score, candidate); alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return score;
  }
  for (let depth = 1; depth <= budget.depth; depth++) {
    let iterationBest = best, score = -Infinity;
    try {
      for (const move of available) {
        board.move(move);
        let candidate: number;
        try { candidate = -search(depth - 1, -Infinity, -score, 1); } finally { board.undo(); }
        if (difficulty === "easy") candidate += random() * 110;
        if (candidate > score) { score = candidate; iterationBest = move; }
      }
      best = iterationBest;
      if (score > 90_000) break;
    } catch (error) { if (error !== timeout) throw error; break; }
  }
  return { move: { from: best.from, to: best.to, ...(best.promotion ? { promotion: best.promotion as MoveInput["promotion"] } : {}) } };
}
