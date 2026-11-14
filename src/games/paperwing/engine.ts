export const RULES_VERSION = "1.0.0";
export const STEP = 1 / 120;
export const WORLD = { width: 480, height: 720, top: 40, bottom: 680, birdX: 120, radius: 12, gateWidth: 64 } as const;
export const presets = {
  standard: { name: "Standard", speed: 140, gap: 180, spacing: 280 },
  practice: { name: "Practice", speed: 110, gap: 220, spacing: 300 },
} as const;
export type Mode = keyof typeof presets;
export type Gate = { id: number; x: number; centre: number; scored: boolean };
export type Run = {
  mode: Mode; seed: number; random: number; nextId: number;
  status: "ready" | "flying" | "ended";
  y: number; velocity: number; elapsed: number; score: number;
  gates: Gate[]; ending: "ceiling" | "floor" | "panel" | null;
};
type Polynomial = number[];
const EPS = 1e-9;
const evaluate = (p: Polynomial, x: number): number => p.reduceRight((sum, c) => sum * x + c, 0);
const square = (p: Polynomial): Polynomial => {
  const result = Array<number>(p.length * 2 - 1).fill(0);
  p.forEach((a, i) => p.forEach((b, j) => { result[i + j] += a * b; }));
  return result;
};
const sum = (a: Polynomial, b: Polynomial): Polynomial => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0));

// Isolate polynomial roots between derivative roots, where the polynomial is
// monotone. The actual parabolic flight path is used, including rounded corners.
function roots(input: Polynomial, low: number, high: number): number[] {
  const p = [...input];
  while (p.length > 1 && Math.abs(p.at(-1)!) < EPS) p.pop();
  if (p.length === 1) return [];
  if (p.length === 2) {
    const x = -p[0] / p[1];
    return x >= low - EPS && x <= high + EPS ? [Math.max(low, Math.min(high, x))] : [];
  }
  const points = [low, ...roots(p.slice(1).map((c, i) => c * (i + 1)), low, high), high];
  const found: number[] = [];
  for (const x of points) if (Math.abs(evaluate(p, x)) < EPS) found.push(x);
  for (let i = 1; i < points.length; i++) {
    let a = points[i - 1], b = points[i];
    const sign = evaluate(p, a);
    if (sign * evaluate(p, b) >= 0) continue;
    for (let k = 0; k < 48; k++) {
      const middle = (a + b) / 2;
      if (sign * evaluate(p, middle) > 0) a = middle; else b = middle;
    }
    found.push((a + b) / 2);
  }
  return [...new Set(found)].sort((a, b) => a - b);
}
function firstNegative(p: Polynomial, low = 0, high = 1): number | null {
  if (evaluate(p, low) < -EPS) return low;
  const points = [low, ...roots(p, low, high), high];
  for (let i = 1; i < points.length; i++) {
    if (evaluate(p, (points[i - 1] + points[i]) / 2) < -EPS) return points[i - 1];
  }
  return null;
}

