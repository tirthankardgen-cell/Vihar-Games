import { Chess, DEFAULT_POSITION, type Color, type PieceSymbol, type Square } from "chess.js";

export type { Color, PieceSymbol, Square };
export type Promotion = "q" | "r" | "b" | "n";
export type MoveInput = { from: Square; to: Square; promotion?: Promotion };
export type DrawReason = "stalemate" | "dead-position" | "threefold-repetition" | "fivefold-repetition" | "fifty-move-rule" | "seventy-five-move-rule" | "agreement";
export type Result = { winner: Color | null; reason: DrawReason | "checkmate" | "resignation" };
export type Match = {
  initialFen: string;
  fen: string;
  moves: MoveInput[];
  notation: string[];
  positionKeys: string[];
  revision: number;
  result: Result | null;
  drawOffer: Color | null;
  drawClaim: { intended: MoveInput | null } | null;
};
export const pieceNames: Record<PieceSymbol, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
export const sideName = (side: Color) => side === "w" ? "White" : "Black";
export const opposite = (side: Color): Color => side === "w" ? "b" : "w";

// chess.js's default FEN includes an en passant square only when a LEGAL
// capture exists, including the pinned-pawn case required for repetition.
export function positionKey(board: Chess): string { return board.fen().split(" ").slice(0, 4).join(" "); }
export function halfmoves(board: Chess): number { return Number(board.fen().split(" ")[4]); }
export function repetitions(match: Match): number {
  const key = match.positionKeys.at(-1);
  return match.positionKeys.filter((entry) => entry === key).length;
}

/** A position-based proof for sealed pawn walls, beyond material counting.
 * Flood each king's possible territory while treating the other king as absent
 * (a superset of its real freedom). If neither can ever approach/capture a pawn,
 * and no pawn can move or capture, neither side can possibly give mate.
 * Unknown fortresses are deliberately left playable, never declared dead on
 * the basis of a search timeout or the inability to FORCE mate.
 */
export function isSealedPawnPosition(board: Chess): boolean {
  const pieces = board.board().flat().filter((p) => p !== null);
  if (!pieces.some((p) => p.type === "p") || pieces.some((p) => p.type !== "p" && p.type !== "k")) return false;
  const pawns = pieces.filter((p) => p.type === "p");
  const xy = (s: string) => [s.charCodeAt(0) - 97, Number(s[1]) - 1];
  const at = (x: number, y: number) => pawns.find((p) => p.square === `${String.fromCharCode(97 + x)}${y + 1}`);
  for (const pawn of pawns) {
    const [x, y] = xy(pawn.square), forward = y + (pawn.color === "w" ? 1 : -1);
    if (!at(x, forward)) return false;
    if ([-1, 1].some((dx) => { const target = at(x + dx, forward); return target && target.color !== pawn.color; })) return false;
  }
  for (const color of ["w", "b"] as const) {
    const king = pieces.find((p) => p.type === "k" && p.color === color)!;
    const visited = new Set<string>();
    const queue = [xy(king.square)];
    while (queue.length) {
      const [x, y] = queue.pop()!, key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue;
        const attacked = pawns.some((p) => { const [px, py] = xy(p.square); return p.color !== color && Math.abs(nx - px) === 1 && ny === py + (p.color === "w" ? 1 : -1); });
        if (attacked) continue;
        const target = at(nx, ny);
        if (target?.color === color) continue;
        if (target) return false;
        queue.push([nx, ny]);
      }
    }
  }
  return true;
}

export function automaticResult(match: Match, board = new Chess(match.fen)): Result | null {
  // Do NOT use isGameOver()/isDraw(): chess.js auto-ends at 3 repetitions/50
  // moves. Those thresholds require a claim; 5/75 are automatic under FIDE.
  if (board.isCheckmate()) return { winner: opposite(board.turn()), reason: "checkmate" };
  if (board.isStalemate()) return { winner: null, reason: "stalemate" };
  if (board.isInsufficientMaterial() || isSealedPawnPosition(board)) return { winner: null, reason: "dead-position" };
  if (repetitions(match) >= 5) return { winner: null, reason: "fivefold-repetition" };
  if (halfmoves(board) >= 150) return { winner: null, reason: "seventy-five-move-rule" };
  return null;
}

