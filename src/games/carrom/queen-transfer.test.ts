import test from "node:test";
import assert from "node:assert/strict";
import { createMatch, resolveShot, type Match } from "./engine.ts";
import { queenJourney } from "./queen-transfer.ts";
import { simulate } from "./physics.ts";

function take(match: Match, pockets: string[], strikerPocketed = false, practice = false) {
  return resolveShot(match, { pieces: match.pieces.filter(p => !pockets.includes(p.id)), pockets, strikerPocketed, ejected: [] }, practice);
}

test("queen travels to either actual owner, stays there on cover, and returns on missed cover", () => {
  for (const side of ["cream", "ink"] as const) {
    const prefix = side === "cream" ? "c" : "d";
    const eligible = take(createMatch(side), [prefix + "0"]);
    const pickup = take(eligible, ["q"]);
    assert.deepEqual(queenJourney(eligible, pickup), { kind: "take", side, x: 300, y: 300 });
    assert.deepEqual(queenJourney(pickup, take(pickup, [prefix + "1"])), { kind: "cover", side, x: 300, y: 300 });
    const missed = take(pickup, []), queen = missed.pieces.find(p => p.id === "q")!;
    assert.deepEqual(queenJourney(pickup, missed), { kind: "return", side, x: queen.x, y: queen.y });
    const fouled = take(pickup, [], true);
    assert.equal(queenJourney(pickup, fouled)?.kind, "return");
  }
});

test("illegal queen pockets award no owner; practice and same-shot covers do", () => {
  const start = createMatch();
  assert.equal(queenJourney(start, take(start, ["q"])), null);
  const eligible = take(start, ["c0"]);
  assert.equal(queenJourney(eligible, take(eligible, ["q"], true)), null);
  assert.equal(queenJourney(eligible, take(eligible, ["q", "c1"]))?.kind, "take");
  assert.equal(queenJourney(start, take(start, ["q"], false, true))?.kind, "take");
  assert.equal(queenJourney(start, take(start, ["c0"])), null);
});

test("recorded impact sounds are bounded, in order, and never change shot physics", () => {
  const match = createMatch(), shot = { position: 0, angle: 0, power: 90 };
  const recorded = simulate(match, shot), silent = simulate(match, shot, false);
  assert.deepEqual(recorded.outcome, silent.outcome);
  assert.equal(recorded.duration, silent.duration);
  assert.deepEqual(silent.sounds, []);
  assert.ok(recorded.sounds.some(sound => sound.cue === "collision"));
  assert.ok(recorded.sounds.length < recorded.duration / .045 + 20);
  recorded.sounds.forEach((sound, i) => {
    assert.ok(sound.time >= 0 && sound.time <= recorded.duration);
    assert.ok(sound.strength >= .15 && sound.strength <= 1);
    if (i) assert.ok(sound.time >= recorded.sounds[i - 1].time);
  });
});
