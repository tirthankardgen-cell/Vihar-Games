import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createRun, drawShape, emptyGrid, fits, ghostPiece, gravityMs, grounded, HIDDEN, lockPiece, masks, MAX_RESETS, pieceCells, rotateCells, SHAPES, spawnPiece, step, STEP_MS, validRun, type Run, type Shape } from "./engine.ts";
import { createInput } from "./input.ts";
import { emptyRecords, loadRecords, loadSession, loadSettings, newSession, parseSession, recordResult, RECORDS_KEY, saveSession, saveValue, SESSION_KEY, SETTINGS_KEY, type StorageLike } from "./persistence.ts";

const elapsed = (run: Run, ms: number): Run => { for (let i = 0; i < ms; i += STEP_MS) run = step(run); return run; };
const withPiece = (shape: Shape, x: number, y: number): Run => ({ ...createRun("standard", 13), active: { ...spawnPiece(shape), x, y } });
const store = (): StorageLike => { const values = new Map<string, string>(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } }; };

test("every seven-piece bag contains every shape once, including seed zero", () => {
  for (const seed of [0, 1, 13, 0xffffffff]) {
    let generator = { bag: [] as Shape[], rng: createRun("standard", seed).rng };
    for (let bag = 0; bag < 50; bag++) {
      const shapes: Shape[] = [];
      for (let i = 0; i < 7; i++) { const next = drawShape(generator); generator = next.generator; shapes.push(next.shape); }
      assert.deepEqual([...shapes].sort(), [...SHAPES].sort());
      assert.equal(generator.bag.length, 0);
    }
  }
});
test("spawn masks, centring, and minimal rotations use the documented cells", () => {
  for (const shape of SHAPES) {
    const piece = spawnPiece(shape), width = Math.max(...piece.cells.map((c) => c.x)) + 1;
    assert.equal(piece.y, -2); assert.equal(piece.x, Math.floor((10 - width) / 2));
    assert.equal(piece.cells.length, 4); assert.ok(fits(emptyGrid(), piece));
    let cells = masks[shape];
    for (let i = 0; i < 4; i++) cells = rotateCells(cells);
    assert.deepEqual(cells.map((c) => `${c.x},${c.y}`).sort(), masks[shape].map((c) => `${c.x},${c.y}`).sort());
  }
  assert.deepEqual(rotateCells(masks.T), [{ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }]);
});
test("rotation tries 0, -1, +1, -2, +2 without vertical kicks", () => {
  const vertical = { ...spawnPiece("I"), cells: rotateCells(masks.I), x: 9, y: 3 };
  const tooFar = { ...createRun("standard", 4), active: vertical };
  assert.equal(act(tooFar, "rotate"), tooFar);
  const atEight = act({ ...createRun("standard", 4), active: { ...vertical, x: 8 } }, "rotate");
  assert.equal(atEight.active.x, 6); assert.equal(atEight.active.y, 3);
  const run = withPiece("T", 4, 5);
  run.grid[HIDDEN + 7][4] = "J"; // Anchor fit is blocked; -1 is the first legal fit.
  assert.equal(act(run, "rotate").active.x, 3);
  const plus = withPiece("T", 4, 5);
  plus.grid[HIDDEN + 7][3] = "J"; plus.grid[HIDDEN + 7][4] = "J";
  assert.equal(act(plus, "rotate").active.x, 5);
  const floor = withPiece("I", 3, 19);
  assert.equal(act(floor, "rotate"), floor);
  const square = withPiece("O", 4, 18); square.lockStarted = true; square.lockRemaining = 100;
  assert.equal(act(square, "rotate"), square);
});
test("moves respect walls and settled cells; gravity and rejected soft drops do not score", () => {
  const edge = withPiece("O", 0, 18);
  assert.equal(act(edge, "left"), edge); assert.equal(act(edge, "soft-drop"), edge);
  const run = withPiece("O", 3, 4);
  const down = act(run, "soft-drop"); assert.equal(down.active.y, 5); assert.equal(down.score, 1);
  const automatic = elapsed(run, 800); assert.equal(automatic.active.y, 5); assert.equal(automatic.score, 0);
  run.grid[HIDDEN + 4][5] = "Z";
  assert.equal(act(run, "right"), run);
});
test("ghost cells exactly equal the hard-drop settlement and distance score", () => {
  for (const shape of SHAPES) {
    const run = withPiece(shape, 2, -2), ghost = ghostPiece(run), drop = act(run, "hard-drop");
    for (const { x, y } of pieceCells(ghost)) assert.equal(drop.grid[HIDDEN + y][x], shape);
    assert.equal(drop.score, (ghost.y - run.active.y) * 2); assert.equal(drop.placed, 1);
    assert.equal(drop.active.shape, run.next[0]); assert.equal(drop.canHold, true);
  }
});
test("empty hold consumes preview once; swap restores spawn orientation and timers", () => {
  let run = withPiece("T", 6, 5), next = act(run, "hold");
  assert.equal(next.hold, "T"); assert.equal(next.active.shape, run.next[0]); assert.equal(next.canHold, false);
  assert.deepEqual(next.next.slice(0, 2), run.next.slice(1)); assert.equal(act(next, "hold"), next);
  next = act(next, "hard-drop"); assert.equal(next.canHold, true);
  run = { ...next, active: { ...next.active, cells: rotateCells(next.active.cells), x: 1, y: 8 }, lockRemaining: 85, lockResets: 9 };
  const swapped = act(run, "hold");
  assert.deepEqual(swapped.active, spawnPiece("T")); assert.deepEqual(swapped.next, run.next);
  assert.equal(swapped.lockRemaining, 400); assert.equal(swapped.lockResets, 0); assert.equal(swapped.canHold, false);
});
test("lock delay lasts exactly 400 grounded milliseconds", () => {
  const run = { ...withPiece("O", 4, 18), lockStarted: true };
  assert.equal(elapsed(run, 395).placed, 0); assert.equal(elapsed(run, 400).placed, 1);
  const airborne = withPiece("O", 4, 10);
  assert.equal(elapsed(airborne, 400).lockRemaining, 400);
});
test("landing starts the delay after contact, not before the landing gravity step", () => {
  const run = withPiece("O", 4, 17), landed = elapsed(run, 800);
  assert.equal(landed.active.y, 18); assert.equal(landed.lockRemaining, 400); assert.ok(landed.lockStarted);
  assert.equal(elapsed(landed, 395).placed, 0); assert.equal(elapsed(landed, 400).placed, 1);
});
test("grounded adjustments reset at most ten times and failed actions do not reset", () => {
  let run: Run = { ...withPiece("O", 4, 18), lockStarted: true };
  for (let i = 0; i < MAX_RESETS; i++) {
    run = elapsed(run, 200); run = act(run, i % 2 ? "left" : "right");
    assert.equal(run.lockRemaining, 400); assert.equal(run.lockResets, i + 1);
  }
  run = elapsed(run, 300); run = act(run, "right");
  assert.equal(run.lockRemaining, 100); assert.equal(run.lockResets, 10);
  assert.equal(elapsed(run, 100).placed, 1);
  const wall = { ...withPiece("O", 0, 18), lockStarted: true, lockRemaining: 90, lockResets: 3 };
  assert.equal(act(wall, "left"), wall); assert.equal(act(wall, "rotate"), wall);
});
test("becoming airborne suspends the remainder without replenishing reset allowance", () => {
  let run: Run = { ...withPiece("O", 3, 10), lockStarted: true, lockRemaining: 150, lockResets: 10 };
  run.grid[HIDDEN + 12][3] = "I";
  assert.ok(grounded(run)); run = act(run, "right"); assert.ok(!grounded(run));
  assert.equal(run.lockRemaining, 150); assert.equal(elapsed(run, 400).lockRemaining, 150);
  assert.equal(run.lockResets, 10);
});
for (const count of [1, 2, 3, 4]) test(`${count}-row clear is simultaneous and scores at the pre-clear level`, () => {
  const run: Run = { ...withPiece("I", 3, 20 - count), rows: 9, level: 1 };
  run.active.cells = rotateCells(masks.I);
  run.active.y = 16; // The upper cells of this shape remain after clears smaller than four.
  for (let y = 20 - count; y < 20; y++) run.grid[HIDDEN + y] = Array.from({ length: 10 }, (_, x) => x === 3 ? null : "O");
  run.grid[HIDDEN + 8][0] = "J";
  const next = lockPiece(run);
  assert.equal(next.rows, 9 + count); assert.equal(next.level, 1 + Math.floor((9 + count) / 10));
  assert.equal(next.score, [0, 100, 300, 500, 800][count]); assert.equal(next.grid[HIDDEN + 8 + count][0], "J");
  assert.deepEqual(next.lastClear, Array.from({ length: count }, (_, i) => 20 - count + i));
  assert.equal(next.next[0], run.next[1]);
});
test("non-adjacent complete rows shift all intervening rows correctly", () => {
  const run = withPiece("I", 3, 16); run.active.cells = rotateCells(masks.I);
  for (const y of [16, 18]) run.grid[HIDDEN + y] = Array.from({ length: 10 }, (_, x) => x === 3 ? null : "O");
  run.grid[HIDDEN + 17][0] = "L";
  const next = lockPiece(run); assert.deepEqual(next.lastClear, [16, 18]);
  assert.equal(next.grid[HIDDEN + 18][0], "L"); assert.equal(next.grid[HIDDEN + 19][3], "I");
});
test("hidden-cell top-out takes precedence over a row that would become complete", () => {
  const run = withPiece("O", 3, -1);
  run.grid[HIDDEN] = Array.from({ length: 10 }, (_, x) => x === 3 || x === 4 ? null : "J");
  const next = lockPiece(run);
  assert.equal(next.status, "ended"); assert.equal(next.reason, "window-full");
  assert.equal(next.rows, 0); assert.equal(next.score, 0); assert.equal(next.placed, 0);
  assert.deepEqual(next.grid, run.grid); assert.deepEqual(next.next, run.next); assert.deepEqual(next.bag, run.bag);
});
test("blocked held-piece spawn ends immediately without accepting more actions", () => {
  const run = withPiece("T", 0, 4); run.hold = "O"; run.grid[HIDDEN - 2][4] = "J";
  const next = act(run, "hold"); assert.equal(next.status, "ended"); assert.equal(next.reason, "spawn-blocked");
  assert.equal(act(next, "hard-drop"), next); assert.equal(step(next), next);
});
test("practice slows gravity only, with matching score and lock rules", () => {
  assert.equal(gravityMs(1, "standard"), 800); assert.equal(gravityMs(14, "standard"), 80);
  assert.equal(gravityMs(1, "practice"), 1600); assert.equal(gravityMs(100, "practice"), 160);
  const run = createRun("practice", 4); assert.equal(elapsed(run, 1595).active.y, -2); assert.equal(elapsed(run, 1600).active.y, -1);
  const standard = act(createRun("standard", 4), "hard-drop"), practice = act(run, "hard-drop");
  assert.equal(practice.score, standard.score);
});
test("keyboard and touch repeat clocks have exact delays and edge actions never repeat", () => {
  for (const token of ["key:ArrowLeft", "pointer:1"]) {
    const input = createInput(); assert.deepEqual(input.press(token, "left"), ["left"]);
    assert.deepEqual(input.press(token, "left"), []); assert.deepEqual(input.advance(165), []);
    assert.deepEqual(input.advance(5), ["left"]); assert.deepEqual(input.advance(70), ["left"]);
    input.release(token); assert.deepEqual(input.advance(1000), []);
  }
  const input = createInput(); input.press("down", "soft-drop");
  assert.deepEqual(input.advance(40), []); assert.deepEqual(input.advance(5), ["soft-drop"]);
  input.clear(); input.press("space", "hard-drop"); input.press("c", "hold"); input.press("up", "rotate");
  assert.deepEqual(input.advance(1000), []); input.clear(); assert.deepEqual(input.advance(1000), []);
});
test("last held horizontal direction takes priority and pause clears repeats", () => {
  const input = createInput(); input.press("a", "left"); input.press("b", "right");
  assert.deepEqual(input.advance(170), ["right"]); input.release("b"); assert.deepEqual(input.advance(170), ["left"]);
  input.clear(); assert.deepEqual(input.advance(1000), []);
});
test("fixed-step simulation matches 30, 60, and 144 Hz and partial frame saves", () => {
  const simulate = (fps: number) => {
    let run = createRun("standard", 71), remainder = 0;
    const input = createInput(); input.press("down", "soft-drop");
    for (let frame = 0; frame < fps * 2; frame++) {
      remainder += 1000 / fps;
      while (remainder + 1e-8 >= STEP_MS) {
        for (const action of input.advance(STEP_MS)) run = act(run, action);
        run = step(run); remainder -= STEP_MS;
      }
    }
    return run;
  };
  assert.deepEqual(simulate(30), simulate(60)); assert.deepEqual(simulate(60), simulate(144));
});
test("save restoration preserves preview, hold, random state, gravity, and lock counters", () => {
  let session = newSession("standard", 117, "test-window");
  session = { ...session, run: elapsed(act(session.run, "hold"), 315), remainder: 2.5 };
  const raw = JSON.stringify(session), restored = parseSession(raw); assert.ok(restored); assert.deepEqual(restored, session);
  for (const action of ["hard-drop", "hold", "right", "rotate", "hard-drop", "left", "hard-drop"] as const) {
    session = { ...session, run: act(session.run, action) };
    restored.run = act(restored.run, action);
  }
  assert.deepEqual(restored.run, session.run); assert.ok(validRun(session.run));
});
test("reachable sessions including grounded spawns and ended runs remain valid", () => {
  for (let seed = 1; seed < 40; seed++) {
    let run = createRun("standard", seed); assert.ok(validRun(run));
    for (let i = 0; i < 40 && run.status === "playing"; i++) {
      run = elapsed(act(run, "hard-drop"), 5);
      assert.ok(validRun(run), `seed ${seed}, placed ${run.placed}, status ${run.status}`);
    }
    assert.equal(run.status, "ended"); assert.equal(step(run), run);
  }
});
test("malformed masks, collisions, bags, counters, versions, and dimensions are rejected", () => {
  const session = newSession("standard", 42, "save");
  const damage: ((s: typeof session) => void)[] = [
    (s) => { s.rulesVersion = "old"; }, (s) => { s.remainder = 5; },
    (s) => { s.run.grid.pop(); }, (s) => { s.run.active.cells[0] = { ...s.run.active.cells[1] }; },
    (s) => { s.run.active.x = 99; }, (s) => { s.run.active.y = -5; },
    (s) => { s.run.bag = ["I", "I"]; }, (s) => { s.run.next.pop(); }, (s) => { s.run.rng = 0; },
    (s) => { s.run.level = 2; }, (s) => { s.run.score = -1; }, (s) => { s.run.elapsedMs = Infinity; },
    (s) => { s.run.gravityRemaining = 900; }, (s) => { s.run.lockRemaining = 401; }, (s) => { s.run.lockResets = 11; },
    (s) => { s.run.grid[HIDDEN][0] = "I"; }, (s) => { s.run.grid[0][0] = "O"; },
  ];
  for (const mutate of damage) { const damaged = structuredClone(session); mutate(damaged); assert.equal(parseSession(JSON.stringify(damaged)), null); }
  for (const raw of [null, "", "null", "{", "{}", "a".repeat(24001)]) assert.equal(parseSession(raw), null);
  const collision = structuredClone(session); collision.run.active.y = 18; collision.run.grid[HIDDEN + 18][collision.run.active.x] = "I";
  assert.equal(parseSession(JSON.stringify(collision)), null);
});
test("invalid or unavailable storage recovers and never overwrites another game", () => {
  const storage = store(); storage.setItem("vihar-games:chess:save:v1", "chess"); storage.setItem(SESSION_KEY, "bad");
  assert.equal(loadSession(storage).damaged, true); assert.equal(storage.getItem(SESSION_KEY), null);
  assert.ok(saveSession(storage, newSession("practice", 3, "new"))); assert.equal(loadSession(storage).session?.run.preset, "practice");
  assert.equal(storage.getItem("vihar-games:chess:save:v1"), "chess");
  const unavailable: StorageLike = { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("full"); }, removeItem: () => {} };
  assert.equal(loadSession(unavailable).unavailable, true); assert.equal(saveSession(unavailable, newSession("standard", 1, "x")), false);
  assert.deepEqual(loadSettings(unavailable), { preset: "standard", sound: false, music: false });
});
test("only finished runs record a best, with separate preset and rules records", () => {
  const records = emptyRecords(), run = createRun("standard", 5);
  assert.equal(recordResult(records, { ...run, score: 100 }), records);
  const bests = recordResult(records, { ...run, status: "ended", reason: "window-full", score: 400, rows: 10, level: 2, elapsedMs: 1000 });
  assert.equal(bests.standard.score, 400); assert.equal(bests.practice.score, 0);
  assert.equal(recordResult(bests, { ...run, status: "ended", score: 300 }), bests);
  const storage = store(); assert.ok(saveValue(storage, RECORDS_KEY, bests)); assert.deepEqual(loadRecords(storage), bests);
  assert.ok(saveValue(storage, SETTINGS_KEY, { preset: "practice", sound: true, music: true })); assert.deepEqual(loadSettings(storage), { preset: "practice", sound: true, music: true });
  storage.setItem(RECORDS_KEY, JSON.stringify({ ...bests, rulesVersion: "old" })); assert.deepEqual(loadRecords(storage), records);
});
test("sound and music preferences recover older settings and reject malformed audio flags", () => {
  const storage = store(); storage.setItem(SETTINGS_KEY, JSON.stringify({ preset: "practice", sound: true }));
  assert.deepEqual(loadSettings(storage), { preset: "practice", sound: true, music: false });
  storage.setItem(SETTINGS_KEY, JSON.stringify({ preset: "standard", sound: false, music: "yes" }));
  assert.deepEqual(loadSettings(storage), { preset: "standard", sound: false, music: false });
});
