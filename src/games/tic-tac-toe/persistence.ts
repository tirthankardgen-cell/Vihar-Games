import { isValidMatch, type Difficulty, type Match } from "./engine.ts";

export const SESSION_KEY = "vihar-games:tic-tac-toe:session:v1";
export const SETTINGS_KEY = "vihar-games:tic-tac-toe:settings:v1";
export type LocalMode = "computer" | "pass-and-play";
export type LocalSession = {
  version: 1;
  id: string;
  mode: LocalMode;
  players: [string, string];
  difficulty: Difficulty;
  match: Match;
  handover: boolean;
};
export type Settings = {
  difficulty: Difficulty;
  mark: "X" | "O" | "random";
  names: [string, string];
  firstXSeat: 0 | 1;
};
export const defaultSettings: Settings = { difficulty: "medium", mark: "X", names: ["", ""], firstXSeat: 0 };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function parseSession(raw: string | null): LocalSession | null {
  if (!raw || raw.length > 12_000) return null;
  try {
    const value = JSON.parse(raw) as LocalSession;
    if (value.version !== 1 || typeof value.id !== "string" || value.id.length > 100) return null;
    if (value.mode !== "computer" && value.mode !== "pass-and-play") return null;
    if (!Array.isArray(value.players) || value.players.length !== 2 || !value.players.every((name) => typeof name === "string" && name.trim().length > 0 && name.length <= 24)) return null;
    if (!["easy", "medium", "hard"].includes(value.difficulty) || typeof value.handover !== "boolean" || !isValidMatch(value.match)) return null;
    if (value.handover && (value.mode !== "pass-and-play" || value.match.status !== "playing" || value.match.board.every((cell) => cell === null))) return null;
    if (value.mode === "computer" && value.players[1] !== "Computer") return null;
    return value;
  } catch { return null; }
}

export function loadSession(storage: StorageLike): { session: LocalSession | null; damaged: boolean } {
  try {
    const raw = storage.getItem(SESSION_KEY);
    const session = parseSession(raw);
    if (raw && !session) { storage.removeItem(SESSION_KEY); return { session: null, damaged: true }; }
    return { session, damaged: false };
  } catch { return { session: null, damaged: false }; }
}

export function saveSession(storage: StorageLike, session: LocalSession): boolean {
  try { storage.setItem(SESSION_KEY, JSON.stringify(session)); return true; } catch { return false; }
}

export function loadSettings(storage: StorageLike): Settings {
  try {
    const value = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings | null;
    if (!value || !["easy", "medium", "hard"].includes(value.difficulty) || !["X", "O", "random"].includes(value.mark)) return defaultSettings;
    if (!Array.isArray(value.names) || value.names.length !== 2 || !value.names.every((name) => typeof name === "string" && name.length <= 24)) return defaultSettings;
    if (value.firstXSeat !== 0 && value.firstXSeat !== 1) return defaultSettings;
    return value;
  } catch { return defaultSettings; }
}

export function saveSettings(storage: StorageLike, settings: Settings): void {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Storage is optional for local play. */ }
}
