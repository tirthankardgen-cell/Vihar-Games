import { opposite, resolveShot, strikerPosition, validateShot, type Match, type Shot } from "./engine.ts";
import { simulate } from "./physics.ts";

export type Difficulty = "easy" | "medium" | "hard";
const pockets = [[56, 56], [544, 56], [56, 544], [544, 544]];

// Search uses the same deterministic physics as human shots, inside a worker.
// Difficulty changes the number of candidates and aim precision, never physics.
export function chooseShot(match: Match, difficulty: Difficulty): Shot {
  const actor = match.turn, other = opposite(actor), candidates: Shot[] = [];
  const targets = match.pieces.filter((p) => p.kind === actor || (p.kind === "queen" && match.pocketed[actor].length > 0));
  for (const coin of targets) for (const [px, py] of pockets) {
    const length = Math.hypot(px - coin.x, py - coin.y);
    const ghost = { x: coin.x - (px - coin.x) / length * 26.6, y: coin.y - (py - coin.y) / length * 26.6 };
    for (const position of [-100, -65, -30, 0, 30, 65, 100]) {
      const start = strikerPosition(actor, { position, angle: 0, power: 50 });
      const direction = actor === "cream" ? 1 : -1;
      const angle = Math.atan2((ghost.x - start.x) * direction, -(ghost.y - start.y) * direction) * 180 / Math.PI;
      if (Math.abs(angle) > 75) continue;
      const travel = Math.hypot(ghost.x - start.x, ghost.y - start.y);
      const power = Math.max(15, Math.min(100, (Math.sqrt(350 * (travel + length * 1.35)) - 100) / 7.5));
      candidates.push({ position, angle, power });
    }
  }
  // A spread of break/cushion shots also works when every direct target is behind us.
  for (const position of [-100, -50, 0, 50, 100]) for (const angle of [-60, -30, 0, 30, 60]) candidates.push({ position, angle, power: 85 });
  let seed = (match.revision + 1) * 7919;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const shuffled = candidates.map((shot) => ({ shot, order: random() })).sort((a, b) => a.order - b.order);
  const limit = { easy: 10, medium: 30, hard: 70 }[difficulty];
  const ranked: { shot: Shot; score: number }[] = [];
  for (const { shot: original } of shuffled) {
    if (ranked.length >= limit) break;
    const shot = original;
    try {
      const simulation = simulate(match, shot, false), next = resolveShot(match, simulation.outcome);
      let score = (next.pocketed[actor].length - match.pocketed[actor].length) * 100 - (next.pocketed[other].length - match.pocketed[other].length) * 70;
      if (simulation.outcome.strikerPocketed) score -= 180;
      if (next.queen === "covered" && match.queen !== "covered") score += 150;
      if (next.queen === "pending" && next.coverSide === actor) score += 45;
      if (next.result) score += next.result.winner === actor ? 10000 : -10000;
      score += next.turn === actor ? 12 : 0;
      // Prefer spreading our coins toward pockets when no pot is available.
      for (const coin of next.pieces.filter((p) => p.kind === actor)) score += (350 - Math.min(...pockets.map(([x, y]) => Math.hypot(coin.x - x, coin.y - y)))) / 100;
      ranked.push({ shot, score });
    } catch { /* Blocked baseline positions and rejected simulations are skipped. */ }
  }
  ranked.sort((a, b) => b.score - a.score);
  if (ranked.length) {
    const choice = ranked[difficulty === "hard" ? 0 : Math.floor(random() * Math.min(difficulty === "easy" ? 4 : 2, ranked.length))].shot;
    // Apply execution error AFTER search. Searching the inaccurate shot would
    // simply select a perfect replacement and make the computer too precise.
    const aimError = { easy: 12, medium: 6, hard: 2.5 }[difficulty];
    const powerError = { easy: 16, medium: 10, hard: 4 }[difficulty];
    return { ...choice, angle: Math.max(-75, Math.min(75, choice.angle + (random() - .5) * aimError)), power: Math.max(1, Math.min(100, choice.power + (random() - .5) * powerError)) };
  }
  for (let position = -100; position <= 100; position += 5) {
    const shot = { position, angle: 0, power: 70 };
    try { validateShot(match, shot); return shot; } catch { /* Try the next position. */ }
  }
  throw new Error("No free striker position. Start another board.");
}
