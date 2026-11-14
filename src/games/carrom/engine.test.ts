import test from "node:test";
import assert from "node:assert/strict";
import { coinRadius, createMatch, resolveShot, returnPiece, validateShot, type Match, type Outcome } from "./engine.ts";
import { aimGuide } from "./aim-guide.ts";
import { simulate } from "./physics.ts";
import { chooseShot } from "./computer.ts";
import { defaults, newSession, parseSession, rematch, saveSession } from "./persistence.ts";
import { boardEdge, boardFarEdge, pocketRadius, pockets } from "./geometry.ts";
import { opponentName, opponentRemark } from "./opponent.ts";

function pocket(match: Match, ids: string[] = [], foul = false, ejected: string[] = []): Match {
  const outcome: Outcome = { pieces: match.pieces.filter((p) => !ids.includes(p.id) && !ejected.includes(p.id)), pockets: ids, strikerPocketed: foul, ejected };
  return resolveShot(match, outcome);
}
function withPocketed(cream: number, ink = 0, covered = false): Match {
  const m = createMatch();
  m.pocketed = { cream: Array.from({ length: cream }, (_, i) => `c${i}`), ink: Array.from({ length: ink }, (_, i) => `d${i}`) };
  m.pieces = m.pieces.filter((p) => ![...m.pocketed.cream, ...m.pocketed.ink, ...(covered ? ["q"] : [])].includes(p.id));
  if (covered) { m.queen = "covered"; m.coverSide = "cream"; }
  return m;
}

