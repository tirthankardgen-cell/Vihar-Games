import test from "node:test";
import assert from "node:assert/strict";
import { advance, clearTurns, createRun, step, turn, validRun, type Cell, type Run } from "./engine.ts";
import { defaultSettings, loadSettings, newSession, parseSession, recordResult, emptyRecords, saveSession, loadSession, SESSION_KEY } from "./persistence.ts";

test("opening, seeded leaves, growth and constant score", () => {
  for (let seed = 0; seed < 1000; seed++) {
    const run = createRun("flow", seed); assert.ok(validRun(run)); assert.deepEqual(run, createRun("flow", seed));
    assert.deepEqual(run.body, [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]);
  }
  const run = { ...createRun(), leaf: { x: 11, y: 10 } }, next = step(run);
  assert.equal(next.score, 1); assert.equal(next.body.length, 4); assert.ok(validRun(next));
  assert.equal(next.body.at(-1)?.x, 8); assert.notDeepEqual(next.leaf, next.body[0]);
  assert.equal(step(next).score, 1);
});
test("two buffered turns apply on separate ticks; reversals, repeats and overflow ignored", () => {
  const run = createRun(); assert.equal(turn(run, "left"), run); assert.equal(turn(run, "right"), run);
  const first = turn(run, "up"); assert.equal(turn(first, "down"), first); assert.equal(turn(first, "up"), first);
  const queued = turn(first, "left"); assert.equal(turn(queued, "down"), queued);
  const a = step(queued); assert.equal(a.direction, "up"); assert.deepEqual(a.queue, ["left"]);
  const b = step(a); assert.equal(b.direction, "left"); assert.deepEqual(b.body[0], { x: 9, y: 9 });
  assert.ok(validRun(b)); assert.deepEqual(clearTurns(queued).queue, []);
});
test("tail vacates legally; true body and wall collisions end at last legal position", () => {
  const square: Run = { ...createRun(), body: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }], direction: "up", score: 1, leaf: { x: 12, y: 12 } };
  assert.ok(validRun(square)); const next = step(turn(square, "left")); assert.equal(next.status, "playing"); assert.ok(validRun(next));
  const loop: Run = { ...square, body: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 }], score: 2 };
  const collision = step(turn(loop, "left")); assert.equal(collision.reason, "body"); assert.deepEqual(collision.body, loop.body); assert.ok(validRun(collision));
  const wall = step({ ...createRun(), body: [{ x: 19, y: 0 }, { x: 18, y: 0 }, { x: 17, y: 0 }], leaf: { x: 0, y: 1 } });
  assert.equal(wall.reason, "wall"); assert.ok(validRun(wall)); assert.equal(step(wall), wall);
});
test("full garden wins at 400 cells and 397 leaves without advancing the generator", () => {
  const path: Cell[] = [];
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) path.push({ x: y % 2 ? 19 - x : x, y });
  const run: Run = { ...createRun(), body: path.slice(1), leaf: path[0], score: 396, direction: "left" };
  assert.ok(validRun(run)); const win = step(run);
  assert.equal(win.reason, "complete"); assert.equal(win.score, 397); assert.equal(win.body.length, 400); assert.equal(win.leaf, null); assert.equal(win.random, run.random); assert.ok(validRun(win));
});
test("rates match 60/144 Hz, remainder survives pause, and delayed frames cannot fast forward", () => {
  for (const [preset, rate] of [["calm", 5], ["flow", 8], ["swift", 11]] as const) {
    const run: Run = { ...createRun(preset), body: [{ x: 3, y: 10 }, { x: 2, y: 10 }, { x: 1, y: 10 }], leaf: { x: 0, y: 0 } };
    for (const hz of [60, 144]) {
      let state = { run, remainder: 0 }; for (let i = 0; i < hz; i++) state = advance(state.run, state.remainder, 1000 / hz);
      assert.equal(state.run.body[0].x, 3 + rate); assert.ok(Math.abs(state.run.elapsedMs - 1000) < .001);
    }
    const halfway = advance(run, 0, 40), saved = parseSession(JSON.stringify({ ...newSession(preset, 1, "pause"), ...halfway }));
    assert.ok(saved); assert.equal(saved.remainder, halfway.remainder);
    assert.deepEqual(advance(saved.run, saved.remainder, 20), advance(halfway.run, halfway.remainder, 20));
    assert.equal(advance(run, 0, 60000).run.body[0].x, 4);
  }
});
test("save validation rejects corrupt body, leaf, counters, versions and queues; restores without input", () => {
  const s = newSession("flow", 42, "saved");
  const invalid = [null, { ...s, version: 2 }, { ...s, rulesVersion: "0.0" }, { ...s, remainder: 125 }, { ...s, run: { ...s.run, score: 9 } }, { ...s, run: { ...s.run, body: [{ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 8, y: 10 }] } }, { ...s, run: { ...s.run, leaf: s.run.body[0] } }, { ...s, run: { ...s.run, direction: "up" } }, { ...s, run: { ...s.run, queue: ["up", "down"] } }, { ...s, run: { ...s.run, elapsedMs: -1 } }];
  for (const value of invalid) assert.equal(parseSession(JSON.stringify(value)), null);
  let raw = ""; const storage = { getItem: () => raw, setItem: (_: string, value: string) => { raw = value; }, removeItem: () => { raw = ""; } };
  assert.ok(saveSession(storage, { ...s, run: turn(s.run, "up") })); assert.deepEqual(loadSession(storage).session?.run.queue, []);
  raw = "damaged"; assert.equal(loadSession(storage).damaged, true); assert.equal(raw, "");
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
  assert.equal(loadSession(blocked).unavailable, true); assert.equal(saveSession(blocked, s), false); assert.ok(SESSION_KEY.includes("silk-trail"));
});
test("sound/music default on, saved mute persists, records stay within the preset", () => {
  assert.equal(defaultSettings.sound, true); assert.equal(defaultSettings.music, true);
  const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }; assert.deepEqual(loadSettings(storage), defaultSettings);
  const muted = { ...defaultSettings, sound: false, music: false }; assert.deepEqual(loadSettings({ ...storage, getItem: () => JSON.stringify(muted) }), muted);
  assert.deepEqual(loadSettings({ ...storage, getItem: () => "broken" }), defaultSettings);
  const run = { ...createRun("calm"), status: "ended" as const, reason: "wall" as const, score: 4 };
  const records = recordResult(emptyRecords(), run); assert.equal(records.calm, 4); assert.equal(records.flow, 0); assert.equal(records.swift, 0);
});
