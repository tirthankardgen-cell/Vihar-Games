export const RULES_VERSION = "1.0.0";
export const STEP = 1 / 120;
export const WORLD = { width: 960, height: 360, ground: 300, foxX: 120, spawnX: 980 } as const;
export const PHYSICS = { jump: -620, gravity: 1800, maxSpeed: 420 } as const;
export const presets = {
  endless: { name: "Endless", speed: 240 },
  practice: { name: "Practice", speed: 180 },
} as const;
export type Mode = keyof typeof presets;
export type Pose = "standing" | "ducking" | "airborne";
export type Obstacle = { id: number; kind: "stone" | "bird"; x: number; width: number; height: number; bottom: number; variant: number };
export type Run = {
  mode: Mode; seed: number; random: number; nextId: number;
  status: "ready" | "running" | "ended"; pose: Pose; feet: number; velocity: number;
  elapsed: number; distance: number; speedStage: number; spawnRemaining: number;
  obstacles: Obstacle[]; ending: "stone" | "bird" | null;
};
export type Rectangle = { left: number; right: number; top: number; bottom: number };
const EPS = 1e-9;
const stageAt = (time: number) => Math.min(23, Math.floor((time + EPS) / 10));
export const speedAt = (mode: Mode, time: number) => mode === "practice" ? 180 : Math.min(420, 240 + 8 * stageAt(time));
export const scoreOf = (run: Run) => Math.floor(run.distance / 10);
export function distanceAt(mode: Mode, time: number): number {
  if (mode === "practice") return time * 180;
  const stages = Math.min(23, Math.floor((time + EPS) / 10));
  return stages * 10 * (240 + 4 * (stages - 1)) + (time - stages * 10) * Math.min(420, 240 + stages * 8);
}

export function createRun(mode: Mode, seed: number): Run {
  const normalized = (seed >>> 0) || 1;
  return { mode, seed: normalized, random: normalized, nextId: 0, status: "ready", pose: "standing", feet: WORLD.ground, velocity: 0, elapsed: 0, distance: 0, speedStage: 0, spawnRemaining: presets[mode].speed * 3, obstacles: [], ending: null };
}
export const start = (run: Run): Run => run.status === "ready" ? { ...run, status: "running" } : run;
export function jump(run: Run): Run {
  return run.status === "running" && run.pose !== "airborne" ? { ...run, pose: "airborne", velocity: PHYSICS.jump } : run;
}
export function duck(run: Run, held: boolean): Run {
  return run.status !== "ended" && run.pose !== "airborne" ? { ...run, pose: held ? "ducking" : "standing" } : run;
}
export function foxBox(run: Pick<Run, "feet" | "pose">): Rectangle {
  const low = run.pose === "ducking";
  return { left: WORLD.foxX, right: WORLD.foxX + (low ? 46 : 34), top: run.feet - (low ? 24 : 46), bottom: run.feet };
}
export const obstacleBox = (obstacle: Obstacle): Rectangle => ({ left: obstacle.x, right: obstacle.x + obstacle.width, top: obstacle.bottom - obstacle.height, bottom: obstacle.bottom });
export const overlap = (a: Rectangle, b: Rectangle) => a.left < b.right - EPS && a.right > b.left + EPS && a.top < b.bottom - EPS && a.bottom > b.top + EPS;

function roots(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < EPS) return Math.abs(b) < EPS ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  return [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
}

// Split at every edge crossing, then test open intervals. This follows the
// actual parabolic jump and catches hazards crossing the fox between frames.
export function sweptCollision(run: Pick<Run, "feet" | "pose" | "velocity">, obstacle: Obstacle, speed: number, duration: number): number | null {
  const fox = foxBox(run), box = obstacleBox(obstacle);
  if (overlap(fox, box)) return 0;
  const acceleration = run.pose === "airborne" ? PHYSICS.gravity : 0;
  const velocity = run.pose === "airborne" ? run.velocity : 0;
  const cuts = [0, duration,
    (box.left - fox.right) / speed, (box.right - fox.left) / speed,
    ...roots(acceleration / 2, velocity, run.feet - box.top),
    ...roots(acceleration / 2, velocity, fox.top - box.bottom),
  ].filter((t) => Number.isFinite(t) && t >= 0 && t <= duration).sort((a, b) => a - b);
  for (let i = 1; i < cuts.length; i++) {
    const t = (cuts[i - 1] + cuts[i]) / 2;
    const offset = velocity * t + acceleration * t * t / 2;
    if (overlap({ ...fox, top: fox.top + offset, bottom: fox.bottom + offset }, { ...box, left: box.left - speed * t, right: box.right - speed * t })) return cuts[i - 1];
  }
  return null;
}

function spawn(run: Run): Run {
  let random = run.random;
  const draw = () => { random ^= random << 13; random ^= random >>> 17; random ^= random << 5; random >>>= 0; return random / 4294967296; };
  const bird = run.nextId >= 2 && run.elapsed >= 15 - EPS && draw() < .3;
  const width = bird ? 50 : 28 + Math.floor(draw() * 25);
  const height = bird ? 24 : Math.min(28 + Math.floor(draw() * 27), width > 48 ? 50 : 54);
  const obstacle: Obstacle = { id: run.nextId, kind: bird ? "bird" : "stone", x: WORLD.spawnX, width, height, bottom: bird ? 264 : WORLD.ground, variant: Math.floor(draw() * 3) };
  // Reserve the capped-speed gap in Endless so a later speed increase cannot
  // compress an already generated pair below the documented 1.1 seconds.
  const gap = (run.mode === "practice" ? 180 : PHYSICS.maxSpeed) * 1.1 + draw() * 220;
  return { ...run, random, nextId: run.nextId + 1, obstacles: [...run.obstacles, obstacle], spawnRemaining: width + gap };
}

