import test from "node:test";
import assert from "node:assert/strict";
import { adjacent, hint, move, newRun, PUZZLES, redo, slide, solutionPath, solved, target, undo } from "./engine.ts";
import { addRecord, loadRecords, loadSession, recordKey, saveSession, validateRun } from "./persistence.ts";
test("all six authored boards have exact IDs, a legal witness, and a verified solution", () => {
  assert.equal(PUZZLES.length, 6);
  for (const p of PUZZLES) {
    let tiles = target(p.size);
    for (const tile of p.witness) { const next = slide(tiles, tile, p.size); assert.ok(next); tiles = next; }
    assert.deepEqual(tiles, p.initial); assert.equal(solved(tiles), false);
    assert.deepEqual([...tiles].sort((a, b) => a - b), Array.from({ length: p.size * p.size }, (_, i) => i));
    let run = newRun(p);
    for (const tile of solutionPath(run)!) run = move(run, tile);
    assert.equal(solved(run.tiles), true); assert.deepEqual(run.tiles, target(p.size)); assert.equal(move(run, 1), run);
  }
});
test("only orthogonal neighbours move, with no row wrap, diagonal, zero, or distant swap", () => {
  assert.equal(adjacent(2, 3, 3), false); assert.equal(adjacent(0, 4, 3), false);
  for (const p of PUZZLES) {
    const run = newRun(p);
    for (const tile of run.tiles) {
      const legal = tile !== 0 && adjacent(run.tiles.indexOf(tile), run.empty, p.size), next = move(run, tile);
      if (!legal) assert.equal(next, run);
      else { assert.equal(next.moves, 1); assert.equal(next.tiles[run.empty], tile); assert.equal(next.tiles[run.tiles.indexOf(tile)], 0); }
    }
  }
});
test("undo/redo keep cumulative counters, preserve solution witnesses, and branch correctly", () => {
  let run = { ...newRun(PUZZLES[1]), elapsedMs: 1250 };
  const first = move(run, solutionPath(run)![0]); const second = move(first, solutionPath(first)![0]);
  run = undo(second); assert.deepEqual(run.tiles, first.tiles); assert.equal(run.moves, 2); assert.equal(run.elapsedMs, 1250);
  const back = redo(run); assert.deepEqual(back.tiles, second.tiles); assert.equal(back.moves, 2);
  const other = run.tiles.find(t => t !== second.history[1] && t && adjacent(run.tiles.indexOf(t), run.empty, run.size))!;
  const branch = move(run, other); assert.equal(branch.moves, 3); assert.equal(branch.history.length, 2); assert.equal(redo(branch), branch);
  assert.ok(solutionPath(branch)); assert.ok(validateRun(branch));
});
test("hints are verified, record assistance, and still solve after detours and undo", () => {
  for (const p of PUZZLES) {
    let run = newRun(p);
    const tile = run.tiles.find(t => t && adjacent(run.tiles.indexOf(t), run.empty, run.size))!;
    run = move(run, tile); run = move(run, tile); run = undo(run);
    const before = [...run.tiles], suggestion = hint(run); assert.ok(suggestion.tile); assert.deepEqual(suggestion.run.tiles, before); assert.equal(suggestion.run.moves, run.moves); assert.equal(suggestion.run.hints, 1); assert.equal(suggestion.run.assisted, true);
    run = suggestion.run;
    for (const step of solutionPath(run)!) run = move(run, step);
    assert.ok(solved(run.tiles)); assert.equal(hint(run).tile, null);
  }
  const broken = { ...newRun(PUZZLES[0]), tiles: target(3), puzzleId: "missing" }; assert.equal(solutionPath(broken), null);
});
test("saves restore exact undo/redo state and reject corruption, forged reachability, and old versions", () => {
  const initial = newRun(PUZZLES[0]), first = move(initial, solutionPath(initial)![0]), second = move(first, solutionPath(first)![0]);
  const run = { ...undo(second), elapsedMs: 3234 }; assert.deepEqual(loadSession(saveSession(run)), run);
  assert.equal(loadSession("broken"), null); assert.equal(loadSession(JSON.stringify({ schema: 2, run })), null);
  for (const patch of [{ version: "0" }, { size: 5 }, { empty: 0 }, { moves: -1 }, { elapsedMs: Infinity }, { elapsedMs: -1 }, { hints: 1 }, { cursor: 999 }, { history: [0] }, { tiles: Array(9).fill(0) }]) assert.equal(validateRun({ ...run, ...patch }), null);
  const forged = [...run.tiles]; [forged[0], forged[1]] = [forged[1], forged[0]]; assert.equal(validateRun({ ...run, tiles: forged, empty: forged.indexOf(0) }), null);
});
test("records rank moves then time within puzzle, version, and assistance", () => {
  let run = newRun(PUZZLES[0]); for (const tile of solutionPath(run)!) run = move(run, tile);
  run = { ...run, elapsedMs: 5000 }; const best = addRecord({}, run), key = recordKey(run);
  assert.equal(addRecord(best, { ...run, moves: run.moves + 1, elapsedMs: 1 }), best);
  assert.equal(addRecord(best, { ...run, elapsedMs: 6000 }), best);
  assert.equal(addRecord(best, { ...run, elapsedMs: 4000 })[key].elapsedMs, 4000);
  const assisted = { ...run, assisted: true, hints: 1 }; assert.equal(Object.keys(addRecord(best, assisted)).length, 2);
  assert.deepEqual(loadRecords(JSON.stringify(best)), best); assert.deepEqual(loadRecords("bad"), {});
  assert.deepEqual(loadRecords(JSON.stringify({ [key]: { ...best[key], moves: -1 } })), {});
  assert.deepEqual(addRecord({}, newRun(PUZZLES[0])), {});
});
