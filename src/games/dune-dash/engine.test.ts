import test from "node:test";
import assert from "node:assert/strict";
import { createRun, duck, foxBox, jump, overlap, PHYSICS, scoreOf, speedAt, start, step, STEP, sweptCollision, validRun, WORLD, type Obstacle, type Run } from "./engine.ts";
import { emptyRecords, loadRecords, loadSession, loadSettings, newSession, parseSession, recordResult, saveValue, SESSION_KEY, SETTINGS_KEY, RECORDS_KEY } from "./persistence.ts";

const stone = (x: number, width = 40, height = 40): Obstacle => ({ id: 0, kind: "stone", x, width, height, bottom: 300, variant: 0 });
const bird = (x: number): Obstacle => ({ id: 2, kind: "bird", x, width: 50, height: 24, bottom: 264, variant: 0 });
const running = () => start(createRun("endless", 42));
const frames = (run: Run, count: number) => { for (let i = 0; i < count; i++) run = step(run); return run; };

test("Ready and ended runs do not simulate; score has only a distance source", () => {
  const ready = createRun("endless", 0);
  assert.equal(ready.seed, 1); assert.equal(step(ready), ready); assert.equal(jump(ready), ready);
  const result = step({ ...running(), nextId: 1, obstacles: [stone(130)] });
  assert.equal(result.status, "ended"); assert.equal(result.elapsed, 0); assert.equal(result.distance, 0); assert.equal(step(result), result);
  assert.equal(scoreOf({ ...result, distance: 99.99 }), 9);
});

test("One grounded jump follows the documented parabola and lands exactly", () => {
  let run = jump(running());
  assert.equal(run.velocity, -620); assert.equal(run.pose, "airborne"); assert.equal(jump(run), run); assert.equal(duck(run, true), run);
  run = frames(run, 30);
  assert.ok(Math.abs(run.feet - (300 - 620 * .25 + 900 * .25 ** 2)) < 1e-8);
  assert.ok(Math.abs(run.velocity - (-620 + 1800 * .25)) < 1e-8);
  run = frames(run, 60);
  assert.equal(run.feet, WORLD.ground); assert.equal(run.velocity, 0); assert.equal(run.pose, "standing");
  assert.equal(jump(run).velocity, PHYSICS.jump);
});

test("Duck changes the hitbox, jump stands, and swifts clear only the low pose", () => {
  const run = duck(running(), true);
  assert.deepEqual(foxBox(run), { left: 120, right: 166, top: 276, bottom: 300 });
  assert.equal(jump(run).pose, "airborne"); assert.equal(duck(run, false).pose, "standing");
  assert.equal(sweptCollision(run, bird(130), 420, STEP), null);
  assert.equal(sweptCollision(running(), bird(130), 420, STEP), 0);
});

test("Positive-area collision catches tunnelling and preserves safe edge tangency", () => {
  const box = foxBox(running());
  assert.equal(overlap(box, { left: box.right, right: box.right + 10, top: 270, bottom: 300 }), false);
  assert.equal(overlap(box, { left: 121, right: 150, top: box.bottom, bottom: 330 }), false);
  assert.equal(sweptCollision(running(), stone(300), 3000, .1), (300 - 154) / 3000);
  assert.equal(sweptCollision(running(), stone(200), 240, (200 - 154) / 240), null);
  assert.equal(sweptCollision({ pose: "standing", feet: 260, velocity: 0 }, stone(120), 240, STEP), null);
  const air = { pose: "airborne" as const, feet: 250, velocity: 180 };
  assert.ok(sweptCollision(air, stone(120, 52, 40), 240, .1) !== null);
});

test("A collision stops at first contact and never credits the rest of a step", () => {
  const run = { ...running(), nextId: 1, obstacles: [stone(155)] };
  const ended = step(run);
  assert.equal(ended.status, "ended"); assert.equal(ended.ending, "stone");
  assert.ok(Math.abs(ended.elapsed - 1 / 240) < 1e-10); assert.ok(Math.abs(ended.distance - 1) < 1e-10);
});

test("Speed rises only on completed ten-second boundaries; Practice is fixed", () => {
  assert.equal(speedAt("endless", 0), 240); assert.equal(speedAt("endless", 9.99), 240); assert.equal(speedAt("endless", 10), 248);
  assert.equal(speedAt("endless", 220), 416); assert.equal(speedAt("endless", 230), 420); assert.equal(speedAt("endless", 99999), 420);
  assert.equal(speedAt("practice", 99999), 180);
  let run = running();
  for (let i = 0; i < 2400; i++) run = step({ ...run, obstacles: [] });
  assert.equal(run.speedStage, 2); assert.ok(Math.abs(run.distance - 4880) < 1e-6);
});

