import test from "node:test";
import assert from "node:assert/strict";
import { addTime, createRun, derive, getPuzzle, hint, isComplete, lineState, lines, paint, pause, puzzles, redo, resume, runs, undo } from "./engine.ts";
import { countSolutions } from "./solver.ts";
import { defaultSettings, emptyRecords, loadRecords, loadRun, loadSettings, recordResult, RECORDS_KEY, SESSION_KEY, SETTINGS_KEY, validateRun } from "./persistence.ts";

test("every shipped original stencil has derived clues and exactly one solution", () => {
  for (const p of puzzles) {
    assert.equal(p.solution.length, p.size ** 2);
    assert.deepEqual(derive(p.solution, p.size), { rows: p.rows, columns: p.columns });
    assert.equal(countSolutions(p.rows, p.columns), p.witness.solutions, p.id);
    let r = createRun(p, p.id);
    r = paint(r, p.solution.flatMap((m, i) => m === 1 ? [i] : []), 1);
    assert.equal(r.status, "active", "Unknown empty cells cannot complete a stencil");
    r = paint(r, p.solution.flatMap((m, i) => m === 2 ? [i] : []), 2);
    assert.equal(r.status, "completed"); assert.ok(isComplete(r));
    assert.equal(paint(r, [0], 0), r, "results reject play input");
  }
});
test("ordered runs, separators, zero clues, and completed-line checking", () => {
  assert.deepEqual(runs([1, 1, 2, 1, 2]), [2, 1]);
  assert.equal(lineState([1, 1, 2, 1, 2], [2, 1]), "satisfied");
  assert.equal(lineState([1, 1, 1, 2, 2], [2, 1]), "contradictory");
  assert.equal(lineState([2, 1, 2, 1, 1], [2, 1]), "contradictory");
  assert.equal(lineState([2, 2, 2, 2, 2], [0]), "satisfied");
  assert.equal(lineState([1, 0, 2, 2, 2], [0]), "unfinished", "Unknown suppresses Check");
  const r = paint(createRun(puzzles[0], "check"), [0, 1, 2, 3, 4], 1);
  assert.equal(lines(r).rows[0], "contradictory"); assert.equal(lines(r).columns[0], "unfinished");
  assert.equal(r.assisted, false); assert.equal(r.hints, 0);
  assert.equal(countSolutions([[1], [1]], [[1], [1]]), 2, "validator detects ambiguous puzzles");
  assert.equal(countSolutions([[0], [0]], [[2], [0]]), 0, "validator detects impossible puzzles");
});
test("a drag is one undo transaction, each cell is applied once, and redo branches safely", () => {
  const start = createRun(puzzles[0], "drag"), painted = paint(start, [0, 1, 2, 2, -1, 99], 1);
  assert.equal(painted.undo.length, 1); assert.equal(painted.undo[0].length, 3);
  assert.deepEqual(undo(painted).cells, start.cells); assert.deepEqual(redo(undo(painted)).cells, painted.cells);
  const branch = paint(undo(painted), [4], 2); assert.equal(branch.redo.length, 0);
  assert.equal(paint(painted, [0], 1), painted, "a repeated state does not add undo");
});
test("selected-cell hints are cumulative and assistance survives erase and undo", () => {
  let r = addTime(createRun(puzzles[0], "hints"), 10);
  r = hint(r, 0); assert.equal(r.cells[0], 2); assert.equal(r.hints, 1); assert.ok(r.assisted);
  r = undo(r); assert.equal(r.cells[0], 0); assert.equal(r.hints, 1); assert.equal(r.elapsed, 10);
  r = redo(r); r = hint(r, 0); assert.equal(r.hints, 2, "requesting an already correct cell is still a hint");
  assert.equal(r.undo.length, 1); assert.equal(hint(r, -1), r);
  assert.equal(paint(pause(r), [1], 1).cells[1], 0); assert.equal(addTime(pause(r), 999).elapsed, 10);
  assert.equal(hint(pause(r), 1).hints, 2); assert.equal(resume(pause(r)).status, "active");
  assert.equal(addTime(r, Infinity), r); assert.equal(addTime(r, -1), r);
});
test("saves restore paused and reject corrupt dimensions, state, versions, counters, and history", () => {
  const r = undo(hint(paint(createRun(puzzles[1], "saved"), [10, 11, 12], 1), 0));
  const restored = validateRun(JSON.parse(JSON.stringify(r)))!;
  assert.equal(restored.status, "paused"); assert.deepEqual(restored.cells, r.cells); assert.deepEqual(restored.redo, r.redo);
  for (const patch of [{ version: 2 }, { puzzleVersion: 99 }, { puzzleId: "missing" }, { preset: "small" }, { cells: [0] }, { cells: r.cells.map(() => 3) }, { hints: -1 }, { hints: 1.5 }, { hints: 1, assisted: false }, { elapsed: Infinity }, { status: "completed" }, { undo: [[{ index: 99, before: 0, after: 2 }]] }, { redo: [[{ index: 0, before: 2, after: 1 }]] }]) assert.equal(validateRun({ ...r, ...patch }), null, JSON.stringify(patch));
  const injected = validateRun({ ...r, solution: [1], rows: [[99]] })!;
  assert.ok(!("solution" in injected)); assert.ok(!("rows" in injected)); assert.ok(getPuzzle(injected.puzzleId));
  assert.deepEqual(loadRun({ getItem: () => "garbled" }), { run: null, damaged: true });
  assert.deepEqual(loadRun({ getItem: () => null }), { run: null, damaged: false });
});
test("sound/music default on, mute choices persist, and storage is game scoped", () => {
  assert.ok(SESSION_KEY.startsWith("vihar-games:lantern-logic:")); assert.ok(SETTINGS_KEY.startsWith("vihar-games:lantern-logic:")); assert.ok(RECORDS_KEY.startsWith("vihar-games:lantern-logic:"));
  assert.deepEqual(loadSettings({ getItem: () => null }), defaultSettings);
  assert.deepEqual(loadSettings({ getItem: () => JSON.stringify({ sound: false, music: false, showTime: true, preset: "festival" }) }), { version: 1, sound: false, music: false, showTime: true, preset: "festival" });
  assert.deepEqual(loadSettings({ getItem: () => { throw new Error("denied"); } }), defaultSettings);
});
test("completions are deduplicated and assisted records remain distinct", () => {
  const p = puzzles[0], completed = { ...createRun(p, "plain"), cells: [...p.solution], status: "completed" as const };
  let records = recordResult(emptyRecords(), completed, "2026-11-20T08:00:00Z");
  records = recordResult(records, { ...completed, attemptId: "helped", hints: 2, assisted: true }, "2026-11-20T09:00:00Z");
  assert.equal(records.entries.length, 2); assert.equal(records.entries.filter((e) => e.assisted).length, 1);
  assert.equal(recordResult(records, completed, "2026-11-20T10:00:00Z"), records);
  assert.deepEqual(loadRecords({ getItem: () => JSON.stringify(records) }), records);
  assert.equal(recordResult(records, createRun(p, "unfinished"), "2026-11-20T10:00:00Z"), records);
  assert.equal(loadRecords({ getItem: () => JSON.stringify({ version: 1, entries: [{ ...records.entries[0], elapsed: -1 }] }) }).entries.length, 0);
});