test("standard start contains exactly nine coins each and a queen with no overlap", () => {
  const m = createMatch();
  assert.equal(m.pieces.length, 19);
  assert.equal(m.pieces.filter((p) => p.kind === "cream").length, 9);
  assert.equal(m.pieces.filter((p) => p.kind === "ink").length, 9);
  assert.ok(parseSession(JSON.stringify(newSession("practice", defaults, "test"))));
});
test("own coins earn another turn; empty or only opponent pockets pass", () => {
  assert.equal(pocket(createMatch(), ["c0"]).turn, "cream");
  assert.equal(pocket(createMatch()).turn, "ink");
  const next = pocket(createMatch(), ["d0"]);
  assert.equal(next.turn, "ink"); assert.deepEqual(next.pocketed.ink, ["d0"]);
});
test("ineligible queen returns with own coins but leaves opponent coins down", () => {
  const next = pocket(createMatch(), ["q", "c0", "d0"]);
  assert.equal(next.queen, "board"); assert.equal(next.turn, "ink");
  assert.equal(next.pocketed.cream.length, 0); assert.equal(next.pocketed.ink.length, 1);
  assert.ok(next.pieces.some((p) => p.id === "q"));
});
test("eligible queen and own coin cover immediately", () => {
  const next = pocket(withPocketed(1), ["q", "c1"]);
  assert.equal(next.queen, "covered"); assert.equal(next.coverSide, "cream"); assert.equal(next.turn, "cream");
});
test("queen alone gets exactly one immediate cover attempt", () => {
  const next = pocket(withPocketed(1), ["q"]);
  assert.equal(next.queen, "pending"); assert.equal(next.turn, "cream");
  assert.equal(pocket(next, ["c1"]).queen, "covered");
  const missed = pocket(next);
  assert.equal(missed.queen, "board"); assert.equal(missed.turn, "ink");
});
test("striker foul fails pending queen cover and returns own coins and a penalty", () => {
  const next = pocket(pocket(withPocketed(1), ["q"]), ["c1", "d0"], true);
  assert.equal(next.queen, "board"); assert.equal(next.turn, "ink");
  assert.deepEqual(next.pocketed.cream, []); assert.deepEqual(next.pocketed.ink, ["d0"]);
});
test("fouls accumulate debt; debt is repaid before extra turns", () => {
  let m = pocket(createMatch(), [], true); m.turn = "cream";
  m = pocket(m, [], true); m.turn = "cream";
  assert.equal(m.debt.cream, 2);
  m = pocket(m, ["c0", "c1"]);
  assert.equal(m.debt.cream, 0); assert.equal(m.pocketed.cream.length, 0); assert.equal(m.turn, "ink");
});
test("debt repayment cannot cover the queen", () => {
  const m = withPocketed(1); m.debt.cream = 1;
  const pending = pocket(m, ["q", "c1"]);
  assert.equal(pending.queen, "pending"); assert.equal(pending.pocketed.cream.length, 1);
  pending.debt.cream = 1;
  const next = pocket(pending, ["c2"]);
  assert.equal(next.queen, "board"); assert.equal(next.turn, "ink");
});
test("uncovered last own and opponent coins return", () => {
  const own = pocket(withPocketed(8), ["c8"]);
  assert.equal(own.result, null); assert.equal(own.pocketed.cream.length, 8); assert.equal(own.turn, "ink");
  const other = pocket(withPocketed(1, 8), ["d8"]);
  assert.equal(other.result, null); assert.equal(other.pocketed.ink.length, 8);
});
test("eligible queen together with final own coin wins", () => {
  const next = pocket(withPocketed(8), ["q", "c8"]);
  assert.equal(next.queen, "covered"); assert.equal(next.result?.winner, "cream");
});
test("opponent final coin wins; simultaneous legal finish favors shooter", () => {
  assert.equal(pocket(withPocketed(8, 8, true), ["d8"]).result?.winner, "ink");
  assert.equal(pocket(withPocketed(8, 8, true), ["c8", "d8"]).result?.winner, "cream");
});
test("penalties resolve before winner checks", () => {
  const next = pocket(withPocketed(8, 8, true), ["c8", "d8"], true);
  assert.equal(next.pocketed.cream.length, 7); assert.equal(next.result?.winner, "ink");
});
test("ejected coins return without overlap and the turn ends", () => {
  const next = pocket(withPocketed(1), [], false, ["c1", "d0"]);
  assert.equal(next.turn, "ink"); assert.equal(next.pieces.length, 19);
  for (let i = 0; i < next.pieces.length; i++) for (let j = i + 1; j < next.pieces.length; j++) assert.ok(Math.hypot(next.pieces[i].x - next.pieces[j].x, next.pieces[i].y - next.pieces[j].y) >= coinRadius * 2);
});
test("returned-piece placement is deterministic and does not duplicate IDs", () => {
  const a = createMatch().pieces.filter((p) => p.id !== "q"), b = structuredClone(a);
  returnPiece(a, "q"); returnPiece(b, "q"); returnPiece(a, "q");
  assert.deepEqual(a, b); assert.equal(a.filter((p) => p.id === "q").length, 1);
});
test("striker placement rejects blocked baseline, partial end circle and non-finite input", () => {
  const m = createMatch();
  for (const position of [-100, -80, 0, 80, 100]) validateShot(m, { position, angle: 0, power: 60 });
  assert.throws(() => validateShot(m, { position: 90, angle: 0, power: 60 }), /end circle/);
  m.pieces[0] = { ...m.pieces[0], x: 300, y: 482 };
  assert.throws(() => validateShot(m, { position: 0, angle: 0, power: 60 }), /blocks/);
  assert.throws(() => validateShot(m, { position: NaN, angle: 0, power: 60 }));
});
test("fixed timestep break is deterministic, bounded and leaves valid settled pieces", () => {
  const m = createMatch(), shot = { position: 0, angle: 0, power: 90 };
  const a = simulate(m, shot), b = simulate(m, shot);
  assert.deepEqual(a, b); assert.ok(a.duration <= 12); assert.ok(a.frames.length > 1);
  const s = newSession("practice", defaults, "physics"); s.match = resolveShot(m, a.outcome, true);
  assert.ok(parseSession(JSON.stringify(s))); assert.deepEqual(m, createMatch());
});
test("straight pocket and striker foul use actual physics", () => {
  const m = createMatch(); m.pieces = [{ id: "c0", kind: "cream", x: 160 - 282 * 104 / 426, y: 200 }];
  const shot = { position: -100, angle: Math.atan2(-104, 426) * 180 / Math.PI, power: 75 };
  const result = simulate(m, shot);
  assert.ok(result.outcome.pockets.includes("c0"));
  const empty = { ...m, pieces: [] };
  assert.ok(simulate(empty, { position: -100, angle: -13.7, power: 60 }).outcome.strikerPocketed);
});
test("practice retains turn, has no debt or winner and can clear all coins", () => {
  const m = createMatch();
  const next = resolveShot(m, { pieces: [], pockets: m.pieces.map((p) => p.id), strikerPocketed: true, ejected: [] }, true);
  assert.equal(next.turn, "cream"); assert.equal(next.result, null); assert.equal(next.debt.cream, 0); assert.equal(next.pieces.length, 0);
});
test("each computer level produces a legal deterministic shot for either side", () => {
  for (const turn of ["cream", "ink"] as const) for (const difficulty of ["easy", "medium", "hard"] as const) {
    const m = createMatch(turn), shot = chooseShot(m, difficulty);
    validateShot(m, shot); assert.deepEqual(shot, chooseShot(m, difficulty));
    assert.ok(simulate(m, shot, false).duration <= 12);
  }
});
test("saved boards preserve queen, debt and handover and reject invalid snapshots", () => {
  const s = newSession("pass-and-play", defaults, "saved");
  s.match = pocket(withPocketed(1), ["q"]); s.match.debt.cream = 2;
  assert.deepEqual(parseSession(JSON.stringify(s)), s);
  const bad = structuredClone(s); bad.match.pieces.push(bad.match.pieces[0]);
  assert.equal(parseSession(JSON.stringify(bad)), null);
  const badQueen = structuredClone(s); badQueen.match.coverSide = "ink";
  assert.equal(parseSession(JSON.stringify(badQueen)), null);
  assert.equal(parseSession("bad json"), null);
  assert.equal(saveSession({ getItem: () => null, setItem: () => { throw new Error("blocked"); } }, s), false);
});
test("rematches alternate opening sides; practice always uses the chosen baseline", () => {
  const a = newSession("computer", defaults, "a", "cream"), b = rematch(a, "b");
  assert.equal(b.match.turn, "ink"); assert.equal(rematch(b, "c").match.turn, "cream");
  const practice = newSession("practice", { ...defaults, coins: "ink" }, "practice", "cream");
  assert.equal(rematch(practice, "again").match.turn, "ink");
});


