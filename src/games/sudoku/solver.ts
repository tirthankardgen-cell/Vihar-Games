// Preparation/test utility only. Gameplay uses the validated bank and never runs a solver.
export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const units = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, n) => Math.floor(b / 3) * 27 + (b % 3) * 3 + Math.floor(n / 3) * 9 + n % 3)),
];
export const peers = Array.from({ length: 81 }, (_, i) => [...new Set(units.filter((u) => u.includes(i)).flat())].filter((n) => n !== i));
const candidates = (board: number[], i: number) => digits.filter((d) => !peers[i].some((p) => board[p] === d));
export function validGrid(board: readonly number[], complete = false): boolean {
  return board.length === 81 && board.every((d) => Number.isInteger(d) && d >= (complete ? 1 : 0) && d <= 9) && units.every((u) => {
    const values = u.map((i) => board[i]).filter(Boolean);
    return new Set(values).size === values.length;
  });
}

// MRV search, capped at two solutions and a node budget. Exhaustion never means unique.
export function solve(clues: string, budget = 100000): { solutions: number[][]; exhausted: boolean } {
  const board = [...clues].map(Number), solutions: number[][] = [];
  let nodes = 0, exhausted = false;
  if (!/^[0-9]{81}$/.test(clues) || !validGrid(board)) return { solutions, exhausted };
  const visit = () => {
    if (solutions.length >= 2 || exhausted) return;
    if (++nodes > budget) { exhausted = true; return; }
    let cell = -1, options: readonly number[] = digits;
    for (let i = 0; i < 81; i++) {
      if (board[i]) continue;
      const choices = candidates(board, i);
      if (!choices.length) return;
      if (cell < 0 || choices.length < options.length) { cell = i; options = choices; }
    }
    if (cell < 0) { solutions.push([...board]); return; }
    for (const d of options) { board[cell] = d; visit(); if (solutions.length >= 2 || exhausted) break; }
    board[cell] = 0;
  };
  visit();
  return { solutions, exhausted };
}

export type Difficulty = "easy" | "medium" | "hard";
export type Technique = "naked singles" | "hidden singles" | "locked candidates" | "naked pairs";
export function ratePuzzle(clues: string): { difficulty: Difficulty; techniques: Technique[] } | null {
  const board = [...clues].map(Number);
  if (!/^[0-9]{81}$/.test(clues) || !validGrid(board)) return null;
  const notes = board.map((v, i) => v ? [] : [...candidates(board, i)]), used = new Set<Technique>();
  const place = (i: number, value: number, technique: Technique) => {
    board[i] = value; notes[i] = [];
    for (const p of peers[i]) notes[p] = notes[p].filter((d) => d !== value);
    used.add(technique);
  };
  for (let step = 0; step < 1000; step++) {
    if (board.every(Boolean)) return validGrid(board, true) ? { difficulty: used.has("naked pairs") ? "hard" : used.has("hidden singles") || used.has("locked candidates") ? "medium" : "easy", techniques: [...used] } : null;
    if (notes.some((n, i) => !board[i] && !n.length)) return null;
    const single = notes.findIndex((n) => n.length === 1);
    if (single >= 0) { place(single, notes[single][0], "naked singles"); continue; }
    let changed = false;
    for (const u of units) {
      for (const d of digits) {
        const cells = u.filter((i) => notes[i].includes(d));
        if (cells.length === 1) { place(cells[0], d, "hidden singles"); changed = true; break; }
      }
      if (changed) break;
    }
    if (changed) continue;
    // Intersection removal covers pointing and claiming between boxes and lines.
    for (const u of units) {
      for (const d of digits) {
        const cells = u.filter((i) => notes[i].includes(d));
        if (cells.length < 2) continue;
        for (const other of units) {
          if (other === u || !cells.every((i) => other.includes(i))) continue;
          for (const i of other) if (!u.includes(i) && notes[i].includes(d)) { notes[i] = notes[i].filter((v) => v !== d); changed = true; }
        }
      }
    }
    if (changed) { used.add("locked candidates"); continue; }
    for (const u of units) {
      for (const i of u) {
        if (notes[i].length !== 2) continue;
        const twins = u.filter((j) => notes[j].length === 2 && notes[j].every((d) => notes[i].includes(d)));
        if (twins.length !== 2) continue;
        const pair = [...notes[i]];
        for (const j of u) if (!twins.includes(j) && notes[j].some((d) => pair.includes(d))) { notes[j] = notes[j].filter((d) => !pair.includes(d)); changed = true; }
      }
    }
    if (changed) { used.add("naked pairs"); continue; }
    return null; // Bank excludes puzzles requiring techniques beyond this evaluator.
  }
  return null;
}
