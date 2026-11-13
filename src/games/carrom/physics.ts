import { radius, strikerPosition, validateShot, type Match, type Outcome, type Piece, type Shot } from "./engine.ts";

export type Frame = { id: string; x: number; y: number }[];
export type Simulation = { outcome: Outcome; frames: Frame[]; duration: number };
type Body = Piece & { vx: number; vy: number; alive: boolean };
const DT = 1 / 180, MAX_STEPS = 180 * 12, FRICTION = 175;
export const pocketRadius = 23;
// A disc falls only when most of it crosses the opening. There is no force
// toward a pocket: velocity changes only through friction and collisions.
export const pocketCaptureRadius = (r: number) => pocketRadius - r * .6;
const pockets = [[56, 56], [544, 56], [56, 544], [544, 544]];

export function simulate(match: Match, shot: Shot, record = true): Simulation {
  validateShot(match, shot);
  const start = strikerPosition(match.turn, shot), angle = shot.angle * Math.PI / 180;
  const speed = 100 + shot.power * 7.5, direction = match.turn === "cream" ? 1 : -1;
  const bodies: Body[] = match.pieces.map((piece) => ({ ...piece, vx: 0, vy: 0, alive: true }));
  bodies.push({ id: "striker", kind: match.turn, ...start, vx: Math.sin(angle) * speed * direction, vy: -Math.cos(angle) * speed * direction, alive: true });
  const frames: Frame[] = [], pocketed: string[] = [];
  const frame = () => bodies.filter((body) => body.alive).map(({ id, x, y }) => ({ id, x, y }));
  if (record) frames.push(frame());
  let settled = false, step = 0;
  for (; step < MAX_STEPS; step++) {
    for (const body of bodies) if (body.alive) {
      body.x += body.vx * DT; body.y += body.vy * DT;
      const r = radius(body);
      if (pockets.some(([x, y]) => Math.hypot(body.x - x, body.y - y) < pocketCaptureRadius(r))) { body.alive = false; pocketed.push(body.id); continue; }
      if (body.x < 29 + r) { body.x = 29 + r; body.vx = Math.abs(body.vx) * .86; }
      if (body.x > 571 - r) { body.x = 571 - r; body.vx = -Math.abs(body.vx) * .86; }
      if (body.y < 29 + r) { body.y = 29 + r; body.vy = Math.abs(body.vy) * .86; }
      if (body.y > 571 - r) { body.y = 571 - r; body.vy = -Math.abs(body.vy) * .86; }
    }
    // Multiple contact passes separate a tightly packed starting arrangement.
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      if (!a.alive || !b.alive) continue;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy), contact = radius(a) + radius(b);
      if (distance >= contact) continue;
      const nx = distance > .0001 ? dx / distance : 1, ny = distance > .0001 ? dy / distance : 0;
      const overlap = (contact - distance + .001) / 2;
      a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
      const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (approach < 0) {
        const ma = a.id === "striker" ? 1.6 : 1, mb = b.id === "striker" ? 1.6 : 1;
        const impulse = -1.94 * approach / (1 / ma + 1 / mb);
        a.vx -= impulse * nx / ma; a.vy -= impulse * ny / ma; b.vx += impulse * nx / mb; b.vy += impulse * ny / mb;
      }
    }
    let moving = false;
    for (const body of bodies) if (body.alive) {
      const velocity = Math.hypot(body.vx, body.vy), next = Math.max(0, velocity - FRICTION * DT);
      if (next < 2) { body.vx = 0; body.vy = 0; }
      else { body.vx *= next / velocity; body.vy *= next / velocity; moving = true; }
    }
    if (record && step % 3 === 0) frames.push(frame());
    if (!moving && step > 3) { settled = true; break; }
  }
  if (!settled) throw new Error("The shot did not settle in time. Your previous board is safe; retake the shot.");
  // Cushion contacts can be displaced by a neighboring disc. Settle those
  // tiny offsets without changing any pocket event or consuming another turn.
  for (let pass = 0; pass < 60; pass++) {
    let overlap = false;
    for (const body of bodies) if (body.alive) { const r = radius(body); body.x = Math.max(29 + r, Math.min(571 - r, body.x)); body.y = Math.max(29 + r, Math.min(571 - r, body.y)); }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j]; if (!a.alive || !b.alive) continue;
      const distance = Math.hypot(b.x - a.x, b.y - a.y), contact = radius(a) + radius(b);
      if (distance < contact - .01) { overlap = true; const nx = distance > .001 ? (b.x - a.x) / distance : 1, ny = distance > .001 ? (b.y - a.y) / distance : 0, offset = (contact - distance + .01) / 2; a.x -= nx * offset; a.y -= ny * offset; b.x += nx * offset; b.y += ny * offset; }
    }
    if (!overlap) break;
    if (pass === 59) throw new Error("Pieces could not settle safely. Retake the shot.");
  }
  if (record) frames.push(frame());
  return { outcome: { pieces: bodies.filter((body) => body.alive && body.id !== "striker").map(({ id, kind, x, y }) => ({ id, kind, x, y })), pockets: pocketed.filter((id) => id !== "striker"), strikerPocketed: pocketed.includes("striker"), ejected: [] }, frames, duration: (step + 1) * DT };
}
