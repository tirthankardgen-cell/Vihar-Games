export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Seat = 0 | 1;
export type Difficulty = "easy" | "medium" | "hard";
export type ResultReason = "three-in-a-row" | "draw" | "resignation" | "forfeit";

export type Match = {
  board: Cell[];
  xSeat: Seat;
  actor: Seat;
  round: number;
  revision: number;
  status: "playing" | "finished";
  winner: Seat | null;
  reason: ResultReason | null;
  line: number[];
  wins: [number, number];
  draws: number;
};

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export class GameRuleError extends Error {
  readonly code: "ROUND_FINISHED" | "NOT_YOUR_TURN" | "ILLEGAL_MOVE" | "ROUND_NOT_FINISHED";
  constructor(code: GameRuleError["code"]) {
    super({
      ROUND_FINISHED: "This round has already finished.",
      NOT_YOUR_TURN: "It is the other player's turn.",
      ILLEGAL_MOVE: "Choose an empty square on the board.",
      ROUND_NOT_FINISHED: "Finish this round before starting the next one.",
    }[code]);
    this.code = code;
    this.name = "GameRuleError";
  }
}

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function markForSeat(match: Pick<Match, "xSeat">, seat: Seat): Mark {
  return seat === match.xSeat ? "X" : "O";
}

export function evaluateBoard(board: readonly Cell[]): { mark: Mark | null; line: number[]; draw: boolean } {
  for (const line of WINNING_LINES) {
    const mark = board[line[0]];
    if (mark && line.every((cell) => board[cell] === mark)) {
      return { mark, line: [...line], draw: false };
    }
  }
  return { mark: null, line: [], draw: board.every((cell) => cell !== null) };
}

export function createMatch(xSeat: Seat = 0): Match {
  return {
    board: Array<Cell>(9).fill(null), xSeat, actor: xSeat,
    round: 1, revision: 0, status: "playing", winner: null,
    reason: null, line: [], wins: [0, 0], draws: 0,
  };
}

export function playMove(match: Match, actor: Seat, cell: number): Match {
  if (match.status !== "playing") throw new GameRuleError("ROUND_FINISHED");
  if (match.actor !== actor) throw new GameRuleError("NOT_YOUR_TURN");
  if (!Number.isInteger(cell) || cell < 0 || cell > 8 || match.board[cell] !== null) {
    throw new GameRuleError("ILLEGAL_MOVE");
  }

  const board = [...match.board];
  board[cell] = markForSeat(match, actor);
  const result = evaluateBoard(board);
  const wins: [number, number] = [...match.wins];
  if (result.mark) wins[actor] += 1;
  const finished = Boolean(result.mark) || result.draw;

  return {
    ...match, board, wins, revision: match.revision + 1,
    actor: finished ? actor : otherSeat(actor),
    status: finished ? "finished" : "playing",
    winner: result.mark ? actor : null,
    reason: result.mark ? "three-in-a-row" : result.draw ? "draw" : null,
    line: result.line,
    draws: match.draws + (result.draw ? 1 : 0),
  };
}

export function resignMatch(match: Match, seat: Seat, reason: "resignation" | "forfeit" = "resignation"): Match {
  if (match.status !== "playing") throw new GameRuleError("ROUND_FINISHED");
  const winner = otherSeat(seat);
  const wins: [number, number] = [...match.wins];
  wins[winner] += 1;
  return { ...match, status: "finished", winner, reason, line: [], wins, revision: match.revision + 1 };
}

export function nextRound(match: Match): Match {
  if (match.status !== "finished") throw new GameRuleError("ROUND_NOT_FINISHED");
  const xSeat = otherSeat(match.xSeat);
  return {
    ...createMatch(xSeat), round: match.round + 1,
    revision: match.revision + 1, wins: [...match.wins], draws: match.draws,
  };
}

export function isValidMatch(value: unknown): value is Match {
  if (!value || typeof value !== "object") return false;
  const match = value as Match;
  const integer = (number: unknown, minimum = 0) => Number.isSafeInteger(number) && (number as number) >= minimum;
  if (!Array.isArray(match.board) || match.board.length !== 9 || !match.board.every((cell) => cell === null || cell === "X" || cell === "O")) return false;
  if ((match.xSeat !== 0 && match.xSeat !== 1) || (match.actor !== 0 && match.actor !== 1)) return false;
  if (!integer(match.round, 1) || !integer(match.revision) || !integer(match.draws)) return false;
  if (!Array.isArray(match.wins) || match.wins.length !== 2 || !match.wins.every((win) => integer(win))) return false;
  if (!Array.isArray(match.line) || !match.line.every((cell) => integer(cell) && cell <= 8)) return false;

  const xCount = match.board.filter((cell) => cell === "X").length;
  const oCount = match.board.filter((cell) => cell === "O").length;
  if (xCount !== oCount && xCount !== oCount + 1) return false;
  const winningMarks = new Set(WINNING_LINES.filter((line) => match.board[line[0]] && line.every((cell) => match.board[cell] === match.board[line[0]])).map((line) => match.board[line[0]]));
  if (winningMarks.size > 1) return false;
  const result = evaluateBoard(match.board);

  if (match.status === "playing") {
    const actor = xCount === oCount ? match.xSeat : otherSeat(match.xSeat);
    return !result.mark && !result.draw && match.actor === actor && match.winner === null && match.reason === null && match.line.length === 0;
  }
  if (match.status !== "finished") return false;
  if (match.reason === "draw") return result.draw && match.winner === null && match.line.length === 0;
  if (match.reason === "three-in-a-row") {
    if (!result.mark || (result.mark === "X" ? xCount !== oCount + 1 : xCount !== oCount)) return false;
    const winner = result.mark === "X" ? match.xSeat : otherSeat(match.xSeat);
    return match.winner === winner && match.actor === winner && result.line.join() === match.line.join();
  }
  return (match.reason === "resignation" || match.reason === "forfeit") && !result.mark && !result.draw && (match.winner === 0 || match.winner === 1) && match.line.length === 0;
}
