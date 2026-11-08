import assert from "node:assert/strict";
import { test } from "node:test";
import { computerMove } from "./computer.ts";
import { createMatch, evaluateBoard, GameRuleError, isValidMatch, markForSeat, nextRound, playMove, resignMatch, WINNING_LINES, type Cell, type Match } from "./engine.ts";
import { loadSession, parseSession, saveSession, SESSION_KEY, type LocalSession } from "./persistence.ts";

function moves(sequence: number[], initial = createMatch()): Match {
  return sequence.reduce((match, cell) => playMove(match, match.actor, cell), initial);
}

test("all eight horizontal, vertical, and diagonal winning lines are recognised", () => {
  for (const line of WINNING_LINES) {
    for (const mark of ["X", "O"] as const) {
      const board = Array<Cell>(9).fill(null);
      line.forEach((cell) => { board[cell] = mark; });
      assert.deepEqual(evaluateBoard(board), { mark, line: [...line], draw: false });
    }
  }
});

test("a winning ninth move takes precedence over a full-board draw", () => {
  const match = moves([0, 1, 2, 3, 4, 5, 7, 6, 8]);
  assert.equal(match.status, "finished");
  assert.equal(match.winner, 0);
  assert.equal(match.reason, "three-in-a-row");
  assert.deepEqual(match.line, [0, 4, 8]);
  assert.deepEqual(match.wins, [1, 0]);
  assert.equal(match.draws, 0);
  assert.ok(isValidMatch(match));
});

test("a full board without a line counts exactly one draw", () => {
  const match = moves([0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.equal(match.reason, "draw");
  assert.equal(match.winner, null);
  assert.equal(match.draws, 1);
  assert.deepEqual(match.wins, [0, 0]);
  assert.throws(() => playMove(match, match.actor, 8), { code: "ROUND_FINISHED" });
});

test("invalid, occupied, out-of-turn, and post-result moves cannot advance state", () => {
  const empty = createMatch();
  assert.throws(() => playMove(empty, 1, 0), { code: "NOT_YOUR_TURN" });
  for (const cell of [-1, 9, 1.5, NaN]) assert.throws(() => playMove(empty, 0, cell), { code: "ILLEGAL_MOVE" });
  const once = playMove(empty, 0, 0);
  assert.throws(() => playMove(once, 1, 0), { code: "ILLEGAL_MOVE" });
  assert.equal(once.revision, 1);
  assert.deepEqual(empty.board, Array(9).fill(null));
  const won = moves([0, 3, 1, 4, 2]);
  assert.throws(() => playMove(won, won.actor, 8), GameRuleError);
  assert.deepEqual(won.wins, [1, 0]);
});

test("rematches alternate X ownership and retain identity-based scores", () => {
  const first = moves([0, 3, 1, 4, 2]);
  const second = nextRound(first);
  assert.equal(second.xSeat, 1);
  assert.equal(second.actor, 1);
  assert.equal(markForSeat(second, 0), "O");
  assert.equal(second.round, 2);
  assert.deepEqual(second.wins, [1, 0]);
  const secondWin = moves([0, 3, 1, 4, 2], second);
  assert.deepEqual(secondWin.wins, [1, 1]);
  assert.equal(nextRound(secondWin).xSeat, 0);
  assert.throws(() => nextRound(createMatch()), { code: "ROUND_NOT_FINISHED" });
});

test("resignation and forfeits award an opponent win without a fabricated line", () => {
  for (const reason of ["resignation", "forfeit"] as const) {
    const result = resignMatch(playMove(createMatch(), 0, 4), 0, reason);
    assert.equal(result.winner, 1);
    assert.equal(result.reason, reason);
    assert.deepEqual(result.line, []);
    assert.deepEqual(result.wins, [0, 1]);
    assert.ok(isValidMatch(result));
    assert.throws(() => resignMatch(result, 0), { code: "ROUND_FINISHED" });
  }
});

test("Medium takes an immediate win before blocking and otherwise blocks", () => {
  assert.equal(computerMove(["X", "X", null, "O", "O", null, null, null, null], "O", "medium"), 5);
  assert.equal(computerMove(["X", "X", null, null, "O", null, null, null, null], "O", "medium"), 2);
});

test("computer choices preserve the input board and never choose occupied cells", () => {
  const board: Cell[] = ["X", null, null, null, "O", null, null, null, null];
  const before = [...board];
  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const cell = computerMove(board, "X", difficulty, () => 0.99);
    assert.notEqual(cell, null);
    assert.equal(board[cell!], null);
    assert.deepEqual(board, before);
  }
});

test("Hard cannot lose against any legal human move sequence as either X or O", () => {
  let completed = 0;
  function explore(match: Match) {
    assert.ok(isValidMatch(match));
    if (match.status === "finished") {
      completed += 1;
      assert.notEqual(match.winner, 0, "The human found a winning sequence against Hard.");
      return;
    }
    if (match.actor === 1) {
      const cell = computerMove(match.board, markForSeat(match, 1), "hard");
      assert.notEqual(cell, null);
      explore(playMove(match, 1, cell!));
    } else {
      match.board.forEach((mark, cell) => { if (mark === null) explore(playMove(match, 0, cell)); });
    }
  }
  explore(createMatch(0));
  explore(createMatch(1));
  assert.ok(completed > 100, "The check must cover branching human choices.");
});

test("saved rounds preserve pending handover, symbols, and scores", () => {
  const session: LocalSession = {
    version: 1, id: "test-session", mode: "pass-and-play", players: ["Alex", "Sam"], difficulty: "medium",
    match: playMove(createMatch(1), 1, 4), handover: true,
  };
  assert.deepEqual(parseSession(JSON.stringify(session)), session);
  const impossible = { ...session, match: { ...session.match, actor: 1 } };
  assert.equal(parseSession(JSON.stringify(impossible)), null);
  assert.equal(parseSession("{broken"), null);
  assert.equal(parseSession(JSON.stringify({ ...session, version: 99 })), null);
});

test("blocked storage never prevents local gameplay or recovery", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.deepEqual(loadSession(blocked), { session: null, damaged: false });
  const session: LocalSession = { version: 1, id: "test", mode: "computer", players: ["You", "Computer"], difficulty: "hard", match: createMatch(), handover: false };
  assert.equal(saveSession(blocked, session), false);
  const unrelated = new Map([["vihar-games:chess:session:v1", "keep-this"]]);
  const storage = { getItem(key: string) { return unrelated.get(key) ?? null; }, setItem(key: string, value: string) { unrelated.set(key, value); }, removeItem(key: string) { unrelated.delete(key); } };
  assert.ok(saveSession(storage, session));
  assert.equal(unrelated.get("vihar-games:chess:session:v1"), "keep-this");
  assert.ok(unrelated.has(SESSION_KEY));
});
