export const RULES_VERSION = "1.0.0";
export const SIZE = 20;
export const RATES = { calm: 5, flow: 8, swift: 11 } as const;
export type Preset = keyof typeof RATES;
export type Direction = "up" | "right" | "down" | "left";
export type Cell = { x: number; y: number };
export type Run = {
  preset: Preset; seed: number; random: number; body: Cell[]; direction: Direction;
  queue: Direction[]; leaf: Cell | null; score: number; elapsedMs: number;
  status: "playing" | "ended"; reason: "wall" | "body" | "complete" | null;
};
const vectors: Record<Direction, Cell> = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } };
const opposite: Record<Direction, Direction> = { up: "down", right: "left", down: "up", left: "right" };
export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const tickMs = (preset: Preset) => 1000 / RATES[preset];
export const isPreset = (value: unknown): value is Preset => value === "calm" || value === "flow" || value === "swift";
const inBounds = (c: Cell) => Number.isInteger(c?.x) && Number.isInteger(c?.y) && c.x >= 0 && c.y >= 0 && c.x < SIZE && c.y < SIZE;

// Full-period LCG with rejection sampling: every empty cell has equal probability.
function spawn(body: Cell[], state: number): { leaf: Cell | null; random: number } {
  const occupied = new Set(body.map((c) => c.y * SIZE + c.x));
  const empty = Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !occupied.has(i));
  if (!empty.length) return { leaf: null, random: state };
  const limit = Math.floor(0x100000000 / empty.length) * empty.length;
  do { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; } while (state >= limit);
  const cell = empty[state % empty.length];
  return { leaf: { x: cell % SIZE, y: Math.floor(cell / SIZE) }, random: state };
}
export function createRun(preset: Preset = "flow", seed = 1): Run {
  seed = seed >>> 0;
  const body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  return { preset, seed, body, direction: "right", queue: [], ...spawn(body, seed), score: 0, elapsedMs: 0, status: "playing", reason: null };
}
export function turn(run: Run, direction: Direction): Run {
  const preceding = run.queue.at(-1) ?? run.direction;
  if (run.status !== "playing" || run.queue.length >= 2 || direction === preceding || opposite[preceding] === direction) return run;
  return { ...run, queue: [...run.queue, direction] };
}
export const clearTurns = (run: Run): Run => run.queue.length ? { ...run, queue: [] } : run;
export function step(run: Run): Run {
  if (run.status !== "playing") return run;
  const direction = run.queue[0] ?? run.direction, vector = vectors[direction];
  const head = { x: run.body[0].x + vector.x, y: run.body[0].y + vector.y };
  const growing = run.leaf !== null && sameCell(head, run.leaf);
  const reason = !inBounds(head) ? "wall" : (growing ? run.body : run.body.slice(0, -1)).some((c) => sameCell(head, c)) ? "body" : null;
  // The failed move leaves a distinct, valid body in the last legal position.
  if (reason) return { ...run, queue: [], status: "ended", reason };
  const body = [head, ...run.body]; if (!growing) body.pop();
  const complete = body.length === SIZE * SIZE;
  return { ...run, body, direction, queue: run.queue.slice(1), score: run.score + Number(growing),
    ...(growing ? spawn(body, run.random) : {}), status: complete ? "ended" : "playing", reason: complete ? "complete" : null,
    ...(complete ? { queue: [] } : {}) };
}
export function advance(run: Run, remainder: number, delta: number): { run: Run; remainder: number } {
  if (run.status !== "playing" || !Number.isFinite(delta) || delta <= 0) return { run, remainder };
  // At most two visible steps; callers pause on a severely delayed frame.
  const interval = tickMs(run.preset); let available = Math.min(delta, interval);
  while (available > 0 && run.status === "playing") {
    const amount = Math.min(available, interval - remainder);
    run = { ...run, elapsedMs: run.elapsedMs + amount }; remainder += amount; available -= amount;
    if (remainder >= interval - 1e-7) { run = step(run); remainder = 0; }
  }
  return { run, remainder: run.status === "ended" ? 0 : remainder };
}
export function validRun(value: unknown): value is Run {
  if (!value || typeof value !== "object") return false;
  const r = value as Run;
  if (!isPreset(r.preset) || !Number.isInteger(r.seed) || r.seed < 0 || r.seed > 0xffffffff || !Number.isInteger(r.random) || r.random < 0 || r.random > 0xffffffff || !Array.isArray(r.body) || r.body.length < 3 || r.body.length > 400 || !r.body.every(inBounds) || !Number.isInteger(r.score) || r.score !== r.body.length - 3 || !Number.isFinite(r.elapsedMs) || r.elapsedMs < 0 || r.elapsedMs > 31536000000 || !Object.hasOwn(vectors, r.direction)) return false;
  if (new Set(r.body.map((c) => c.y * SIZE + c.x)).size !== r.body.length) return false;
  for (let i = 1; i < r.body.length; i++) if (Math.abs(r.body[i].x - r.body[i - 1].x) + Math.abs(r.body[i].y - r.body[i - 1].y) !== 1) return false;
  const v = vectors[r.direction]; if (!sameCell(r.body[0], { x: r.body[1].x + v.x, y: r.body[1].y + v.y })) return false;
  if (!Array.isArray(r.queue) || r.queue.length > 2) return false;
  let previous = r.direction;
  for (const d of r.queue) { if (!Object.hasOwn(vectors, d) || d === previous || d === opposite[previous]) return false; previous = d; }
  if (r.status === "playing" ? r.reason !== null || r.body.length === 400 : r.status !== "ended" || !["wall", "body", "complete"].includes(r.reason ?? "") || r.queue.length !== 0) return false;
  if (r.reason === "complete") return r.body.length === 400 && r.leaf === null;
  return r.body.length < 400 && r.leaf !== null && inBounds(r.leaf) && !r.body.some((c) => sameCell(c, r.leaf!));
}
