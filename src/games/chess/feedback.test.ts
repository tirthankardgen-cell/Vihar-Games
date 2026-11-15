import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { createMatch, makeMove, rewind, type Match, type MoveInput } from "./engine.ts";
import { moveFeedback } from "./feedback.ts";

function play(match: Match, ...moves: string[]) {
  for (const san of moves) {
    const board = new Chess(match.fen);
    const move = board.moves({ verbose: true }).find(move => move.san === san);
    assert.ok(move, `${san} must be legal`);
    match = makeMove(match, move as MoveInput, board.turn());
  }
  return match;
}

test("capture feedback follows the human side and stays quiet for computer captures", () => {
  const white = play(createMatch(), "e4", "d5");
  const black = play(createMatch(), "e4", "d5", "Nc3");
  for (const [before, san, human, computer] of [[white, "exd5", "w", "b"], [black, "dxe4", "b", "w"]] as const) {
    const after = play(before, san);
    assert.equal(moveFeedback(before, after, human)?.label, "Piece captured");
    assert.equal(moveFeedback(before, after, computer), null);
    assert.equal(moveFeedback(before, after)?.label, "Piece captured");
  }
});

test("castling and promotion receive specific feedback", () => {
  const castle = createMatch("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  assert.equal(moveFeedback(castle, play(castle, "O-O"))?.label, "Castled");
  const promotion = createMatch("8/P6k/8/8/8/8/8/4K3 w - - 0 1");
  assert.equal(moveFeedback(promotion, play(promotion, "a8=Q"))?.label, "Pawn promoted");
});

test("check is reported for either side while checkmate is reserved for the result overlay", () => {
  const before = play(createMatch(), "e4", "e5", "Nf3", "Nc6", "Bc4", "d6");
  const checked = play(before, "Bxf7+");
  assert.equal(moveFeedback(before, checked, "b")?.tone, "alert");
  const mate = play(createMatch(), "f3", "e5", "g4");
  assert.equal(moveFeedback(mate, play(mate, "Qh4#")), null);
});

test("ordinary moves, restored games, and undo do not repeat celebrations", () => {
  const start = createMatch(), opening = play(start, "e4");
  assert.equal(moveFeedback(start, opening), null);
  const captured = play(opening, "d5", "exd5");
  assert.equal(moveFeedback(start, captured), null);
  assert.equal(moveFeedback(captured, captured), null);
  assert.equal(moveFeedback(captured, rewind(captured, 1)), null);
});
