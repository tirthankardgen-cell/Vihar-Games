import { Chess } from "chess.js";
import { claimReason, createMatch, makeMove, type Color, type Match } from "./engine.ts";
import type { Difficulty } from "./computer.ts";

export const SESSION_KEY = "vihar-games:chess:session:v1";
export const SETTINGS_KEY = "vihar-games:chess:settings:v1";
export type Mode = "computer" | "pass-and-play";
export type Settings = { difficulty: Difficulty; side: Color | "random"; names: [string, string] };
export const defaults: Settings = { difficulty: "medium", side: "w", names: ["", ""] };
export type Session = {
  version: 1; id: string; mode: Mode; difficulty: Difficulty; humanSide: Color;
  opponentId: "acharya-dev" | null; players: Record<Color, string>; match: Match; handover: boolean; practice: boolean;
};
type StorageLike = Pick<Storage, "getItem" | "setItem">;
const validLevel = (value: unknown) => ["easy", "medium", "hard"].includes(String(value));

export function newSession(mode: Mode, settings: Settings, id: string, random = Math.random): Session {
  const side = settings.side === "random" ? random() < .5 ? "w" : "b" : settings.side;
  const first = settings.names[0].trim() || (mode === "computer" ? "You" : "Player 1");
  const second = mode === "computer" ? "Acharya Dev" : settings.names[1].trim() || "Player 2";
  return { version: 1, id, mode, difficulty: settings.difficulty, humanSide: side, opponentId: mode === "computer" ? "acharya-dev" : null, players: side === "w" ? { w: first, b: second } : { w: second, b: first }, match: createMatch(), handover: false, practice: false };
}

export function parseSession(raw: string | null): Session | null {
  if (!raw || raw.length > 600_000) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (s.version !== 1 || typeof s.id !== "string" || s.id.length > 100 || !["computer", "pass-and-play"].includes(s.mode) || !validLevel(s.difficulty) || !["w", "b"].includes(s.humanSide)) return null;
    if (typeof s.handover !== "boolean" || typeof s.practice !== "boolean" || !s.players || ![s.players.w, s.players.b].every((name) => typeof name === "string" && name.trim().length > 0 && name.length <= 24)) return null;
    if (s.opponentId !== (s.mode === "computer" ? "acharya-dev" : null)) return null;
    if (s.mode === "computer" && s.players[s.humanSide === "w" ? "b" : "w"] !== "Acharya Dev") return null;
    if (!s.match || !Array.isArray(s.match.moves) || s.match.moves.length > 3000 || !Number.isSafeInteger(s.match.revision) || s.match.revision < s.match.moves.length) return null;
    // Local saves must originate in the standard starting position. Replay
    // protects castling rights, counters, and the FULL repetition history.
    let replay = createMatch();
    if (s.match.initialFen !== replay.initialFen) return null;
    for (const move of s.match.moves) replay = makeMove(replay, move, new Chess(replay.fen).turn());
    if (replay.fen !== s.match.fen || JSON.stringify(replay.positionKeys) !== JSON.stringify(s.match.positionKeys) || JSON.stringify(replay.notation) !== JSON.stringify(s.match.notation)) return null;
    if (s.match.drawOffer !== null && s.match.drawOffer !== "w" && s.match.drawOffer !== "b") return null;
    if (replay.result && JSON.stringify(replay.result) !== JSON.stringify(s.match.result)) return null;
    if (s.match.result) {
      const { reason, winner } = s.match.result;
      if (!["checkmate", "resignation", "stalemate", "dead-position", "threefold-repetition", "fivefold-repetition", "fifty-move-rule", "seventy-five-move-rule", "agreement"].includes(reason)) return null;
      if ((reason === "checkmate" || reason === "resignation") ? winner !== "w" && winner !== "b" : winner !== null) return null;
      if (s.match.drawOffer !== null) return null;
      if (!replay.result && !["resignation", "agreement", "threefold-repetition", "fifty-move-rule"].includes(reason)) return null;
      if (["threefold-repetition", "fifty-move-rule"].includes(reason) && (!s.match.drawClaim || claimReason(replay, s.match.drawClaim.intended ?? undefined) !== reason)) return null;
    }
    if (s.match.drawClaim !== null && !["threefold-repetition", "fifty-move-rule"].includes(s.match.result?.reason ?? "")) return null;
    if (s.handover && (s.mode !== "pass-and-play" || s.match.result || !s.match.moves.length)) return null;
    return s;
  } catch { return null; }
}

export function loadSession(storage: StorageLike): { session: Session | null; damaged: boolean } {
  const raw = storage.getItem(SESSION_KEY), session = parseSession(raw);
  return { session, damaged: Boolean(raw && !session) };
}
export function saveSession(storage: StorageLike, session: Session): boolean {
  try { storage.setItem(SESSION_KEY, JSON.stringify(session)); return true; } catch { return false; }
}
export function loadSettings(storage: StorageLike): Settings {
  try {
    const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings;
    if (!s || !validLevel(s.difficulty) || !["w", "b", "random"].includes(s.side) || !Array.isArray(s.names) || s.names.length !== 2 || !s.names.every((name) => typeof name === "string" && name.length <= 24)) return defaults;
    return s;
  } catch { return defaults; }
}
