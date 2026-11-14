import { coinRadius, strikerPosition, strikerRadius, type Match, type Shot } from "./engine.ts";
import { pocketCaptureRadius } from "./physics.ts";
import { boardEdge, boardFarEdge, pockets as openings } from "./geometry.ts";

type Point = { x: number; y: number };
export type GuidePoint = Point & { contact?: Point };
const pockets = openings.map(([x, y]) => ({ x, y }));

// A geometric striker guide, ending at the first coin/pocket. Cushion bounces
// follow the physics bounds and restitution; later coin collisions are not predicted.
export function aimGuide(match: Match, shot: Shot): GuidePoint[] {
  let point = strikerPosition(match.turn, shot);
  const direction = match.turn === "cream" ? 1 : -1, angle = shot.angle * Math.PI / 180;
  let dx = Math.sin(angle) * direction, dy = -Math.cos(angle) * direction;
  let distance = (100 + shot.power * 7.5) ** 2 / 350;
  const points: GuidePoint[] = [{ ...point }], low = boardEdge + strikerRadius, high = boardFarEdge - strikerRadius;
  const intersection = (center: Point, r: number) => {
    const x = point.x - center.x, y = point.y - center.y, b = x * dx + y * dy;
    const discriminant = b * b - (x * x + y * y - r * r);
    if (discriminant < 0) return Infinity;
    const t = -b - Math.sqrt(discriminant);
    return t >= 0 ? t : Infinity;
  };
  for (let bounce = 0; bounce < 5 && distance > 1; bounce++) {
    const tx = Math.abs(dx) < .00001 ? Infinity : ((dx > 0 ? high : low) - point.x) / dx;
    const ty = Math.abs(dy) < .00001 ? Infinity : ((dy > 0 ? high : low) - point.y) / dy;
    const coinHits = match.pieces.map((coin) => ({ coin, distance: intersection(coin, coinRadius + strikerRadius) })).sort((a, b) => a.distance - b.distance);
    const coinHit = coinHits[0];
    const hit = Math.min(coinHit?.distance ?? Infinity, ...pockets.map((pocket) => intersection(pocket, pocketCaptureRadius(strikerRadius))));
    const travel = Math.max(0, Math.min(tx, ty, hit, distance));
    point = { x: point.x + dx * travel, y: point.y + dy * travel };
    let contact: Point | undefined;
    if (travel === hit && coinHit?.distance === hit) {
      const length = Math.hypot(coinHit.coin.x - point.x, coinHit.coin.y - point.y);
      contact = { x: point.x + (coinHit.coin.x - point.x) / length * strikerRadius, y: point.y + (coinHit.coin.y - point.y) / length * strikerRadius };
    } else if (travel === tx || travel === ty) {
      contact = { x: travel === tx ? dx > 0 ? boardFarEdge : boardEdge : point.x, y: travel === ty ? dy > 0 ? boardFarEdge : boardEdge : point.y };
    }
    points.push({ ...point, ...(contact ? { contact } : {}) });
    if (travel === hit || travel === distance) break;
    distance = (distance - travel) * .86 ** 2;
    if (tx <= ty + .0001) dx = -dx;
    if (ty <= tx + .0001) dy = -dy;
    point = { x: point.x + dx * .01, y: point.y + dy * .01 };
  }
  return points;
}
