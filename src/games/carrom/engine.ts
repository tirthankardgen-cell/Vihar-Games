export type Side = "cream" | "ink";
export type Piece = { id: string; kind: Side | "queen"; x: number; y: number };
export type Shot = { position: number; angle: number; power: number };
export type Match = {
  pieces: Piece[]; pocketed: Record<Side, string[]>; turn: Side;
  queen: "board" | "pending" | "covered"; coverSide: Side | null;
  debt: Record<Side, number>; revision: number;
  result: { winner: Side; reason: "cleared" | "resignation" } | null; messages: string[];
};
export type Outcome = { pieces: Piece[]; pockets: string[]; strikerPocketed: boolean; ejected: string[] };
export const opposite = (side: Side): Side => side === "cream" ? "ink" : "cream";
export const sideName = (side: Side) => side === "cream" ? "Cream" : "Dark";
export const coinRadius = 10.6;
export const strikerRadius = 16;
export const radius = (piece: { id: string }) => piece.id === "striker" ? strikerRadius : coinRadius;

export function createMatch(turn: Side = "cream"): Match {
  const pieces: Piece[] = [{ id: "q", kind: "queen", x: 300, y: 300 }];
  const counts: Record<Side, number> = { cream: 0, ink: 0 };
  for (const [size, distance] of [[6, 23], [12, 46]]) {
    for (let i = 0; i < size; i++) {
      const kind: Side = (size === 6 ? i % 2 === 0 : i % 2 === 1) ? "cream" : "ink";
      pieces.push({ id: `${kind === "cream" ? "c" : "d"}${counts[kind]++}`, kind, x: 300 + distance * Math.sin(i * 2 * Math.PI / size), y: 300 + distance * Math.cos(i * 2 * Math.PI / size) });
    }
  }
  return { pieces, pocketed: { cream: [], ink: [] }, turn, queen: "board", coverSide: null, debt: { cream: 0, ink: 0 }, revision: 0, result: null, messages: ["Slide the striker on your baseline. Pull back to aim and add power, then release to strike."] };
}

export function strikerPosition(turn: Side, shot: Shot) {
  return { x: 300 + shot.position * 1.4 * (turn === "cream" ? 1 : -1), y: turn === "cream" ? 482 : 118 };
}

export function validateShot(match: Match, shot: Shot) {
  if (match.result) throw new Error("This board has finished.");
  if (![shot.position, shot.angle, shot.power].every(Number.isFinite) || Math.abs(shot.position) > 100 || Math.abs(shot.angle) > 75 || shot.power < 1 || shot.power > 100) throw new Error("Choose a valid position, angle, and power.");
  const striker = strikerPosition(match.turn, shot);
  const endDistance = Math.min(Math.abs(striker.x - 160), Math.abs(striker.x - 440));
  if (endDistance > 4 && endDistance < 28) throw new Error("Cover the end circle fully, or move inside both baseline lines.");
  if (match.pieces.some((coin) => Math.hypot(coin.x - striker.x, coin.y - striker.y) < coinRadius + strikerRadius + .5)) throw new Error("A coin blocks that position. Move your striker along the baseline.");
}

const template = (id: string): Piece => ({ id, kind: id === "q" ? "queen" : id.startsWith("c") ? "cream" : "ink", x: 300, y: 300 });
const returnSpots = Array.from({ length: 23 * 23 }, (_, i) => ({ x: 300 + (i % 23 - 11) * 23, y: 300 + (Math.floor(i / 23) - 11) * 23 })).sort((a, b) => (a.x - 300) ** 2 + (a.y - 300) ** 2 - (b.x - 300) ** 2 - (b.y - 300) ** 2 || a.y - b.y || a.x - b.x);

export function returnPiece(pieces: Piece[], id: string) {
  if (pieces.some((piece) => piece.id === id)) return;
  const spot = returnSpots.find((point) => point.x > 40 && point.x < 560 && point.y > 40 && point.y < 560 && !pieces.some((piece) => Math.hypot(piece.x - point.x, piece.y - point.y) < coinRadius * 2 + 1));
  if (!spot) throw new Error("No free place for a returned coin. Retake the shot.");
  pieces.push({ ...template(id), ...spot });
}

