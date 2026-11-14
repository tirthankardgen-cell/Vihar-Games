import test from "node:test";
import assert from "node:assert/strict";
import { createRun, flap, step, validRun, sweepCircle, presets, STEP, WORLD, type Run } from "./engine.ts";
import { newSession, parseSession, saveSession, loadSession, loadSettings, loadRecords, emptyRecords, recordResult, SESSION_KEY, RECORDS_KEY, SETTINGS_KEY } from "./persistence.ts";

test("ready worlds use exact presets, a safe first opening, bounded reproducible gates", () => {
  for (const mode of ["standard", "practice"] as const) {
    const run = createRun(mode, 42), p = presets[mode];
    assert.deepEqual(run, createRun(mode, 42));
    assert.equal(run.y, 360); assert.equal(run.velocity, 0); assert.equal(run.status, "ready");
    assert.equal(run.gates[0].centre, 360);
    assert.equal((run.gates[0].x - WORLD.birdX - WORLD.radius) / p.speed, 2);
    for (let i = 1; i < run.gates.length; i++) {
      assert.equal(run.gates[i].x - run.gates[i - 1].x, p.spacing);
      assert.ok(Math.abs(run.gates[i].centre - run.gates[i - 1].centre) <= 90);
      assert.ok(run.gates[i].centre >= 210 && run.gates[i].centre <= 510);
    }
    assert.ok(validRun(run)); assert.equal(step(run), run);
  }
});
test("start is one flap, gravity is analytic, and flaps set rather than add velocity", () => {
  const ready = createRun("standard", 1), flying = flap(ready), after = step(flying);
  assert.equal(ready.status, "ready"); assert.equal(flying.velocity, -280);
  assert.equal(after.velocity, -280 + 900 * STEP);
  assert.ok(Math.abs(after.y - (360 - 280 * STEP + 450 * STEP * STEP)) < 1e-10);
  assert.equal(flap(flap(after)).velocity, -280);
  assert.ok(validRun(after));
});
test("terminal downward velocity is capped with an exact split at cap onset", () => {
  const run = { ...flap(createRun("standard", 2)), velocity: 359 };
  const after = step(run), t = 1 / 900;
  assert.equal(after.velocity, 360);
  assert.ok(Math.abs(after.y - (360 + 359 * t + 450 * t * t + 360 * (STEP - t))) < 1e-9);
});
test("swept curved paths catch tunnelling and exact edge tangency remains safe", () => {
  const rect = { left: 0, right: 10, top: 0, bottom: 10 };
  assert.equal(sweepCircle([-24, 48], [-12], rect), null);
  assert.notEqual(sweepCircle([-24, 48], [-11.99], rect), null);
  const hit = sweepCircle([5], [30, -120, 120], rect);
  assert.ok(hit !== null && hit > 0 && hit < .5);
  assert.equal(sweepCircle([-30, 5], [30], rect), null);
});
test("a gate scores once after its trailing edge; a simultaneous collision wins", () => {
  const base = flap(createRun("standard", 4));
  const gate = { ...base.gates[0], x: 56 + 140 * .004 };
  const safe = step({ ...base, gates: [gate, ...base.gates.slice(1)] });
  assert.equal(safe.score, 1); assert.equal(safe.gates[0].scored, true);
  assert.equal(step(safe).score, 1);
  const collision = step({ ...base, y: 438 - 360 * .004, velocity: 360, gates: [gate, ...base.gates.slice(1)] });
  assert.equal(collision.status, "ended"); assert.equal(collision.ending, "panel");
  assert.equal(collision.score, 0); assert.ok(Math.abs(collision.elapsed - .004) < 1e-8);
});
test("ceiling and floor collisions stop at first contact and results cannot flap", () => {
  for (const [y, velocity, reason, boundary] of [[52.1, -280, "ceiling", 52], [667.9, 360, "floor", 668]] as const) {
    const run = step({ ...flap(createRun("standard", 1)), y, velocity });
    assert.equal(run.status, "ended"); assert.equal(run.ending, reason);
    assert.ok(Math.abs(run.y - boundary) < 1e-8); assert.ok(run.elapsed < STEP);
    assert.equal(step(run), run); assert.equal(flap(run), run);
  }
});
test("seeded flight, appended gates, and saved continuation remain deterministic", () => {
  let run = flap(createRun("practice", 314));
  for (let i = 0; i < 700 && run.status !== "ended"; i++) {
    if (run.velocity > 160 && run.y > 350) run = flap(run);
    run = step(run);
    assert.ok(validRun(run), `invalid at step ${i}`);
  }
  assert.ok(run.elapsed > 2);
  const original = newSession("practice", 314, "test-flight");
  original.run = run;
  const restored = parseSession(JSON.stringify(original));
  assert.ok(restored);
  assert.deepEqual(step(restored.run), step(run));
});
test("sessions reject corrupt geometry, counts, versions and malformed storage", () => {
  const good = newSession("standard", 1, "saved-flight");
  assert.ok(parseSession(JSON.stringify(good)));
  for (const edit of [
    (s: typeof good) => { s.run.y = NaN; },
    (s: typeof good) => { s.run.velocity = 361; },
    (s: typeof good) => { s.run.gates[1].centre = 511; },
    (s: typeof good) => { s.run.gates[0].x += 5; },
    (s: typeof good) => { s.run.score = 90; },
    (s: typeof good) => { s.rulesVersion = "old"; },
    (s: typeof good) => { s.run.gates[1].id = s.run.gates[0].id; },
    (s: typeof good) => { s.run.random ^= 1; },
    (s: typeof good) => { s.remainder = STEP; },
  ]) {
    const s = structuredClone(good); edit(s); assert.equal(parseSession(JSON.stringify(s)), null);
  }
  assert.equal(parseSession("{"), null); assert.equal(parseSession(null), null);
});
test("storage is optional and only Paperwing keys are read or removed", () => {
  const values = new Map([["vihar-games:chess:session:v1", "keep"], [SESSION_KEY, "bad"]]);
  const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } };
  assert.equal(loadSession(storage).damaged, true);
  assert.equal(values.get("vihar-games:chess:session:v1"), "keep");
  assert.ok(saveSession(storage, newSession("practice", 3, "one")));
  assert.equal(loadSession(storage).session?.run.mode, "practice");
  const blocked = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); }, removeItem() { throw Error("blocked"); } };
  assert.equal(saveSession(blocked, newSession("standard", 0, "two")), false);
  assert.equal(loadSession(blocked).session, null);
  assert.equal(loadSettings(blocked).sound, false); assert.deepEqual(loadRecords(blocked), emptyRecords());
  assert.notEqual(SESSION_KEY, RECORDS_KEY); assert.notEqual(SETTINGS_KEY, RECORDS_KEY);
});
test("personal bests stay separate by mode and never record unfinished flights", () => {
  const records = emptyRecords(), ready = createRun("standard", 3);
  assert.equal(recordResult(records, ready), records);
  const end: Run = { ...ready, status: "ended", score: 7, elapsed: 20, ending: "panel" };
  const updated = recordResult(records, end);
  assert.equal(updated.standard.score, 7); assert.equal(updated.practice.score, 0);
  assert.equal(records.standard.score, 0); assert.equal(recordResult(updated, { ...end, score: 6 }), updated);
});