export function sweepCircle(x: Polynomial, y: Polynomial, rectangle: { left: number; right: number; top: number; bottom: number }, radius = WORLD.radius): number | null {
  const cuts = [0, 1,
    ...roots([x[0] - rectangle.left, ...x.slice(1)], 0, 1),
    ...roots([x[0] - rectangle.right, ...x.slice(1)], 0, 1),
    ...roots([y[0] - rectangle.top, ...y.slice(1)], 0, 1),
    ...roots([y[0] - rectangle.bottom, ...y.slice(1)], 0, 1),
  ].sort((a, b) => a - b);
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1], b = cuts[i];
    if (b - a < EPS) continue;
    const mid = (a + b) / 2, mx = evaluate(x, mid), my = evaluate(y, mid);
    const dx = mx < rectangle.left ? [x[0] - rectangle.left, ...x.slice(1)] : mx > rectangle.right ? [x[0] - rectangle.right, ...x.slice(1)] : [0];
    const dy = my < rectangle.top ? [y[0] - rectangle.top, ...y.slice(1)] : my > rectangle.bottom ? [y[0] - rectangle.bottom, ...y.slice(1)] : [0];
    const distance = sum(square(dx), square(dy));
    distance[0] -= radius * radius;
    const hit = firstNegative(distance, a, b);
    if (hit !== null) return hit;
  }
  return null;
}
function populate(run: Run, edge = WORLD.width + presets[run.mode].spacing): Run {
  const preset = presets[run.mode], gates = [...run.gates];
  let random = run.random, nextId = run.nextId;
  while (gates.at(-1)!.x < edge) {
    const last = gates.at(-1)!;
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    const low = Math.max(210, last.centre - 90), high = Math.min(510, last.centre + 90);
    gates.push({ id: nextId++, x: last.x + preset.spacing, centre: low + Math.floor(random / 4294967296 * (high - low + 1)), scored: false });
  }
  return { ...run, gates, random, nextId };
}
// Wider screens preview the same future sequence without advancing the run.
export function getVisibleGates(run: Run, width: number): Gate[] {
  return populate(run, Math.max(WORLD.width + presets[run.mode].spacing, width + WORLD.gateWidth)).gates;
}
export function createRun(mode: Mode, seed: number): Run {
  const normalized = seed >>> 0;
  return populate({ mode, seed: normalized, random: normalized, nextId: 1, status: "ready", y: 360, velocity: 0, elapsed: 0, score: 0, ending: null,
    gates: [{ id: 0, x: WORLD.birdX + WORLD.radius + presets[mode].speed * 2, centre: 360, scored: false }],
  });
}
export function flap(run: Run): Run {
  return run.status === "ended" ? run : { ...run, status: "flying", velocity: -280 };
}

// A segment ends at terminal-velocity onset. Times are normalized to [0,1]
// for root isolation, then converted back to seconds for chronological scoring.
function segment(run: Run, duration: number, gravity: number): Run {
  const preset = presets[run.mode];
  const y = [run.y, run.velocity * duration, .5 * gravity * duration * duration];
  let contact = 1, ending: Run["ending"] = null;
  for (const [p, reason] of [
    [[run.y - WORLD.top - WORLD.radius, ...y.slice(1)], "ceiling"],
    [[WORLD.bottom - WORLD.radius - run.y, ...y.slice(1).map((c) => -c)], "floor"],
  ] as [Polynomial, Run["ending"]][]) {
    const hit = firstNegative(p);
    if (hit !== null && hit <= contact) { contact = hit; ending = reason; }
  }
  for (const gate of run.gates) {
    const x = [WORLD.birdX - gate.x, preset.speed * duration];
    for (const [top, bottom] of [[WORLD.top, gate.centre - preset.gap / 2], [gate.centre + preset.gap / 2, WORLD.bottom]]) {
      const hit = sweepCircle(x, y, { left: 0, right: WORLD.gateWidth, top, bottom });
      if (hit !== null && hit <= contact) { contact = hit; ending = "panel"; }
    }
  }
  const time = duration * contact;
  let score = run.score;
  const gates = run.gates.map((gate) => {
    const passing = (gate.x + WORLD.gateWidth - WORLD.birdX) / preset.speed;
    const passed = !gate.scored && passing >= -EPS && passing <= time + EPS && (!ending || passing < time - EPS);
    if (passed) score++;
    return { ...gate, x: gate.x - preset.speed * time, scored: gate.scored || passed };
  }).filter((gate) => gate.x + WORLD.gateWidth >= 0);
  return populate({ ...run, y: evaluate(y, contact), velocity: Math.min(360, run.velocity + gravity * time), elapsed: run.elapsed + time,
    gates, score, status: ending ? "ended" : "flying", ending });
}
export function step(run: Run): Run {
  if (run.status !== "flying") return run;
  const untilCap = Math.max(0, (360 - run.velocity) / 900);
  if (untilCap >= STEP) return segment(run, STEP, 900);
  const first = untilCap > EPS ? segment(run, untilCap, 900) : run;
  return first.status === "ended" ? first : segment({ ...first, velocity: 360 }, STEP - untilCap, 0);
}