export function resolveShot(match: Match, outcome: Outcome, practice = false): Match {
  const actor = match.turn, other = opposite(actor);
  const next: Match = { ...match, pieces: outcome.pieces.map((piece) => ({ ...piece })), pocketed: { cream: [...match.pocketed.cream], ink: [...match.pocketed.ink] }, debt: { ...match.debt }, revision: match.revision + 1, messages: [] };
  const known = new Set(match.pieces.map((piece) => piece.id));
  if (new Set(outcome.pockets).size !== outcome.pockets.length || outcome.pockets.some((id) => !known.has(id))) throw new Error("Invalid pocket outcome.");
  const own = outcome.pockets.filter((id) => template(id).kind === actor);
  const queenPocketed = outcome.pockets.includes("q");
  for (const id of outcome.pockets) if (id !== "q") next.pocketed[template(id).kind as Side].push(id);
  const returnCoin = (id: string) => { const kind = template(id).kind; if (kind !== "queen") next.pocketed[kind] = next.pocketed[kind].filter((coin) => coin !== id); returnPiece(next.pieces, id); };
  const returnQueen = () => { returnPiece(next.pieces, "q"); next.queen = "board"; next.coverSide = null; };
  const foul = outcome.strikerPocketed || outcome.ejected.length > 0;
  if (practice) {
    for (const id of outcome.ejected) if (id !== "striker") returnCoin(id);
    if (queenPocketed) { next.queen = "covered"; next.coverSide = actor; }
    next.messages = [foul ? "Striker foul. In practice there is no penalty—try another shot." : outcome.pockets.length ? `${outcome.pockets.length} ${outcome.pockets.length === 1 ? "coin" : "coins"} pocketed. Take another shot.` : "Find your next angle. Take another shot."];
    return next;
  }
  let keepTurn = false, forceEnd = false;
  if (foul) {
    own.forEach(returnCoin);
    if (queenPocketed || match.queen === "pending") returnQueen();
    outcome.ejected.filter((id) => id !== "striker").forEach(returnCoin);
    const penalty = match.pocketed[actor].at(-1);
    if (penalty) { returnCoin(penalty); next.messages.push("Foul: one previously pocketed coin returns as a penalty."); }
    else { next.debt[actor]++; next.messages.push(`Foul: one coin owed. Total debt: ${next.debt[actor]}.`); }
    next.messages.push(outcome.strikerPocketed ? "The striker went into a pocket. Your turn ends." : "A piece left the board. Your turn ends.");
    if (queenPocketed || match.queen === "pending") next.messages.push("The queen returns to the nearest free center spot.");
    forceEnd = true;
  } else if (queenPocketed && match.pocketed[actor].length === 0) {
    own.forEach(returnCoin); returnQueen(); forceEnd = true;
    next.messages.push("The queen was pocketed too early. Pocket an own coin in an earlier legal shot first. Your coins and the queen return; your turn ends.");
  } else {
    const retained = [...own];
    while (next.debt[actor] > 0 && retained.length) { returnCoin(retained.shift()!); next.debt[actor]--; next.messages.push("An own coin returns to repay one coin of debt."); }
    keepTurn = retained.length > 0;
    if (queenPocketed || match.queen === "pending") {
      if (retained.length) { next.queen = "covered"; next.coverSide = actor; next.messages.push("Queen covered! Either player can now clear their set to win."); }
      else if (match.queen === "pending") { returnQueen(); forceEnd = true; next.messages.push("Queen cover missed. The queen returns and your turn ends."); }
      else { next.queen = "pending"; next.coverSide = actor; keepTurn = true; next.messages.push("Queen pocketed. Cover it with an own coin on your very next shot."); }
    }
  }
  if (next.queen !== "covered") {
    for (const side of [actor, other]) if (next.pocketed[side].length === 9) {
      returnCoin(next.pocketed[side].at(-1)!);
      next.messages.push(`${sideName(side)}’s final coin returns: the queen must be covered first.`);
      if (side === actor) forceEnd = true;
    }
  } else {
    const winner = !foul && next.pocketed[actor].length === 9 ? actor : next.pocketed[other].length === 9 ? other : null;
    if (winner) { next.result = { winner, reason: "cleared" }; next.messages.push(`${sideName(winner)} clears the board and wins!`); }
  }
  next.turn = keepTurn && !forceEnd ? actor : other;
  if (!next.result) next.messages.push(next.turn === actor ? next.queen === "pending" ? "One immediate queen cover attempt." : "Your own coin earns another shot." : `${sideName(next.turn)} to play.`);
  return next;
}

export function resign(match: Match): Match {
  return { ...match, revision: match.revision + 1, result: { winner: opposite(match.turn), reason: "resignation" }, messages: [`${sideName(match.turn)} resigns.`] };
}
