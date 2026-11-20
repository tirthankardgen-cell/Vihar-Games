export const RULES_VERSION = "1.0.0";
export type Size = 3 | 4 | 5;
export type Puzzle = { id: string; name: string; size: Size; version: string; witness: readonly number[]; initial: readonly number[] };
export type Run = { puzzleId: string; version: string; size: Size; tiles: number[]; empty: number; history: number[]; cursor: number; moves: number; hints: number; assisted: boolean; elapsedMs: number };
export function target(size: Size): number[] { return Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size)); }
export function solved(tiles: readonly number[]): boolean { return tiles.every((tile, i) => tile === (i + 1) % tiles.length); }
export function adjacent(a: number, b: number, size: Size): boolean { return Math.abs(Math.floor(a / size) - Math.floor(b / size)) + Math.abs(a % size - b % size) === 1; }
export function slide(tiles: readonly number[], tile: number, size: Size): number[] | null {
  const from = tiles.indexOf(tile), empty = tiles.indexOf(0);
  if (tile === 0 || from < 0 || !adjacent(from, empty, size)) return null;
  const next = [...tiles]; [next[from], next[empty]] = [next[empty], next[from]]; return next;
}

// Hand-authored blank routes, replayed from the exact target. No permutation RNG.
function author(size: Size, name: string, route: string): Puzzle {
  let tiles = target(size); const witness: number[] = [];
  for (const direction of route) {
    const empty = tiles.indexOf(0), offset = { L: -1, R: 1, U: -size, D: size }[direction];
    const tile = tiles[empty + (offset ?? 0)], next = slide(tiles, tile, size);
    if (!next) throw new Error(`Invalid authored route: ${name}`);
    witness.push(tile); tiles = next;
  }
  if (solved(tiles)) throw new Error(`Solved authored route: ${name}`);
  return { id: `${size}-${name.toLowerCase().replaceAll(" ", "-")}`, name, size, version: RULES_VERSION, witness, initial: tiles };
}
export const PUZZLES: readonly Puzzle[] = [
  author(3, "Blue Blossom", "LULURDRDLLUR"),
  author(3, "Petal Study", "UULLDRRDLULURD"),
  author(4, "Cobalt Compass", "LLLUUURRRDLLDRULDRD"),
  author(4, "Star Study", "UUULLLDRRDLULDDRRUL"),
  author(5, "Trailing Vine", "LLLLUUUURRRRDLLLDRRRDLLLDRRRUUL"),
  author(5, "Leaf Study", "UUUULLLLDRRRDLLLDRRRDLLLURRRUUL"),
];
export function puzzleById(id: string): Puzzle | undefined { return PUZZLES.find(p => p.id === id); }
export function newRun(puzzle: Puzzle): Run { return { puzzleId: puzzle.id, version: puzzle.version, size: puzzle.size, tiles: [...puzzle.initial], empty: puzzle.initial.indexOf(0), history: [], cursor: 0, moves: 0, hints: 0, assisted: false, elapsedMs: 0 }; }
export function move(run: Run, tile: number): Run {
  if (solved(run.tiles)) return run;
  const tiles = slide(run.tiles, tile, run.size); if (!tiles) return run;
  return { ...run, tiles, empty: tiles.indexOf(0), history: [...run.history.slice(0, run.cursor), tile], cursor: run.cursor + 1, moves: run.moves + 1 };
}
export function undo(run: Run): Run {
  if (run.cursor === 0 || solved(run.tiles)) return run;
  const tiles = slide(run.tiles, run.history[run.cursor - 1], run.size); if (!tiles) return run;
  return { ...run, tiles, empty: tiles.indexOf(0), cursor: run.cursor - 1 };
}
export function redo(run: Run): Run {
  if (run.cursor === run.history.length || solved(run.tiles)) return run;
  const tiles = slide(run.tiles, run.history[run.cursor], run.size); if (!tiles) return run;
  return { ...run, tiles, empty: tiles.indexOf(0), cursor: run.cursor + 1 };
}
// Reverse a proven route to the current board, cancelling immediate backtracks.
// This bounded, synchronous path needs neither search nor a gameplay worker.
export function solutionPath(run: Run): number[] | null {
  const puzzle = puzzleById(run.puzzleId); if (!puzzle || run.version !== puzzle.version || run.size !== puzzle.size) return null;
  const route: number[] = [];
  for (const tile of [...puzzle.witness, ...run.history.slice(0, run.cursor)]) {
    if (route.at(-1) === tile) route.pop(); else route.push(tile);
  }
  const solution = route.reverse(); let tiles = run.tiles;
  for (const tile of solution) { const next = slide(tiles, tile, run.size); if (!next) return null; tiles = next; }
  return solved(tiles) ? solution : null;
}
export function hint(run: Run): { run: Run; tile: number | null } {
  if (solved(run.tiles)) return { run, tile: null };
  const path = solutionPath(run); if (!path?.length) return { run, tile: null };
  return { run: { ...run, hints: run.hints + 1, assisted: true }, tile: path[0] };
}