export function validRun(value: unknown): value is Run {
  if (!value || typeof value !== "object") return false;
  const r = value as Run;
  if (r.mode !== "standard" && r.mode !== "practice") return false;
  if (!["ready", "flying", "ended"].includes(r.status)) return false;
  if (![r.y, r.velocity, r.elapsed, r.score, r.seed, r.random, r.nextId].every(Number.isFinite)) return false;
  if (r.y < 52 - 1e-6 || r.y > 668 + 1e-6 || r.velocity < -280 || r.velocity > 360 || r.elapsed < 0 || r.elapsed > 31536000) return false;
  if (![r.seed, r.random].every((n) => Number.isInteger(n) && n >= 0 && n <= 4294967295) || !Number.isSafeInteger(r.nextId) || r.nextId < 1) return false;
  if (!Number.isSafeInteger(r.score) || r.score < 0 || r.score >= r.nextId || r.score > Math.floor(r.elapsed * presets[r.mode].speed / presets[r.mode].spacing) + 1) return false;
  if ((r.status === "ended") !== ["ceiling", "floor", "panel"].includes(r.ending ?? "") || (r.status !== "ended" && r.ending !== null)) return false;
  if (!Array.isArray(r.gates) || r.gates.length < 2 || r.gates.length > 5) return false;
  const preset = presets[r.mode];
  for (let i = 0; i < r.gates.length; i++) {
    const g = r.gates[i], prev = r.gates[i - 1];
    if (!g || !Number.isInteger(g.id) || g.id < 0 || !Number.isFinite(g.x) || g.x < -64 - 1e-6 || g.x > WORLD.width + preset.spacing * 2 + 1e-6 || !Number.isInteger(g.centre) || g.centre < 210 || g.centre > 510 || typeof g.scored !== "boolean") return false;
    const expectedX = WORLD.birdX + WORLD.radius + preset.speed * 2 + g.id * preset.spacing - r.elapsed * preset.speed;
    if (Math.abs(g.x - expectedX) > 1e-4 || (prev && (g.id !== prev.id + 1 || Math.abs(g.centre - prev.centre) > 90))) return false;
    const shouldScore = g.x + WORLD.gateWidth < WORLD.birdX - 1e-6;
    if (g.scored !== shouldScore && Math.abs(g.x + WORLD.gateWidth - WORLD.birdX) > 1e-6) return false;
    if (g.id === 0 && g.centre !== 360) return false;
  }
  if (r.nextId !== r.gates.at(-1)!.id + 1 || r.gates.at(-1)!.x < WORLD.width + preset.spacing - 1e-6) return false;
  // Check the generator state in logarithmic time, even for a long saved run.
  let remaining = r.nextId - 1, multiplier = 1664525, addition = 1013904223, expected = r.seed;
  while (remaining > 0) {
    if (remaining % 2) expected = (Math.imul(multiplier, expected) + addition) >>> 0;
    addition = Math.imul(multiplier + 1, addition) >>> 0;
    multiplier = Math.imul(multiplier, multiplier) >>> 0;
    remaining = Math.floor(remaining / 2);
  }
  if (expected !== r.random) return false;
  const passed = r.gates[0].id + r.gates.filter((g) => g.scored).length;
  if (r.score !== passed) return false;
  if (r.status === "ready" && (r.elapsed !== 0 || r.score !== 0 || r.y !== 360 || r.velocity !== 0)) return false;
  if (r.ending === "ceiling" && Math.abs(r.y - 52) > 1e-6 || r.ending === "floor" && Math.abs(r.y - 668) > 1e-6) return false;
  let panelContact = false;
  for (const g of r.gates) {
    for (const [top, bottom] of [[WORLD.top, g.centre - preset.gap / 2], [g.centre + preset.gap / 2, WORLD.bottom]]) {
      const dx = WORLD.birdX - Math.max(g.x, Math.min(g.x + WORLD.gateWidth, WORLD.birdX));
      const dy = r.y - Math.max(top, Math.min(bottom, r.y));
      const distance = dx * dx + dy * dy;
      if (distance < WORLD.radius * WORLD.radius - 1e-7 && r.status !== "ended") return false;
      if (distance <= WORLD.radius * WORLD.radius + 1e-5) panelContact = true;
    }
  }
  if (r.ending === "panel" && !panelContact) return false;
  return true;
}
