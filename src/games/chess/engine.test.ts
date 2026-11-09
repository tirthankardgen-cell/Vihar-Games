import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { automaticResult, claimDraw, claimReason, createMatch, isSealedPawnPosition, makeMove, offerDraw, positionKey, repetitions, resign, respondToDraw, rewind, type Match, type MoveInput } from "./engine.ts";
import { chooseMove, levels } from "./computer.ts";
import { defaults, loadSession, newSession, parseSession, saveSession, SESSION_KEY } from "./persistence.ts";

function play(match: Match, ...sans: string[]): Match {
  for (const san of sans) {
    const board = new Chess(match.fen), move = board.moves({ verbose: true }).find((m) => m.san === san);
    assert.ok(move, `${san} is legal in ${match.fen}`);
    match = makeMove(match, move as MoveInput, board.turn());
  }
  return match;
}

test("standard start, immutable moves, and wrong-side/illegal moves", () => {
  const start = createMatch();
  assert.equal(new Chess(start.fen).moves().length, 20);
  assert.throws(() => makeMove(start, { from: "e7", to: "e5" }, "b"), /not your turn/);
  assert.throws(() => makeMove(start, { from: "e2", to: "e5" }, "w"), /not legal/);
  const next = play(start, "e4");
  assert.equal(next.moves.length, 1); assert.equal(start.moves.length, 0);
  assert.equal(new Chess(next.fen).turn(), "b");
});
test("castling moves both pieces, retains rights, and forbids check transit", () => {
  const start = createMatch("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  const result = play(start, "O-O", "O-O-O");
  assert.equal(new Chess(result.fen).get("f1")?.type, "r");
  assert.equal(new Chess(result.fen).get("d8")?.type, "r");
  for (const fen of ["4kr2/8/8/8/8/8/8/4K2R w K - 0 1", "4k3/8/8/8/8/8/4r3/4K2R w K - 0 1", "4k3/8/8/8/8/8/8/RN2K3 w Q - 0 1"]) {
    const m = createMatch(fen);
    assert.ok(!new Chess(m.fen).moves().some((move) => move.startsWith("O-O")));
  }
});
test("en passant is immediate, removes the correct pawn, and cannot expose king", () => {
  const ready = play(createMatch(), "e4", "a6", "e5", "d5");
  const captured = play(ready, "exd6");
  assert.equal(new Chess(captured.fen).get("d5"), undefined);
  assert.equal(new Chess(captured.fen).get("d6")?.color, "w");
  const missed = play(ready, "Nf3", "a5");
  assert.ok(!new Chess(missed.fen).moves().includes("exd6"));
  const pinned = createMatch("k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
  assert.throws(() => makeMove(pinned, { from: "e5", to: "d6" }, "w"), /not legal/);
});
test("promotion waits for a choice and supports all underpromotions", () => {
  const start = createMatch("7k/P7/8/8/8/8/8/4K3 w - - 0 1");
  assert.throws(() => makeMove(start, { from: "a7", to: "a8" }, "w"), /Choose/);
  for (const promotion of ["q", "r", "b", "n"] as const) {
    const result = makeMove(start, { from: "a7", to: "a8", promotion }, "w");
    assert.equal(new Chess(result.fen).get("a8")?.type, promotion);
  }
  assert.equal(new Chess(start.fen).get("a7")?.type, "p");
});
test("checkmate ends a real game and finished matches reject commands", () => {
  const mate = play(createMatch(), "f3", "e5", "g4", "Qh4#");
  assert.deepEqual(mate.result, { winner: "b", reason: "checkmate" });
  assert.throws(() => makeMove(mate, { from: "a2", to: "a3" }, "w"), /finished/);
  assert.throws(() => offerDraw(mate, "w"), /finished/);
  assert.throws(() => resign(mate, "w"), /finished/);
});
test("stalemate and dead material are distinguished from inability to force mate", () => {
  assert.equal(createMatch("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1").result?.reason, "stalemate");
  for (const fen of ["4k3/8/8/8/8/8/8/4K3 w - - 0 1", "4k3/8/8/8/8/8/8/3BK3 w - - 0 1", "4k3/8/8/8/8/8/8/3NK3 w - - 0 1"]) assert.equal(createMatch(fen).result?.reason, "dead-position");
  // Two knights cannot FORCE mate against a king, but a mating sequence exists.
  assert.equal(createMatch("4k3/8/8/8/8/8/8/2NNK3 w - - 0 1").result, null);
});
test("dead positions depend on bishop square colors and sealed pawn geometry", () => {
  assert.equal(createMatch("4k3/8/8/8/8/4b3/8/2B1K3 w - - 0 1").result?.reason, "dead-position");
  assert.equal(createMatch("4k3/8/8/8/8/3b4/8/2B1K3 w - - 0 1").result, null);
  const wall = new Chess("4k3/8/8/p1p1p1p1/PpPpPpPp/1P1P1P1P/8/4K3 w - - 0 1");
  assert.ok(isSealedPawnPosition(wall));
  assert.equal(createMatch(wall.fen()).result?.reason, "dead-position");
  const breach = new Chess("4k3/8/8/p1p1p1p1/P1PpPpPp/1P1P1P1P/8/4K3 w - - 0 1");
  assert.ok(!isSealedPawnPosition(breach));
});
test("third repetition is claimable, fifth is automatic", () => {
  const cycle = ["Nf3", "Nf6", "Ng1", "Ng8"];
  const third = play(createMatch(), ...cycle, ...cycle);
  assert.equal(repetitions(third), 3); assert.equal(third.result, null);
  assert.equal(claimDraw(third, "w").result?.reason, "threefold-repetition");
  assert.throws(() => claimDraw(third, "b"), /player to move/);
  const fifth = play(third, ...cycle, ...cycle);
  assert.equal(fifth.result?.reason, "fivefold-repetition");
});
test("repetition considers castling rights and only legal en passant captures", () => {
  const start = createMatch("4k2r/8/8/8/8/8/8/4K2R w Kk - 0 1");
  const returned = play(start, "Rh2", "Rh7", "Rh1", "Rh8");
  assert.notEqual(start.positionKeys[0], returned.positionKeys.at(-1));
  assert.equal(repetitions(returned), 1);
  assert.equal(positionKey(new Chess("k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1")), positionKey(new Chess("k3r3/8/8/3pP3/8/8/8/4K3 w - - 0 1")));
  assert.notEqual(positionKey(new Chess("k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1")), positionKey(new Chess("k7/8/8/3pP3/8/8/8/4K3 w - - 0 1")));
});
test("draw claims may declare an intended move without playing it", () => {
  const pending = play(createMatch(), "Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1");
  const intended = { from: "f6", to: "g8" } as const;
  assert.equal(claimReason(pending), null);
  assert.equal(claimReason(pending, intended), "threefold-repetition");
  const claimed = claimDraw(pending, "b", intended);
  assert.equal(claimed.result?.reason, "threefold-repetition"); assert.equal(claimed.fen, pending.fen);
  assert.throws(() => claimDraw(pending, "b", { from: "f6", to: "f8" }), /not legal/);
  assert.throws(() => claimDraw(createMatch(), "w"), /No draw claim/);
});
test("50-move claims, 75 automatic moves, and mate precedence", () => {
  const near = createMatch("4k3/8/8/8/8/8/8/R3K3 w - - 99 50");
  assert.equal(claimReason(near), null);
  assert.equal(claimReason(near, { from: "a1", to: "a2" }), "fifty-move-rule");
  const fifty = play(near, "Ra2");
  assert.equal(fifty.result, null); assert.equal(claimReason(fifty), "fifty-move-rule");
  const automatic = play(createMatch("4k3/8/8/8/8/8/8/R3K3 w - - 149 75"), "Ra2");
  assert.equal(automatic.result?.reason, "seventy-five-move-rule");
  const mate = play(createMatch("7k/4Q3/6K1/8/8/8/8/8 w - - 149 75"), "Qg7#");
  assert.equal(mate.result?.reason, "checkmate");
});
test("pawn moves and captures reset the half-move clock", () => {
  const pawn = play(createMatch("4k3/8/8/8/8/8/P7/4K3 w - - 99 50"), "a3");
  assert.equal(pawn.fen.split(" ")[4], "0");
  const capture = play(createMatch("4k3/8/8/8/8/8/r7/R3K3 w - - 99 50"), "Rxa2");
  assert.equal(capture.fen.split(" ")[4], "0");
});
test("draw offers require the opponent's consent and persist through the offerer's move", () => {
  const offered = offerDraw(createMatch(), "w");
  assert.throws(() => respondToDraw(offered, "w", true), /opponent/);
  const passed = play(offered, "e4"); assert.equal(passed.drawOffer, "w");
  assert.equal(respondToDraw(passed, "b", true).result?.reason, "agreement");
  assert.equal(respondToDraw(passed, "b", false).drawOffer, null);
  assert.equal(play(passed, "e5").drawOffer, null);
  assert.deepEqual(resign(passed, "b").result, { winner: "w", reason: "resignation" });
});
test("undo rebuilds special state and full repetition history", () => {
  const initial = play(createMatch(), "e4", "e5");
  const moved = play(initial, "Nf3", "Nc6");
  const back = rewind(moved, 2);
  assert.equal(back.fen, initial.fen); assert.deepEqual(back.positionKeys, initial.positionKeys);
  assert.ok(back.revision > moved.revision);
});
test("saved games replay safely, retain identity/level/side, and reject corrupt history", () => {
  const session = newSession("computer", { ...defaults, side: "b", difficulty: "hard" }, "test");
  session.match = play(session.match, "e4", "e5", "Nf3", "Nc6");
  const raw = JSON.stringify(session);
  assert.deepEqual(parseSession(raw), session);
  assert.equal(parseSession(raw)?.opponentId, "acharya-dev");
  assert.equal(parseSession(raw)?.humanSide, "b");
  assert.equal(parseSession(raw)?.difficulty, "hard");
  assert.equal(parseSession(JSON.stringify({ ...session, opponentId: "other" })), null);
  assert.equal(parseSession(JSON.stringify({ ...session, match: { ...session.match, positionKeys: [] } })), null);
  assert.equal(parseSession("{bad"), null);
  assert.equal(parseSession(JSON.stringify({ ...session, version: 3 })), null);
});
test("blocked storage does not prevent local play, keys are chess scoped", () => {
  const session = newSession("pass-and-play", defaults, "test");
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(saveSession(blocked, session), false);
  let saved = "";
  const storage = { getItem: (key: string) => key === SESSION_KEY ? saved : null, setItem: (key: string, value: string) => { assert.match(key, /^vihar-games:chess:/); saved = value; } };
  assert.equal(saveSession(storage, session), true); assert.deepEqual(loadSession(storage).session, session);
});
test("random side setup assigns each human or computer exactly one side", () => {
  const white = newSession("computer", { ...defaults, side: "random" }, "a", () => 0);
  const black = newSession("computer", { ...defaults, side: "random" }, "b", () => 1);
  assert.equal(white.humanSide, "w"); assert.equal(black.humanSide, "b");
  assert.equal(black.players.w, "Acharya Dev");
  const humans = newSession("pass-and-play", { ...defaults, side: "b", names: ["Asha", "Ravi"] }, "c");
  assert.deepEqual(humans.players, { w: "Ravi", b: "Asha" }); assert.equal(humans.opponentId, null);
});
for (const difficulty of ["easy", "medium", "hard"] as const) {
  test(`${difficulty} computer returns legal moves for either side within a bounded search`, () => {
    for (const match of [createMatch(), play(createMatch(), "e4")]) {
      const before = performance.now(), decision = chooseMove(match, difficulty, () => .5);
      assert.ok(decision && "move" in decision);
      assert.doesNotThrow(() => makeMove(match, decision.move, new Chess(match.fen).turn()));
      assert.ok(performance.now() - before < levels[difficulty].milliseconds + 1500);
      assert.equal(automaticResult(match), null);
    }
  });
}
test("computer finds mate, answers offers, and claims earned draws", () => {
  const mate = createMatch("7k/4Q3/6K1/8/8/8/8/8 w - - 0 1");
  const decision = chooseMove(mate, "hard"); assert.ok(decision && "move" in decision);
  assert.equal(makeMove(mate, decision.move, "w").result?.reason, "checkmate");
  const fifty = createMatch("4k3/8/8/8/8/8/8/R3K3 w - - 100 51");
  assert.deepEqual(chooseMove(fifty, "medium"), { claim: true });
  const offer = play(offerDraw(createMatch(), "w"), "e4");
  assert.ok("acceptDraw" in chooseMove(offer, "medium")!);
});
