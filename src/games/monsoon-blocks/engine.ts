export const RULES_VERSION = "1.0.0";
export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN = 4;
export const STEP_MS = 5;
export const LOCK_MS = 400;
export const MAX_RESETS = 10;
export const SHAPES = ["I", "O", "T", "J", "L", "S", "Z"] as const;
export type Shape = typeof SHAPES[number];
export type Preset = "standard" | "practice";
export type Cell = { x: number; y: number };
export type Piece = { shape: Shape; cells: Cell[]; x: number; y: number };
export type Grid = (Shape | null)[][];
export type Generator = { bag: Shape[]; rng: number };
export type Action = "left" | "right" | "soft-drop" | "rotate" | "hard-drop" | "hold";
export type Run = Generator & {
  preset: Preset;
  status: "playing" | "ended";
  reason: "window-full" | "spawn-blocked" | null;
  grid: Grid;
  active: Piece;
  next: Shape[];
  hold: Shape | null;
  canHold: boolean;
  gravityRemaining: number;
  lockRemaining: number;
  lockStarted: boolean;
  lockResets: number;
  rows: number;
  level: number;
  score: number;
  elapsedMs: number;
  placed: number;
  lastClear: number[];
};

export const spawnMasks: Record<Shape, string> = {
  I: "####", O: "##/##", T: ".#./###", J: "#../###",
  L: "..#/###", S: ".##/##.", Z: "##./.##",
};
export const masks = Object.fromEntries(SHAPES.map((shape) => [shape,
  spawnMasks[shape].split("/").flatMap((row, y) => [...row].flatMap((cell, x) => cell === "#" ? [{ x, y }] : [])),
])) as Record<Shape, Cell[]>;

export function rotateCells(cells: readonly Cell[]): Cell[] {
  const height = Math.max(...cells.map((cell) => cell.y)) + 1;
  const rotated = cells.map(({ x, y }) => ({ x: height - 1 - y, y: x }));
  const left = Math.min(...rotated.map((cell) => cell.x)), top = Math.min(...rotated.map((cell) => cell.y));
  return rotated.map(({ x, y }) => ({ x: x - left, y: y - top }));
}
export function spawnPiece(shape: Shape): Piece {
  const cells = masks[shape].map((cell) => ({ ...cell }));
  const width = Math.max(...cells.map((cell) => cell.x)) + 1;
  return { shape, cells, x: Math.floor((WIDTH - width) / 2), y: -2 };
}
export const pieceCells = (piece: Piece): Cell[] => piece.cells.map(({ x, y }) => ({ x: x + piece.x, y: y + piece.y }));
export const emptyGrid = (): Grid => Array.from({ length: HEIGHT + HIDDEN }, () => Array<Shape | null>(WIDTH).fill(null));
export function fits(grid: Grid, piece: Piece): boolean {
  return pieceCells(piece).every(({ x, y }) => x >= 0 && x < WIDTH && y >= -HIDDEN && y < HEIGHT && grid[y + HIDDEN][x] === null);
}
export const grounded = (run: Run) => !fits(run.grid, { ...run.active, y: run.active.y + 1 });
export function gravityMs(level: number, preset: Preset): number {
  const standard = Math.max(80, 800 - 60 * (level - 1));
  return preset === "practice" ? standard * 2 : standard;
}

