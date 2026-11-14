import { puzzleBank, type Puzzle } from "./bank.ts";
import type { Difficulty } from "./solver.ts";
export type { Difficulty } from "./solver.ts";
export const RULES_VERSION = "1.0.0";
export const difficulties = ["easy", "medium", "hard"] as const;
export const difficultyLabels = { easy: "Easy", medium: "Medium", hard: "Hard" };
export const difficultyDescriptions = { easy: "Find the single possibility.", medium: "Look for hidden singles and shared candidates.", hard: "Unpick pairs, then follow the deductions." };
export type Cell = { value: number; notes: number; hinted: boolean };
export type Edit = { index: number; before: Cell; after: Cell };
export type Run = {
  version: 1; rulesVersion: string; attemptId: string; puzzle: Puzzle;
  cells: Cell[]; undo: Edit[]; redo: Edit[]; elapsed: number;
  hints: number; checks: number; checked: number[]; restarted: boolean;
  status: "active" | "paused" | "completed";
};
const emptyCell = (): Cell => ({ value: 0, notes: 0, hinted: false });
export const noteDigits = (mask: number) => Array.from({ length: 9 }, (_, n) => n + 1).filter((d) => mask & (1 << (d - 1)));
export function choosePuzzle(difficulty: Difficulty, random: number, previousId?: string): Puzzle {
  const options = puzzleBank.filter((p) => p.difficulty === difficulty && p.id !== previousId);
  return options[Math.floor(Math.max(0, Math.min(0.999999999, random)) * options.length)];
}
export function createRun(puzzle: Puzzle, attemptId: string, restarted = false): Run {
  return { version: 1, rulesVersion: RULES_VERSION, attemptId, puzzle, cells: Array.from({ length: 81 }, emptyCell), undo: [], redo: [], elapsed: 0, hints: 0, checks: 0, checked: [], restarted, status: "active" };
}
export function values(run: Run): number[] { return run.cells.map((c, i) => Number(run.puzzle.clues[i]) || c.value); }
export function related(a: number, b: number): boolean {
  return Math.floor(a / 9) === Math.floor(b / 9) || a % 9 === b % 9 || Math.floor(a / 27) === Math.floor(b / 27) && Math.floor(a % 9 / 3) === Math.floor(b % 9 / 3);
}
export function conflicts(run: Run, index: number): string[] {
  const board = values(run), value = board[index];
  if (!value) return [];
  const kinds: string[] = [];
  for (let i = 0; i < 81; i++) {
    if (i === index || board[i] !== value) continue;
    if (Math.floor(i / 9) === Math.floor(index / 9) && !kinds.includes("row")) kinds.push("row");
    if (i % 9 === index % 9 && !kinds.includes("column")) kinds.push("column");
    if (Math.floor(i / 27) === Math.floor(index / 27) && Math.floor(i % 9 / 3) === Math.floor(index % 9 / 3) && !kinds.includes("box")) kinds.push("box");
  }
  return kinds;
}
export function isComplete(run: Run): boolean {
  // The bank is unique; solution equality implies all row, column and box rules.
  return values(run).join("") === run.puzzle.solution;
}
function commit(run: Run, index: number, after: Cell): Run {
  const before = run.cells[index];
  if (before.value === after.value && before.notes === after.notes && before.hinted === after.hinted) return run;
  const cells = run.cells.map((c, i) => i === index ? after : c);
  const next = { ...run, cells, undo: [...run.undo, { index, before, after }], redo: [], checked: run.checked.filter((i) => i !== index) };
  return { ...next, status: isComplete(next) ? "completed" : "active" };
}
export function enter(run: Run, index: number, digit: number, notes = false): Run {
  if (run.status !== "active" || !Number.isInteger(index) || index < 0 || index > 80 || run.puzzle.clues[index] !== "0" || !Number.isInteger(digit) || digit < 0 || digit > 9) return run;
  if (digit === 0) return commit(run, index, emptyCell());
  if (notes) {
    if (run.cells[index].value) return run;
    return commit(run, index, { value: 0, notes: run.cells[index].notes ^ (1 << (digit - 1)), hinted: false });
  }
  return commit(run, index, { value: digit, notes: 0, hinted: false });
}
export function undo(run: Run): Run {
  if (run.status !== "active" || !run.undo.length) return run;
  const edit = run.undo.at(-1)!;
  return { ...run, cells: run.cells.map((c, i) => i === edit.index ? edit.before : c), undo: run.undo.slice(0, -1), redo: [...run.redo, edit], checked: [] };
}
export function redo(run: Run): Run {
  if (run.status !== "active" || !run.redo.length) return run;
  const edit = run.redo.at(-1)!;
  const next = { ...run, cells: run.cells.map((c, i) => i === edit.index ? edit.after : c), undo: [...run.undo, edit], redo: run.redo.slice(0, -1), checked: [] };
  return { ...next, status: isComplete(next) ? "completed" : "active" };
}
export function check(run: Run): Run {
  if (run.status !== "active") return run;
  return { ...run, checks: run.checks + 1, checked: run.cells.flatMap((c, i) => c.value && c.value !== Number(run.puzzle.solution[i]) ? [i] : []) };
}
export function hint(run: Run, preferred: number): { run: Run; index: number | null } {
  if (run.status !== "active") return { run, index: null };
  const board = values(run), unresolved = (i: number) => run.puzzle.clues[i] === "0" && board[i] !== Number(run.puzzle.solution[i]);
  const index = Number.isInteger(preferred) && preferred >= 0 && preferred < 81 && unresolved(preferred) ? preferred : board.findIndex((_, i) => unresolved(i));
  if (index < 0) return { run, index: null };
  return { run: { ...commit(run, index, { value: Number(run.puzzle.solution[index]), notes: 0, hinted: true }), hints: run.hints + 1 }, index };
}
export const pause = (run: Run): Run => run.status === "active" ? { ...run, status: "paused" } : run;
export const resume = (run: Run): Run => run.status === "paused" ? { ...run, status: "active" } : run;
export const addTime = (run: Run, seconds: number): Run => run.status === "active" && Number.isFinite(seconds) && seconds > 0 ? { ...run, elapsed: run.elapsed + seconds } : run;
export const restart = (run: Run, attemptId: string): Run => createRun(run.puzzle, attemptId, true);
export function formatTime(seconds: number): string {
  const total = Math.floor(seconds), minutes = Math.floor(total / 60);
  return `${minutes < 60 ? minutes : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`}:${String(total % 60).padStart(2, "0")}`;
}
