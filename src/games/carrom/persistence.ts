import { coinRadius, createMatch, opposite, type Match, type Side } from "./engine.ts";
import type { Difficulty } from "./computer.ts";
import { opponentName } from "./opponent.ts";

export const SESSION_KEY = "vihar-games:carrom:session:v1";
export const SETTINGS_KEY = "vihar-games:carrom:settings:v1";
export type Mode = "computer" | "practice" | "pass-and-play";
export type Settings = { difficulty: Difficulty; coins: Side; names: [string, string] };
export const defaults: Settings = { difficulty: "medium", coins: "cream", names: ["", ""] };
export type Session = { version: 1; id: string; mode: Mode; difficulty: Difficulty; humanSide: Side; players: Record<Side, string>; opening: Side; handover: boolean; match: Match };
type StorageLike = Pick<Storage, "getItem" | "setItem">;
const side = (value: unknown): value is Side => value === "cream" || value === "ink";
const level = (value: unknown) => ["easy", "medium", "hard"].includes(String(value));

export function newSession(mode: Mode, settings: Settings, id: string, opening: Side = Math.random() < .5 ? "cream" : "ink"): Session {
  const first = settings.names[0].trim() || (mode === "pass-and-play" ? "Player 1" : "You");
  const second = mode === "computer" ? opponentName : settings.names[1].trim() || "Player 2";
  return { version: 1, id, mode, difficulty: settings.difficulty, humanSide: settings.coins, players: settings.coins === "cream" ? { cream: first, ink: second } : { cream: second, ink: first }, opening, handover: false, match: createMatch(mode === "practice" ? settings.coins : opening) };
}

export function parseSession(raw: string | null): Session | null {
  if (!raw || raw.length > 30000) return null;
  try {
    const s = JSON.parse(raw) as Session, m = s.match;
    if (s.version !== 1 || typeof s.id !== "string" || !s.id || s.id.length > 100 || !["computer", "practice", "pass-and-play"].includes(s.mode) || !level(s.difficulty) || !side(s.humanSide) || !side(s.opening) || typeof s.handover !== "boolean") return null;
    if (!s.players || ![s.players.cream, s.players.ink].every((n) => typeof n === "string" && n.trim() && n.length <= 24)) return null;
    if (!m || !side(m.turn) || !Number.isSafeInteger(m.revision) || m.revision < 0 || !["board", "pending", "covered"].includes(m.queen)) return null;
    if (m.queen === "board" ? m.coverSide !== null : !side(m.coverSide)) return null;
    if (m.queen === "pending" && m.coverSide !== m.turn) return null;
    if (!m.debt || ![m.debt.cream, m.debt.ink].every((d) => Number.isSafeInteger(d) && d >= 0)) return null;
    if (!Array.isArray(m.pieces) || m.pieces.length > 19 || !m.pocketed || !Array.isArray(m.pocketed.cream) || !Array.isArray(m.pocketed.ink)) return null;
    const expected = new Map(createMatch().pieces.map((p) => [p.id, p.kind]));
    const ids: string[] = [];
    for (const p of m.pieces) {
      if (!p || expected.get(p.id) !== p.kind || ![p.x, p.y].every((v) => Number.isFinite(v) && v >= 29 + coinRadius - .02 && v <= 571 - coinRadius + .02)) return null;
      ids.push(p.id);
    }
    for (const color of ["cream", "ink"] as const) for (const id of m.pocketed[color]) { if (expected.get(id) !== color) return null; ids.push(id); }
    if (m.queen !== "board") ids.push("q");
    if (ids.length !== 19 || new Set(ids).size !== 19) return null;
    for (let i = 0; i < m.pieces.length; i++) for (let j = i + 1; j < m.pieces.length; j++) if (Math.hypot(m.pieces[i].x - m.pieces[j].x, m.pieces[i].y - m.pieces[j].y) < coinRadius * 2 - .03) return null;
    if (!Array.isArray(m.messages) || m.messages.length > 30 || !m.messages.every((v) => typeof v === "string" && v.length <= 500)) return null;
    if (m.result !== null && (!m.result || !side(m.result.winner) || !["cleared", "resignation"].includes(m.result.reason))) return null;
    if (m.result?.reason === "cleared" && (m.queen !== "covered" || m.pocketed[m.result.winner].length !== 9)) return null;
    if (s.mode === "practice" && (m.result || s.handover || m.turn !== s.humanSide)) return null;
    if (s.handover && (s.mode !== "pass-and-play" || m.result || m.revision === 0)) return null;
    if (s.mode === "computer") s.players[opposite(s.humanSide)] = opponentName;
    return s;
  } catch { return null; }
}

export function saveSession(storage: StorageLike, session: Session) {
  try { storage.setItem(SESSION_KEY, JSON.stringify(session)); return true; } catch { return false; }
}
export function loadSettings(storage: StorageLike): Settings {
  try {
    const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings;
    return s && level(s.difficulty) && side(s.coins) && Array.isArray(s.names) && s.names.length === 2 && s.names.every((n) => typeof n === "string" && n.length <= 24) ? s : defaults;
  } catch { return defaults; }
}
export function rematch(session: Session, id: string): Session {
  return { ...session, id, opening: opposite(session.opening), handover: false, match: createMatch(session.mode === "practice" ? session.humanSide : opposite(session.opening)) };
}