test("aim guide meets the coin edge and cushion surface using striker-radius contacts", () => {
  const m = createMatch();
  m.pieces = [{ id: "c0", kind: "cream", x: 300, y: 300 }];
  const coin = aimGuide(m, {position: 0, angle: 0, power: 100}).at(-1)!;
  assert.ok(coin.contact);
  assert.ok(Math.abs(coin.contact.y - 310.6) < .001);
  assert.ok(Math.abs(coin.y - 326.6) < .001);
  m.pieces = [];
  const bounces = aimGuide(m, {position: 0, angle: 50, power: 100});
  assert.ok(bounces.length > 2);
  assert.ok(bounces.some(p => p.contact?.x === 571));
  for (const p of bounces) assert.ok(p.x >= 45 - .02 && p.x <= 555 + .02 && p.y >= 45 - .02 && p.y <= 555 + .02);
  const oppositeGuide = aimGuide({ ...m, turn: "ink" }, {position: 0, angle: 50, power: 100});
  assert.ok(Math.abs(bounces[1].x + oppositeGuide[1].x - 600) < .01);
  assert.ok(Math.abs(bounces[1].y + oppositeGuide[1].y - 600) < .01);
});


test("pockets exert no attraction and a nearby stationary coin stays outside the opening", () => {
  const m = createMatch();
  m.pieces = [{id: "c0", kind: "cream", x: 80, y: 56}];
  const result = simulate(m, {position: 0, angle: 0, power: 1});
  assert.deepEqual(result.outcome.pieces, m.pieces);
  assert.deepEqual(result.outcome.pockets, []);
  for (const frame of result.frames) {
    const coin = frame.find(p => p.id === "c0");
    assert.deepEqual(coin, {id: "c0", x: 80, y: 56});
  }
});

test("all four rail-touching openings accept a real shot and agree with the guide", () => {
  for (const [x, y] of pockets) {
    assert.equal(Math.min(x - boardEdge, boardFarEdge - x), pocketRadius);
    assert.equal(Math.min(y - boardEdge, boardFarEdge - y), pocketRadius);
    const turn = y < 300 ? "cream" : "ink", direction = turn === "cream" ? 1 : -1;
    const sx = x < 300 ? 160 : 440, sy = turn === "cream" ? 482 : 118;
    const shot = { position: (sx - 300) / 1.4 * direction, angle: Math.atan2((x - sx) * direction, (sy - y) * direction) * 180 / Math.PI, power: 75 };
    const match = createMatch(turn);
    match.pieces = [{ id: "c0", kind: "cream", x: sx + (x - sx) * .65, y: sy + (y - sy) * .65 }];
    assert.deepEqual(simulate(match, shot).outcome.pockets, ["c0"]);
    match.pieces = [];
    const end = aimGuide(match, shot).at(-1)!;
    assert.ok(Math.hypot(end.x - x, end.y - y) < pocketRadius);
    assert.equal(end.contact, undefined);
    assert.equal(simulate(match, shot).outcome.strikerPocketed, true);
  }
});

test("old computer saves gain Ravi's identity without changing the player or settled match", () => {
  for (const humanSide of ["cream", "ink"] as const) {
    const old = newSession("computer", { ...defaults, coins: humanSide, names: ["Tirtha", ""] }, "legacy-rival");
    const computerSide = humanSide === "cream" ? "ink" : "cream";
    old.players[computerSide] = "Computer";
    const restored = parseSession(JSON.stringify(old))!;
    assert.equal(restored.players[humanSide], "Tirtha");
    assert.equal(restored.players[computerSide], opponentName);
    assert.deepEqual(restored.match, old.match);
  }
  const local = newSession("pass-and-play", { ...defaults, names: ["Tirtha", "Computer"] }, "local-friend");
  assert.deepEqual(parseSession(JSON.stringify(local)), local);
});

test("Ravi reacts to fouls, a pending cover and the actual winner on either side", () => {
  for (const humanSide of ["cream", "ink"] as const) {
    const rival = humanSide === "cream" ? "ink" : "cream";
    const foul = pocket(createMatch(humanSide), [], true);
    assert.match(opponentRemark(foul, humanSide, true, false).text, /softer touch/);
    const ownFoul = pocket(createMatch(rival), [], true);
    assert.match(opponentRemark(ownFoul, humanSide, false, false).text, /my striker/);
    const pending = createMatch(humanSide);
    pending.revision = 2; pending.queen = "pending"; pending.coverSide = humanSide;
    assert.match(opponentRemark(pending, humanSide, false, false).text, /yours to cover/);
    pending.result = { winner: humanSide, reason: "cleared" };
    assert.equal(opponentRemark(pending, humanSide, false, false).mood, "impressed");
    pending.result.winner = rival;
    assert.equal(opponentRemark(pending, humanSide, false, false).mood, "delighted");
  }
});
