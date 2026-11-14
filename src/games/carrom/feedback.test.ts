import test from "node:test";
import assert from "node:assert/strict";
import { createMatch, opposite, resign, resolveShot, type Match, type Outcome, type Side } from "./engine.ts";
import { resultFeedback, shotFeedback } from "./feedback.ts";

const context = { mode: "computer" as const, humanSide: "cream" as Side };
function take(before: Match, ids: string[] = [], strikerPocketed = false, practice = false) {
  const outcome: Outcome = { pieces: before.pieces.filter(p => !ids.includes(p.id)), pockets: ids, strikerPocketed, ejected: [] };
  const after = resolveShot(before, outcome, practice);
  return { after, outcome, feedback: shotFeedback(before, after, outcome, { ...context, mode: practice ? "practice" : "computer" }) };
}

test("accepted own pockets earn varied praise and multiple coins earn a combo", () => {
  const first = take(createMatch(), ["c0"]);
  assert.equal(first.feedback?.kind, "pocket");
  assert.equal(first.feedback?.title, "Nice shot!");
  const second = take(first.after, ["c1"]);
  assert.equal(second.feedback?.title, "Great shot!");
  assert.equal(take(second.after, ["c2", "c3"]).feedback?.title, "Double delight!");
  assert.equal(take(second.after, ["c2", "c3", "c4"]).feedback?.title, "Three’s a charm!");
});

test("fouls take precedence over pocket and queen celebrations on either side", () => {
  for (const side of ["cream", "ink"] as const) {
    const prefix = side === "cream" ? "c" : "d";
    const before = take(createMatch(side), [prefix + "0"]).after;
    const result = take(before, [prefix + "1", prefix + "2", "q"], true);
    assert.equal(result.after.queen, "board");
    assert.equal(result.feedback?.kind, "foul");
    assert.match(result.feedback!.note, side === "cream" ? /Striker down/ : /Ravi/);
  }
});

test("queen pickup, successful cover and missed cover are distinct accepted events", () => {
  for (const side of ["cream", "ink"] as const) {
    const prefix = side === "cream" ? "c" : "d";
    const eligible = take(createMatch(side), [prefix + "0"]).after;
    const pickup = take(eligible, ["q"]);
    assert.equal(pickup.feedback?.kind, "queen");
    assert.equal(take(pickup.after, [prefix + "1"]).feedback?.kind, "cover");
    assert.equal(take(pickup.after).feedback?.kind, "return");
    assert.equal(take(eligible, ["q", prefix + "1"]).feedback?.title, "Queen covered!");
  }
});

test("an early queen and an uncovered last coin are never celebrated as legal pockets", () => {
  assert.equal(take(createMatch(), ["q", "c0"]).feedback?.kind, "return");
  const before = createMatch();
  before.pocketed.cream = Array.from({ length:8 }, (_, i) => `c${i}`);
  before.pieces = before.pieces.filter(p => !before.pocketed.cream.includes(p.id));
  assert.equal(take(before, ["c8"]).feedback?.title, "One step early.");
});

test("opponent coins and debt repayment do not produce own-pocket praise", () => {
  const gift = take(createMatch(), ["d0"]);
  assert.equal(gift.feedback?.kind, "gift");
  const debt = createMatch();
  debt.debt.cream = 1;
  assert.equal(take(debt, ["c0"]).feedback?.kind, "debt");
  assert.equal(take(createMatch()).feedback, null);
});

test("practice celebrates both colors without inventing penalties or cover requirements", () => {
  assert.equal(take(createMatch(), ["c0", "d0"], false, true).feedback?.kind, "combo");
  assert.equal(take(createMatch(), ["q"], false, true).feedback?.title, "Queen pocketed!");
  assert.match(take(createMatch(), [], true, true).feedback!.note, /No penalty/);
});

test("a legal finish replaces shot feedback and identifies the winner for either human color", () => {
  for (const winner of ["cream", "ink"] as const) {
    const prefix = winner === "cream" ? "c" : "d";
    const before = createMatch(winner);
    before.queen = "covered"; before.coverSide = winner;
    before.pocketed[winner] = Array.from({ length:8 }, (_, i) => prefix + i);
    before.pieces = before.pieces.filter(p => p.id !== "q" && !before.pocketed[winner].includes(p.id));
    const { after, outcome } = take(before, [prefix + "8"]);
    assert.equal(after.result?.winner, winner);
    for (const humanSide of [winner, opposite(winner)]) {
      const view = { ...context, humanSide };
      assert.equal(shotFeedback(before, after, outcome, view), null);
      assert.equal(resultFeedback(after, view)?.kind, humanSide === winner ? "win" : "loss");
      assert.equal(resultFeedback(after, view)?.title, humanSide === winner ? "You won!" : "Ravi wins.");
    }
    assert.equal(resultFeedback(JSON.parse(JSON.stringify(after)), { mode:"pass-and-play", humanSide:winner })?.kind, "win");
  }
});

test("resignation and a completed practice board have appropriate persistent results", () => {
  assert.equal(resultFeedback(resign(createMatch()), context)?.title, "Ravi wins.");
  const complete = createMatch(); complete.pieces = [];
  assert.equal(resultFeedback(complete, { mode:"practice", humanSide:"cream" })?.title, "A clean sweep!");
});