export function step(input: Run): Run {
  if (input.status !== "running") return input;
  let run = input, remaining = STEP;
  while (remaining > EPS && run.status === "running") {
    if (run.spawnRemaining <= EPS) run = spawn(run);
    const speed = speedAt(run.mode, run.elapsed);
    let duration = Math.min(remaining, run.spawnRemaining / speed);
    if (run.mode === "endless" && run.speedStage < 23) duration = Math.min(duration, (run.speedStage + 1) * 10 - run.elapsed);
    let landing = Infinity;
    if (run.pose === "airborne") {
      landing = roots(PHYSICS.gravity / 2, run.velocity, run.feet - WORLD.ground).filter((t) => t > EPS)[0] ?? Infinity;
      duration = Math.min(duration, landing);
    }
    let collision: number | null = null, ending = run.ending;
    for (const obstacle of run.obstacles) {
      const at = sweptCollision(run, obstacle, speed, duration);
      if (at !== null && (collision === null || at < collision)) { collision = at; ending = obstacle.kind; }
    }
    const elapsed = collision ?? duration, distance = speed * elapsed;
    const airborne = run.pose === "airborne", landed = airborne && elapsed >= landing - EPS;
    run = { ...run,
      feet: landed ? WORLD.ground : run.feet + (airborne ? run.velocity * elapsed + PHYSICS.gravity * elapsed * elapsed / 2 : 0),
      velocity: landed ? 0 : run.velocity + (airborne ? PHYSICS.gravity * elapsed : 0),
      pose: landed ? "standing" : run.pose,
      elapsed: run.elapsed + elapsed, distance: run.distance + distance,
      speedStage: run.mode === "practice" ? 0 : stageAt(run.elapsed + elapsed),
      spawnRemaining: Math.max(0, run.spawnRemaining - distance),
      obstacles: run.obstacles.map((obstacle) => ({ ...obstacle, x: obstacle.x - distance })).filter((obstacle) => obstacle.x + obstacle.width >= 0),
      status: collision === null ? "running" : "ended", ending: collision === null ? null : ending,
    };
    remaining -= elapsed;
  }
  return run;
}

// Storage is untrusted. Accept only collision-relevant, bounded snapshots.
export function validRun(value: unknown): value is Run {
  if (!value || typeof value !== "object") return false;
  const r = value as Run;
  if (!["endless", "practice"].includes(r.mode) || !["ready", "running", "ended"].includes(r.status) || !["standing", "ducking", "airborne"].includes(r.pose)) return false;
  if (![r.seed, r.random].every((n) => Number.isSafeInteger(n) && n > 0 && n <= 0xffffffff) || !Number.isSafeInteger(r.nextId) || r.nextId < 0 || r.nextId > 10000000) return false;
  if (![r.feet, r.velocity, r.elapsed, r.distance, r.spawnRemaining].every(Number.isFinite) || r.feet < 193 || r.feet > WORLD.ground || r.velocity < PHYSICS.jump || r.velocity > 621 || r.elapsed < 0 || r.elapsed > 31536000 || r.distance < 0 || r.distance > r.elapsed * 420 + EPS || r.spawnRemaining < 0 || r.spawnRemaining > 750) return false;
  if (r.speedStage !== (r.mode === "practice" ? 0 : stageAt(r.elapsed)) || (r.pose !== "airborne" && (r.feet !== WORLD.ground || r.velocity !== 0))) return false;
  if (r.pose === "airborne" && r.feet === WORLD.ground && r.velocity >= 0) return false;
  if (Math.abs(r.distance - distanceAt(r.mode, r.elapsed)) > .05 || r.pose === "airborne" && Math.abs(r.velocity ** 2 - (PHYSICS.jump ** 2 + 2 * PHYSICS.gravity * (r.feet - WORLD.ground))) > .05) return false;
  if (r.status === "ended" ? !["stone", "bird"].includes(r.ending ?? "") : r.ending !== null) return false;
  if (r.status === "ready" && (r.elapsed !== 0 || r.distance !== 0 || r.nextId !== 0 || r.pose !== "standing" || r.spawnRemaining !== presets[r.mode].speed * 3)) return false;
  if (!Array.isArray(r.obstacles) || r.obstacles.length > 8) return false;
  for (let i = 0; i < r.obstacles.length; i++) {
    const o = r.obstacles[i];
    if (!o || !Number.isSafeInteger(o.id) || o.id < 0 || o.id >= r.nextId || !Number.isFinite(o.x) || o.x < -52 || o.x > WORLD.spawnX || !Number.isInteger(o.variant) || o.variant < 0 || o.variant > 2) return false;
    if (o.kind === "stone" ? !Number.isInteger(o.width) || o.width < 28 || o.width > 52 || !Number.isInteger(o.height) || o.height < 28 || o.height > 54 || o.bottom !== WORLD.ground : o.kind !== "bird" || o.width !== 50 || o.height !== 24 || o.bottom !== 264 || o.id < 2 || r.elapsed < 15) return false;
    if (i > 0 && (o.id <= r.obstacles[i - 1].id || o.x - r.obstacles[i - 1].x - r.obstacles[i - 1].width < (r.mode === "practice" ? 180 : 420) * 1.1 - .01)) return false;
  }
  if (r.nextId === 0 && r.obstacles.length !== 0 || r.elapsed < 3 - EPS && r.nextId !== 0) return false;
  return true;
}