function random(state: number): number {
  let value = state >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return value >>> 0;
}
export function drawShape(generator: Generator): { shape: Shape; generator: Generator } {
  let bag = [...generator.bag], rng = generator.rng;
  if (!bag.length) {
    bag = [...SHAPES];
    for (let i = bag.length - 1; i > 0; i--) {
      rng = random(rng);
      const j = Math.floor(rng / 0x100000000 * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  const shape = bag.shift()!;
  return { shape, generator: { bag, rng } };
}
export function createRun(preset: Preset, seed: number): Run {
  let generator: Generator = { bag: [], rng: (seed >>> 0) || 0x6d2b79f5 };
  const pieces: Shape[] = [];
  for (let i = 0; i < 4; i++) {
    const draw = drawShape(generator); generator = draw.generator; pieces.push(draw.shape);
  }
  return {
    ...generator, preset, status: "playing", reason: null, grid: emptyGrid(),
    active: spawnPiece(pieces[0]), next: pieces.slice(1), hold: null, canHold: true,
    gravityRemaining: gravityMs(1, preset), lockRemaining: LOCK_MS, lockStarted: false, lockResets: 0,
    rows: 0, level: 1, score: 0, elapsedMs: 0, placed: 0, lastClear: [],
  };
}
function spawn(run: Run, shape: Shape): Run {
  const active = spawnPiece(shape);
  return { ...run, active, gravityRemaining: gravityMs(run.level, run.preset), lockRemaining: LOCK_MS,
    lockStarted: !fits(run.grid, { ...active, y: active.y + 1 }), lockResets: 0,
    ...(!fits(run.grid, active) ? { status: "ended" as const, reason: "spawn-blocked" as const } : {}),
  };
}
function consumeNext(run: Run): Run {
  const draw = drawShape(run);
  return spawn({ ...run, ...draw.generator, next: [...run.next.slice(1), draw.shape] }, run.next[0]);
}
export function ghostPiece(run: Run): Piece {
  let landing = run.active;
  if (!fits(run.grid, landing)) return landing;
  while (fits(run.grid, { ...landing, y: landing.y + 1 })) landing = { ...landing, y: landing.y + 1 };
  return landing;
}
export function lockPiece(run: Run): Run {
  if (run.status !== "playing") return run;
  const cells = pieceCells(run.active);
  // A hidden cell ends play before any settlement, clear, or next-piece draw.
  if (cells.some((cell) => cell.y < 0)) return { ...run, status: "ended", reason: "window-full", lastClear: [] };
  const grid = run.grid.map((row) => [...row]);
  for (const { x, y } of cells) grid[y + HIDDEN][x] = run.active.shape;
  const lastClear: number[] = [];
  for (let y = 0; y < HEIGHT; y++) if (grid[y + HIDDEN].every((cell) => cell !== null)) lastClear.push(y);
  const removed = new Set(lastClear.map((y) => y + HIDDEN));
  const remaining = grid.filter((_, index) => !removed.has(index));
  const settled = [...Array.from({ length: lastClear.length }, () => Array<Shape | null>(WIDTH).fill(null)), ...remaining];
  const rows = run.rows + lastClear.length;
  const clearScore = [0, 100, 300, 500, 800][lastClear.length] * run.level;
  return consumeNext({ ...run, grid: settled, rows, level: 1 + Math.floor(rows / 10),
    score: run.score + clearScore, placed: run.placed + 1, lastClear, canHold: true,
  });
}
function moveDown(run: Run, player: boolean): Run {
  const active = { ...run.active, y: run.active.y + 1 };
  if (!fits(run.grid, active)) return run;
  const next = { ...run, active, score: run.score + (player ? 1 : 0) };
  return grounded(next) ? { ...next, lockStarted: true } : next;
}
function adjust(run: Run, active: Piece): Run {
  if (!fits(run.grid, active)) return run;
  const reset = grounded(run) && run.lockResets < MAX_RESETS;
  const next = { ...run, active, ...(reset ? { lockRemaining: LOCK_MS, lockResets: run.lockResets + 1 } : {}) };
  return grounded(next) ? { ...next, lockStarted: true } : next;
}
export function act(run: Run, action: Action): Run {
  if (run.status !== "playing") return run;
  if (action === "left" || action === "right") return adjust(run, { ...run.active, x: run.active.x + (action === "left" ? -1 : 1) });
  if (action === "soft-drop") return moveDown(run, true);
  if (action === "rotate") {
    if (run.active.shape === "O") return run;
    const cells = rotateCells(run.active.cells);
    for (const offset of [0, -1, 1, -2, 2]) {
      const active = { ...run.active, cells, x: run.active.x + offset };
      if (fits(run.grid, active)) return adjust(run, active);
    }
    return run;
  }
  if (action === "hard-drop") {
    const active = ghostPiece(run), distance = active.y - run.active.y;
    return lockPiece({ ...run, active, lockStarted: true, score: run.score + distance * 2 });
  }
  if (!run.canHold) return run;
  const held = run.active.shape;
  const next = run.hold === null ? consumeNext(run) : spawn(run, run.hold);
  return { ...next, hold: held, canHold: false };
}
// Five-millisecond simulation steps divide every published gravity/repeat/lock interval.
// UI catch-up is bounded; wall-clock gaps and countdowns never enter this function.
export function step(run: Run): Run {
  if (run.status !== "playing") return run;
  const supported = grounded(run);
  let next = { ...run, elapsedMs: run.elapsedMs + STEP_MS, gravityRemaining: run.gravityRemaining - STEP_MS,
    lockStarted: run.lockStarted || supported, lockRemaining: run.lockRemaining - (supported ? STEP_MS : 0),
  };
  if (next.lockRemaining <= 0 && supported) return lockPiece({ ...next, gravityRemaining: Math.max(1, next.gravityRemaining) });
  if (next.gravityRemaining <= 0) {
    next = moveDown(next, false);
    next = { ...next, gravityRemaining: gravityMs(next.level, next.preset) };
  }
  return next;
}

const isShape = (value: unknown): value is Shape => SHAPES.includes(value as Shape);
const integer = (value: unknown, min: number, max: number): value is number => Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= max;
const cellSignature = (cells: readonly Cell[]) => cells.map(({ x, y }) => `${x},${y}`).sort().join(";");
const rotations = Object.fromEntries(SHAPES.map((shape) => {
  let cells = masks[shape]; const signatures: string[] = [];
  for (let i = 0; i < 4; i++) { signatures.push(cellSignature(cells)); cells = rotateCells(cells); }
  return [shape, signatures];
})) as Record<Shape, string[]>;
export function validRun(value: unknown): value is Run {
  if (!value || typeof value !== "object") return false;
  const run = value as Run;
  if (!["standard", "practice"].includes(run.preset) || !["playing", "ended"].includes(run.status)) return false;
  if (!Array.isArray(run.grid) || run.grid.length !== HEIGHT + HIDDEN || run.grid.some((row) => !Array.isArray(row) || row.length !== WIDTH || row.some((cell) => cell !== null && !isShape(cell)))) return false;
  if (run.grid.slice(0, HIDDEN).some((row) => row.some((cell) => cell !== null)) || run.grid.slice(HIDDEN).some((row) => row.every((cell) => cell !== null))) return false;
  const p = run.active;
  if (!p || !isShape(p.shape) || !integer(p.x, 0, WIDTH - 1) || !integer(p.y, -HIDDEN, HEIGHT - 1) || !Array.isArray(p.cells) || p.cells.length !== 4 || p.cells.some((c) => !c || !integer(c.x, 0, 3) || !integer(c.y, 0, 3)) || !rotations[p.shape].includes(cellSignature(p.cells))) return false;
  if (pieceCells(p).some(({ x, y }) => x >= WIDTH || y >= HEIGHT)) return false;
  if (!Array.isArray(run.bag) || run.bag.length > 6 || run.bag.some((s) => !isShape(s)) || new Set(run.bag).size !== run.bag.length || !integer(run.rng, 1, 0xffffffff)) return false;
  if (!Array.isArray(run.next) || run.next.length !== 3 || run.next.some((s) => !isShape(s)) || run.hold !== null && !isShape(run.hold) || typeof run.canHold !== "boolean") return false;
  if (!integer(run.rows, 0, 1000000) || !integer(run.placed, 0, 10000000) || run.rows > 4 * run.placed || run.level !== 1 + Math.floor(run.rows / 10) || !integer(run.score, 0, 1000000000000) || !integer(run.elapsedMs, 0, 31536000000)) return false;
  if (run.grid.flat().filter((c) => c !== null).length !== run.placed * 4 - run.rows * WIDTH) return false;
  if (!integer(run.gravityRemaining, 1, gravityMs(run.level, run.preset)) || !integer(run.lockRemaining, 0, LOCK_MS) || !integer(run.lockResets, 0, MAX_RESETS) || typeof run.lockStarted !== "boolean") return false;
  if (!run.lockStarted && (run.lockRemaining !== LOCK_MS || run.lockResets !== 0) || !run.lockStarted && grounded(run)) return false;
  if (!Array.isArray(run.lastClear) || run.lastClear.length > 4 || run.lastClear.some((y) => !integer(y, 0, HEIGHT - 1)) || new Set(run.lastClear).size !== run.lastClear.length) return false;
  if (run.status === "playing") return run.reason === null && fits(run.grid, p) && run.lockRemaining > 0;
  if (run.reason === "window-full") return fits(run.grid, p) && pieceCells(p).some((c) => c.y < 0);
  return run.reason === "spawn-blocked" && !fits(run.grid, p) && cellSignature(p.cells) === cellSignature(masks[p.shape]) && p.y === -2 && p.x === spawnPiece(p.shape).x;
}
