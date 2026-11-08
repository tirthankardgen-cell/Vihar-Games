import { evaluateBoard, type Cell, type Difficulty, type Mark } from "./engine.ts";

const preference = [4, 0, 2, 6, 8, 1, 3, 5, 7];
const cache = new Map<string, number>();

function opposite(mark: Mark): Mark { return mark === "X" ? "O" : "X"; }

function minimax(board: Cell[], actor: Mark, computer: Mark): number {
  const result = evaluateBoard(board);
  if (result.mark) return result.mark === computer ? 1 : -1;
  if (result.draw) return 0;
  const key = `${computer}:${actor}:${board.map((cell) => cell ?? "-").join("")}`;
  const remembered = cache.get(key);
  if (remembered !== undefined) return remembered;
  let best = actor === computer ? -2 : 2;
  for (const cell of preference) {
    if (board[cell] !== null) continue;
    board[cell] = actor;
    const score = minimax(board, opposite(actor), computer);
    board[cell] = null;
    best = actor === computer ? Math.max(best, score) : Math.min(best, score);
    if (best === (actor === computer ? 1 : -1)) break;
  }
  cache.set(key, best);
  return best;
}

function immediateMove(board: Cell[], mark: Mark): number | null {
  for (const cell of preference) {
    if (board[cell] !== null) continue;
    board[cell] = mark;
    const wins = evaluateBoard(board).mark === mark;
    board[cell] = null;
    if (wins) return cell;
  }
  return null;
}

export function computerMove(input: readonly Cell[], mark: Mark, difficulty: Difficulty, random = Math.random): number | null {
  const board = [...input];
  const terminal = evaluateBoard(board);
  if (terminal.mark || terminal.draw) return null;
  const legal = preference.filter((cell) => board[cell] === null);
  if (difficulty === "easy") return legal[Math.min(legal.length - 1, Math.floor(Math.max(0, random()) * legal.length))];
  if (difficulty === "medium") {
    return immediateMove(board, mark) ?? immediateMove(board, opposite(mark)) ?? (board[4] === null ? 4 : legal[Math.min(legal.length - 1, Math.floor(Math.max(0, random()) * legal.length))]);
  }

  let chosen = legal[0];
  let best = -2;
  for (const cell of legal) {
    board[cell] = mark;
    const score = minimax(board, opposite(mark), mark);
    board[cell] = null;
    if (score > best) { best = score; chosen = cell; }
    if (best === 1) break;
  }
  return chosen;
}
