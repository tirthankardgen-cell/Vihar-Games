export const RULES_VERSION = "2026-11-20";
export const PUZZLE_VERSION = 1;
export const presets = ["small", "workshop", "festival"] as const;
export type Preset = typeof presets[number];
export type Mark = 0 | 1 | 2; // Unknown, Lit, Empty
export const labels: Record<Preset, string> = { small: "Small glow", workshop: "Workshop", festival: "Festival" };
export const sizes: Record<Preset, number> = { small: 5, workshop: 10, festival: 15 };
export type Puzzle = { id: string; version: number; preset: Preset; title: string; size: number; solution: Mark[]; rows: number[][]; columns: number[][]; witness: { solutions: 1; method: "exhaustive-line-search" } };
export type Change = { index: number; before: Mark; after: Mark };
export type Transaction = Change[];
export type Run = { version: 1; rulesVersion: string; puzzleId: string; puzzleVersion: number; preset: Preset; attemptId: string; cells: Mark[]; undo: Transaction[]; redo: Transaction[]; hints: number; assisted: boolean; elapsed: number; status: "active" | "paused" | "completed" };

export function runs(line: readonly number[]): number[] {
  const values: number[] = []; let length = 0;
  for (const mark of [...line, 2]) { if (mark === 1) length++; else if (length) { values.push(length); length = 0; } }
  return values.length ? values : [0];
}
export const sameClues = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((n, i) => n === b[i]);
export function derive(solution: readonly Mark[], size: number) {
  return { rows: Array.from({ length: size }, (_, r) => runs(solution.slice(r * size, (r + 1) * size))), columns: Array.from({ length: size }, (_, c) => runs(Array.from({ length: size }, (_, r) => solution[r * size + c]))) };
}
function authored(id: string, preset: Preset, title: string, art: string[]): Puzzle {
  const size = sizes[preset];
  if (art.length !== size || art.some((r) => r.length !== size || /[^.#]/.test(r))) throw new Error(`Invalid puzzle ${id}`);
  const solution = [...art.join("")].map((c): Mark => c === "#" ? 1 : 2);
  return { id, version: PUZZLE_VERSION, preset, title, size, solution, ...derive(solution, size), witness: { solutions: 1, method: "exhaustive-line-search" } };
}
// Original stencils. Titles and illustrations are revealed only on completion.
export const puzzles: readonly Puzzle[] = [
  authored("ll-s01", "small", "A little heart", [".#.#.", "#####", "#####", ".###.", "..#.."]),
  authored("ll-w01", "workshop", "The evening lantern", ["...####...", "....##....", "..######..", ".########.", ".##.##.##.", ".##.##.##.", ".########.", "..######..", "....##....", "...#..#..."]),
  authored("ll-f01", "festival", "Lotus at dusk", [".......#.......", "......###......", "...#..###..#...", "..###.###.###..", "..###########..", "...#########...", ".#..#######..#.", "###..#####..###", "###############", ".#############.", "...#########...", ".....#####.....", ".......#.......", "....#######....", "..............."]),
];
export const getPuzzle = (id: string) => puzzles.find((p) => p.id === id);
export const puzzleFor = (preset: Preset) => puzzles.find((p) => p.preset === preset)!;
export function createRun(puzzle: Puzzle, attemptId: string): Run {
  return { version: 1, rulesVersion: RULES_VERSION, puzzleId: puzzle.id, puzzleVersion: puzzle.version, preset: puzzle.preset, attemptId, cells: Array<Mark>(puzzle.size ** 2).fill(0), undo: [], redo: [], hints: 0, assisted: false, elapsed: 0, status: "active" };
}
export function lineState(cells: readonly Mark[], clue: readonly number[]): "unfinished" | "satisfied" | "contradictory" {
  if (cells.includes(0)) return "unfinished";
  return sameClues(runs(cells), clue) ? "satisfied" : "contradictory";
}
export function lines(run: Run) {
  const p = getPuzzle(run.puzzleId)!;
  return { rows: p.rows.map((clue, r) => lineState(run.cells.slice(r * p.size, (r + 1) * p.size), clue)), columns: p.columns.map((clue, c) => lineState(Array.from({ length: p.size }, (_, r) => run.cells[r * p.size + c]), clue)) };
}
export function isComplete(run: Run): boolean {
  if (run.cells.includes(0)) return false;
  const states = lines(run); return [...states.rows, ...states.columns].every((s) => s === "satisfied");
}
function completed(run: Run): Run { return isComplete(run) ? { ...run, status: "completed" } : run; }
// One call represents one pointer gesture, or one keyboard/tool action.
export function paint(run: Run, indices: readonly number[], mark: Mark): Run {
  if (run.status !== "active" || ![0, 1, 2].includes(mark)) return run;
  const changes = [...new Set(indices)].filter((i) => Number.isInteger(i) && i >= 0 && i < run.cells.length && run.cells[i] !== mark).map((index) => ({ index, before: run.cells[index], after: mark }));
  if (!changes.length) return run;
  const cells = [...run.cells]; for (const c of changes) cells[c.index] = c.after;
  return completed({ ...run, cells, undo: [...run.undo, changes].slice(-1000), redo: [] });
}
export function hint(run: Run, index: number): Run {
  if (run.status !== "active" || !Number.isInteger(index) || index < 0 || index >= run.cells.length) return run;
  const next = paint(run, [index], getPuzzle(run.puzzleId)!.solution[index]);
  return { ...next, hints: run.hints + 1, assisted: true };
}
export function undo(run: Run): Run {
  if (run.status !== "active" || !run.undo.length) return run;
  const t = run.undo.at(-1)!, cells = [...run.cells]; for (const c of t) cells[c.index] = c.before;
  return { ...run, cells, undo: run.undo.slice(0, -1), redo: [...run.redo, t] };
}
export function redo(run: Run): Run {
  if (run.status !== "active" || !run.redo.length) return run;
  const t = run.redo.at(-1)!, cells = [...run.cells]; for (const c of t) cells[c.index] = c.after;
  return completed({ ...run, cells, redo: run.redo.slice(0, -1), undo: [...run.undo, t] });
}
export const pause = (run: Run): Run => run.status === "active" ? { ...run, status: "paused" } : run;
export const resume = (run: Run): Run => run.status === "paused" ? { ...run, status: "active" } : run;
export const addTime = (run: Run, seconds: number): Run => run.status === "active" && Number.isFinite(seconds) && seconds > 0 ? { ...run, elapsed: Math.min(31536000, run.elapsed + seconds) } : run;
export const formatTime = (elapsed: number) => `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed) % 60).padStart(2, "0")}`;
