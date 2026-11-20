import { sameClues, runs, type Mark } from "./engine.ts";
// Release validation only. Enumerate line candidates, propagate both directions,
// then exhaust every remaining branch. The browser never runs this solver.
export function candidates(size: number, clues: readonly number[]): Mark[][] {
  const result: Mark[][] = [];
  for (let mask = 0; mask < 2 ** size; mask++) {
    const line = Array.from({ length: size }, (_, i): Mark => mask & (1 << i) ? 1 : 2);
    if (sameClues(runs(line), clues)) result.push(line);
  }
  return result;
}
export function countSolutions(rows: readonly number[][], columns: readonly number[][], limit = 2): number {
  const size = rows.length; let count = 0;
  const visit = (r: Mark[][][], c: Mark[][][]) => {
    if (count >= limit) return;
    let changed = true;
    while (changed) {
      changed = false;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (!r[y].length || !c[x].length) return;
        const oldR = r[y].length, oldC = c[x].length;
        r[y] = r[y].filter((a) => c[x].some((b) => b[y] === a[x]));
        c[x] = c[x].filter((b) => r[y].some((a) => a[x] === b[y]));
        if (r[y].length !== oldR || c[x].length !== oldC) changed = true;
      }
    }
    if (r.some((line) => !line.length) || c.some((line) => !line.length)) return;
    let branch = -1;
    for (let y = 0; y < size; y++) if (r[y].length > 1 && (branch < 0 || r[y].length < r[branch].length)) branch = y;
    if (branch < 0) { count++; return; }
    for (const line of r[branch]) { const next = r.map((a) => [...a]); next[branch] = [line]; visit(next, c.map((a) => [...a])); }
  };
  visit(rows.map((a) => candidates(size, a)), columns.map((a) => candidates(size, a)));
  return count;
}
