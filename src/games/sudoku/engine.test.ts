import test from "node:test";
import assert from "node:assert/strict";
import { puzzleBank } from "./bank.ts";
import { solve, ratePuzzle, validGrid } from "./solver.ts";
import { addTime, check, choosePuzzle, conflicts, createRun, enter, hint, isComplete, pause, redo, restart, resume, undo, values, type Run } from "./engine.ts";
import { emptyRecords, loadRun, parseRun, recordResult, saveValue, SESSION_KEY } from "./persistence.ts";
const puzzle = puzzleBank.find((p) => p.difficulty === "easy")!;
const fresh = () => createRun(puzzle, "attempt-test");
const editable = puzzle.clues.indexOf("0");
const changed = (r: Run) => enter(r, editable, Number(puzzle.solution[editable]));

test("each shipped puzzle has exactly one solution and its declared technique rating", () => {
  assert.equal(puzzleBank.length, 18);
  assert.equal(new Set(puzzleBank.map((p) => p.id)).size, 18);
  for (const p of puzzleBank) {
    const result = solve(p.clues);
    assert.equal(result.exhausted, false, p.id);
    assert.equal(result.solutions.length, 1, p.id);
    assert.equal(result.solutions[0].join(""), p.solution, p.id);
    assert.equal(validGrid([...p.solution].map(Number), true), true);
    const rating = ratePuzzle(p.clues);
    assert.equal(rating?.difficulty, p.difficulty, p.id);
    assert.deepEqual(rating?.techniques, p.techniques);
  }
});
test("solver rejects invalid clues and never confuses a budget cutoff with uniqueness", () => {
  assert.equal(solve("11" + "0".repeat(79)).solutions.length, 0);
  assert.equal(solve("0".repeat(81), 1).exhausted, true);
  assert.equal(solve("0".repeat(81)).solutions.length, 2);
});
test("selection stays within difficulty and avoids immediate puzzle repetition", () => {
  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const first = choosePuzzle(difficulty, 0);
    assert.equal(choosePuzzle(difficulty, 0, first.id).difficulty, difficulty);
    assert.notEqual(choosePuzzle(difficulty, 0, first.id).id, first.id);
  }
});
test("all edits including notes and erasure protect clues and reject invalid coordinates", () => {
  const r = fresh(), fixed = [...puzzle.clues].findIndex((c) => c !== "0");
  for (const d of [0, 1, 9]) { assert.equal(enter(r, fixed, d), r); assert.equal(enter(r, fixed, d, true), r); }
  for (const i of [-1, 81, 1.5, NaN]) assert.equal(enter(r, i, 1), r);
  for (const d of [-1, 10, 1.5, NaN]) assert.equal(enter(r, editable, d), r);
});
test("notes toggle, never overwrite answers, and undo/redo restore notes and erased entries", () => {
  let r = enter(fresh(), editable, 2, true);
  r = enter(r, editable, 5, true);
  assert.equal(r.cells[editable].notes, 18);
  assert.equal(isComplete(r), false);
  assert.equal(enter(r, editable, 2, true).cells[editable].notes, 16);
  r = enter(r, editable, 7);
  assert.equal(r.cells[editable].notes, 0);
  assert.equal(enter(r, editable, 3, true), r);
  r = enter(r, editable, 0);
  assert.equal(undo(r).cells[editable].value, 7);
  assert.equal(undo(undo(r)).cells[editable].notes, 18);
  assert.equal(redo(undo(r)).cells[editable].value, 0);
  assert.equal(enter(undo(r), editable, 1).redo.length, 0);
});
test("conflicts identify row, column, and box without rejecting an entry", () => {
  for (const kind of ["row", "column", "box"]) {
    let witnessed = false;
    for (let i = 0; i < 81 && !witnessed; i++) {
      if (puzzle.clues[i] !== "0") continue;
      for (let d = 1; d <= 9; d++) {
        const r = enter(fresh(), i, d);
        if (conflicts(r, i).includes(kind)) { assert.equal(r.cells[i].value, d); witnessed = true; break; }
      }
    }
    assert.ok(witnessed, kind);
  }
});
test("a conflict-free wrong answer is allowed and only Check compares to solution", () => {
  const r = fresh();
  let found = false;
  for (let i = 0; i < 81 && !found; i++) {
    if (puzzle.clues[i] !== "0") continue;
    for (let d = 1; d <= 9; d++) {
      if (d === Number(puzzle.solution[i])) continue;
      const next = enter(r, i, d);
      if (!conflicts(next, i).length) {
        assert.deepEqual(next.checked, []);
        const checked = check(next);
        assert.deepEqual(checked.checked, [i]); assert.equal(checked.checks, 1); assert.equal(checked.cells[i].value, d);
        assert.equal(check(checked).checks, 2);
        found = true; break;
      }
    }
  }
  assert.ok(found);
});
test("hints replace wrong answers, avoid correct cells, and retain assistance on undo", () => {
  let r = enter(fresh(), editable, Number(puzzle.solution[editable]) % 9 + 1);
  const result = hint(r, editable);
  assert.equal(result.index, editable); r = result.run;
  assert.equal(r.cells[editable].value, Number(puzzle.solution[editable])); assert.equal(r.cells[editable].hinted, true);
  assert.equal(r.hints, 1);
  assert.notEqual(hint(r, editable).index, editable);
  assert.equal(undo(r).hints, 1);
  assert.equal(redo(undo(r)).cells[editable].hinted, true);
});
test("a full invalid grid and notes cannot win; a completed unique grid suspends edits", () => {
  let r = fresh();
  for (let i = 0; i < 81; i++) if (puzzle.clues[i] === "0") r = enter(r, i, 1);
  assert.equal(r.status, "active"); assert.equal(values(r).length, 81); assert.equal(isComplete(r), false);
  r = fresh();
  for (let i = 0; i < 81; i++) if (puzzle.clues[i] === "0") r = enter(r, i, Number(puzzle.solution[i]));
  assert.equal(r.status, "completed"); assert.equal(isComplete(r), true);
  assert.equal(enter(r, editable, 0), r); assert.equal(hint(r, editable).run, r); assert.equal(check(r), r);
});
test("pause excludes elapsed time and suspends every engine action; restart resets the attempt", () => {
  const r = pause(addTime(check(hint(changed(fresh()), editable).run), 12.25));
  assert.equal(addTime(r, 600), r); assert.equal(enter(r, editable, 2), r); assert.equal(undo(r), r); assert.equal(redo(r), r); assert.equal(check(r), r); assert.equal(hint(r, editable).run, r);
  assert.equal(addTime(resume(r), 2).elapsed, 14.25);
  const reset = restart(r, "new-attempt");
  assert.equal(reset.puzzle.id, r.puzzle.id); assert.equal(reset.restarted, true); assert.equal(reset.elapsed, 0); assert.equal(reset.hints, 0); assert.equal(reset.checks, 0); assert.equal(reset.undo.length, 0); assert.equal(reset.redo.length, 0); assert.ok(reset.cells.every((c) => !c.value && !c.notes));
});
test("save restores identity, notes, history, time and assistance in a paused state", () => {
  let r = enter(fresh(), editable, 3, true);
  r = hint(r, editable).run; r = check(r); r = addTime(r, 12.5); r = undo(r);
  const restored = parseRun(JSON.stringify(r))!;
  assert.ok(restored); assert.equal(restored.status, "paused");
  assert.deepEqual({ ...restored, status: r.status }, r);
  assert.equal(redo(resume(restored)).cells[editable].hinted, true);
});
test("corrupt, cross-game, obsolete, changed clues, impossible history and false completion saves are rejected", () => {
  assert.equal(parseRun("garbage"), null);
  assert.equal(parseRun(JSON.stringify({ game: "chess" })), null);
  const r = changed(fresh()), fixed = [...puzzle.clues].findIndex((c) => c !== "0");
  for (const corrupt of [
    { ...r, version: 2 }, { ...r, rulesVersion: "0.0.0" }, { ...r, elapsed: -1 }, { ...r, hints: 1.5 },
    { ...r, puzzle: { ...r.puzzle, clues: "0".repeat(81) } }, { ...r, status: "completed" },
    { ...r, cells: r.cells.map((c, i) => i === fixed ? { value: 9, notes: 0, hinted: false } : c) },
    { ...r, undo: [{ ...r.undo[0], before: { value: 3, notes: 0, hinted: false } }] },
    { ...r, redo: [{ ...r.undo[0], index: fixed }] },
  ]) assert.equal(parseRun(JSON.stringify(corrupt)), null);
});
test("blocked storage fails safely; invalid saves report recovery", () => {
  const denied = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(saveValue(denied, SESSION_KEY, fresh()), false);
  assert.deepEqual(loadRun({ getItem: () => "bad", setItem() {} }), { run: null, damaged: true });
});
test("records distinguish assisted and restarted attempts, and do not duplicate a refreshed win", () => {
  let r = hint(fresh(), editable).run;
  r = check(r);
  for (let i = 0; i < 81; i++) if (puzzle.clues[i] === "0") r = enter(r, i, Number(puzzle.solution[i]));
  const records = recordResult(emptyRecords(), { ...r, restarted: true }, "2026-11-14T10:00:00Z");
  assert.equal(records.entries.length, 1); assert.equal(records.entries[0].hints, 1); assert.equal(records.entries[0].checks, 1); assert.equal(records.entries[0].restarted, true);
  assert.equal(recordResult(records, r, "2026-11-14T10:01:00Z"), records);
  assert.equal(recordResult(emptyRecords(), fresh(), "2026-11-14T10:00:00Z").entries.length, 0);
});