test("Seeded generation reserves a fair opening, first stones, gap and full approach", () => {
  for (const mode of ["endless", "practice"] as const) {
    let run = start(createRun(mode, 983)), previous: Obstacle | null = null, birds = 0;
    for (let i = 0; i < 7200; i++) {
      const before = run;
      run = step({ ...run, obstacles: run.obstacles.filter(o => o.x > 200) });
      if (run.nextId !== before.nextId) {
        const next = run.obstacles.at(-1)!;
        assert.ok(run.elapsed >= 3 - 1e-9);
        if (next.id < 2) assert.equal(next.kind, "stone");
        if (next.kind === "stone") {
          const clearance = Math.sqrt(620 ** 2 - 2 * 1800 * next.height) / 900;
          assert.ok(clearance - (next.width + 34) / 180 >= STEP * 2, 'A stone must leave a reachable jump window even in fixed-step Practice');
        }
        if (next.kind === "bird") { assert.ok(run.elapsed >= 15); birds++; }
        assert.ok((WORLD.width - 166) / 420 >= 1.8);
        assert.ok(next.x >= WORLD.width);
        if (previous) assert.ok(before.spawnRemaining <= speedAt(mode, before.elapsed) * STEP + 1e-8);
        for (let n = 1; n < run.obstacles.length; n++) assert.ok(run.obstacles[n].x - run.obstacles[n - 1].x - run.obstacles[n - 1].width >= (mode === "practice" ? 180 : 420) * 1.1 - 1e-7);
        assert.ok(run.spawnRemaining >= next.width + (mode === "practice" ? 180 : 420) * 1.1 - 4);
        previous = next;
      }
    }
    assert.ok(run.nextId > 10); assert.ok(birds > 0);
  }
});

test("Every generated snapshot validates, including genuine collision results", () => {
  for (const mode of ["endless", "practice"] as const) {
    for (let seed = 1; seed <= 20; seed++) {
      let run = start(createRun(mode, seed));
      for (let i = 0; i < 1200 && run.status === "running"; i++) {
        if (i === 90 || i === 310) run = jump(run);
        run = step(run);
        assert.equal(validRun(run), true, `${mode} seed ${seed} frame ${i}`);
      }
      assert.equal(run.status, "ended");
    }
  }
});

test("Saving and restoring preserves the generator, jump, future obstacles and remainder", () => {
  let run = frames(running(), 400);
  run = jump(run);
  const session = { ...newSession("endless", 42, "test", "2026-11-14"), run, remainder: .001 };
  const restored = parseSession(JSON.stringify(session));
  assert.ok(restored); assert.deepEqual(restored, session);
  assert.deepEqual(frames({ ...run, obstacles: [] }, 1700), frames({ ...restored.run, obstacles: [] }, 1700));
  assert.equal(validRun(run), true);
});

test("Save validation rejects corrupt geometry, speeds, templates and unrelated schemas", () => {
  const session = newSession("practice", 10, "test", "2026-11-14");
  assert.ok(parseSession(JSON.stringify(session)));
  for (const bad of [{ ...session, version: 2 }, { ...session, rulesVersion: "9" }, { ...session, remainder: STEP }, { ...session, run: { ...session.run, feet: 301 } }, { ...session, run: { ...session.run, speedStage: 1 } }, { ...session, run: { ...session.run, pose: "ducking", velocity: -5 } }, { ...session, run: { ...session.run, nextId: 1, obstacles: [stone(1000)] } }, { ...session, run: null }]) assert.equal(parseSession(JSON.stringify(bad)), null);
  assert.equal(parseSession("{"), null); assert.equal(parseSession("null"), null);
});

test("Local records stay mode-specific and invalid storage remains recoverable", () => {
  const values = new Map<string, string>(), storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const ended: Run = { ...running(), status: "ended", ending: "stone", elapsed: 5, distance: 1234 };
  const records = recordResult(emptyRecords(), ended);
  assert.equal(records.endless.score, 123); assert.equal(records.practice.score, 0);
  assert.equal(recordResult(records, { ...ended, status: "running" }), records);
  assert.equal(recordResult(records, { ...ended, distance: 100 }), records);
  assert.ok(saveValue(storage, RECORDS_KEY, records)); assert.deepEqual(loadRecords(storage), records);
  assert.ok(saveValue(storage, SETTINGS_KEY, { version: 1, mode: "practice", sound: true, music: true })); assert.equal(loadSettings(storage).mode, "practice"); assert.equal(loadSettings(storage).music, true);
  values.set(SESSION_KEY, "broken"); assert.deepEqual(loadSession(storage), { session: null, damaged: true });
  assert.ok(saveValue(storage, SESSION_KEY, newSession("endless", 12, "fresh", "2026-11-14"))); assert.equal(loadSession(storage).damaged, false);
  const blocked = { ...storage, setItem() { throw Error("blocked"); } };
  assert.equal(saveValue(blocked, SESSION_KEY, newSession("endless", 1, "fresh", "2026-11-14")), false);
});