export function createMatch(initialFen = DEFAULT_POSITION): Match {
  const board = new Chess(initialFen);
  const match: Match = { initialFen: board.fen(), fen: board.fen(), moves: [], notation: [], positionKeys: [positionKey(board)], revision: 0, result: null, drawOffer: null, drawClaim: null };
  match.result = automaticResult(match, board);
  return match;
}

function assertPlaying(match: Match) { if (match.result) throw new Error("This game has finished. Start a new game to play again."); }
function validateMove(board: Chess, move: MoveInput) {
  const candidates = board.moves({ square: move.from, verbose: true }).filter((m) => m.to === move.to);
  if (candidates.some((m) => m.promotion) && !move.promotion) throw new Error("Choose a queen, rook, bishop, or knight to complete promotion.");
  if (!candidates.some((m) => m.promotion === move.promotion)) throw new Error("That move is not legal. Your king must remain safe.");
}

export function makeMove(match: Match, move: MoveInput, actor: Color): Match {
  assertPlaying(match);
  const board = new Chess(match.fen);
  if (board.turn() !== actor) throw new Error("It is not your turn.");
  validateMove(board, move);
  const accepted = board.move(move);
  const normalized: MoveInput = { from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) };
  const next: Match = { ...match, fen: board.fen(), moves: [...match.moves, normalized], notation: [...match.notation, accepted.san], positionKeys: [...match.positionKeys, positionKey(board)], revision: match.revision + 1, drawOffer: match.drawOffer === actor ? match.drawOffer : null };
  next.result = automaticResult(next, board);
  if (next.result) next.drawOffer = null;
  return next;
}

export function claimReason(match: Match, intended?: MoveInput): "threefold-repetition" | "fifty-move-rule" | null {
  if (match.result) return null;
  const candidate = intended ? makeMove(match, intended, new Chess(match.fen).turn()) : match;
  if (repetitions(candidate) >= 3) return "threefold-repetition";
  if (halfmoves(new Chess(candidate.fen)) >= 100) return "fifty-move-rule";
  return null;
}

export function claimDraw(match: Match, actor: Color, intended?: MoveInput): Match {
  assertPlaying(match);
  if (new Chess(match.fen).turn() !== actor) throw new Error("Only the player to move may claim a draw.");
  const reason = claimReason(match, intended);
  if (!reason) throw new Error("No draw claim is available for this position or intended move.");
  // An intended-move claim ends at the current position: the move is written
  // down to establish the claim but is not played on the board.
  return { ...match, result: { winner: null, reason }, drawOffer: null, drawClaim: { intended: intended ? { from: intended.from, to: intended.to, ...(intended.promotion ? { promotion: intended.promotion } : {}) } : null }, revision: match.revision + 1 };
}

export function offerDraw(match: Match, actor: Color): Match {
  assertPlaying(match);
  if (new Chess(match.fen).turn() !== actor) throw new Error("Offer a draw on your turn, before your move.");
  if (match.drawOffer) throw new Error("There is already a draw offer awaiting a response.");
  return { ...match, drawOffer: actor, revision: match.revision + 1 };
}

export function respondToDraw(match: Match, actor: Color, accept: boolean): Match {
  assertPlaying(match);
  if (!match.drawOffer || match.drawOffer === actor) throw new Error("There is no opponent's draw offer to answer.");
  return { ...match, drawOffer: null, result: accept ? { winner: null, reason: "agreement" } : null, revision: match.revision + 1 };
}

export function resign(match: Match, actor: Color): Match {
  assertPlaying(match);
  return { ...match, drawOffer: null, result: { winner: opposite(actor), reason: "resignation" }, revision: match.revision + 1 };
}

export function rewind(match: Match, plies: number): Match {
  let next = createMatch(match.initialFen);
  for (const move of match.moves.slice(0, Math.max(0, match.moves.length - plies))) next = makeMove(next, move, new Chess(next.fen).turn());
  return { ...next, revision: match.revision + 1 };
}

export function resultText(result: Result): string {
  const reasons: Record<Result["reason"], string> = {
    checkmate: "checkmate", resignation: "resignation", stalemate: "stalemate", "dead-position": "dead position", "threefold-repetition": "threefold repetition claimed", "fivefold-repetition": "automatic fivefold repetition", "fifty-move-rule": "50-move rule claimed", "seventy-five-move-rule": "automatic 75-move rule", agreement: "draw by agreement",
  };
  return `${result.winner ? `${sideName(result.winner)} wins` : "Draw"} — ${reasons[result.reason]}.`;
}
