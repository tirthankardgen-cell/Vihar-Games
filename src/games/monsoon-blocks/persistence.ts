import { createRun, validRun, RULES_VERSION, STEP_MS, type Preset, type Run } from "./engine.ts";

export const SESSION_KEY = "vihar-games:monsoon-blocks:session:v1";
export const SETTINGS_KEY = "vihar-games:monsoon-blocks:settings:v1";
export const RECORDS_KEY = "vihar-games:monsoon-blocks:records:v1";
export type Session = { version: 1; rulesVersion: string; id: string; run: Run; remainder: number };
export type Settings = { preset: Preset; sound: boolean; music: boolean };
export type Best = { score: number; rows: number; level: number; elapsedMs: number };
export type Records = { version: 1; rulesVersion: string; standard: Best; practice: Best };
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const defaultSettings: Settings = { preset: "standard", sound: false, music: false };
const emptyBest = (): Best => ({ score: 0, rows: 0, level: 1, elapsedMs: 0 });
export const emptyRecords = (): Records => ({ version: 1, rulesVersion: RULES_VERSION, standard: emptyBest(), practice: emptyBest() });
export const newSession = (preset: Preset, seed: number, id: string): Session => ({ version: 1, rulesVersion: RULES_VERSION, id, run: createRun(preset, seed), remainder: 0 });
export function parseSession(raw: string | null): Session | null {
  if (!raw || raw.length > 24000) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (!s || s.version !== 1 || s.rulesVersion !== RULES_VERSION || typeof s.id !== "string" || !s.id || s.id.length > 100 || !validRun(s.run) || !Number.isFinite(s.remainder) || s.remainder < 0 || s.remainder >= STEP_MS) return null;
    return s;
  } catch { return null; }
}
export function loadSession(storage: StorageLike): { session: Session | null; damaged: boolean; unavailable: boolean } {
  try {
    const raw = storage.getItem(SESSION_KEY), session = parseSession(raw);
    if (raw && !session) { storage.removeItem(SESSION_KEY); return { session: null, damaged: true, unavailable: false }; }
    return { session, damaged: false, unavailable: false };
  } catch { return { session: null, damaged: false, unavailable: true }; }
}
export function saveSession(storage: StorageLike, session: Session): boolean {
  try { storage.setItem(SESSION_KEY, JSON.stringify(session)); return true; } catch { return false; }
}
export function loadSettings(storage: StorageLike): Settings {
  try {
    const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings;
    return s && ["standard", "practice"].includes(s.preset) && typeof s.sound === "boolean" && (s.music === undefined || typeof s.music === "boolean") ? { preset: s.preset, sound: s.sound, music: s.music ?? false } : { ...defaultSettings };
  } catch { return { ...defaultSettings }; }
}
export function loadRecords(storage: StorageLike): Records {
  try {
    const r = JSON.parse(storage.getItem(RECORDS_KEY) ?? "null") as Records;
    if (!r || r.version !== 1 || r.rulesVersion !== RULES_VERSION || ![r.standard, r.practice].every((b) => b && Number.isSafeInteger(b.score) && b.score >= 0 && b.score <= 1000000000000 && Number.isSafeInteger(b.rows) && b.rows >= 0 && b.rows <= 1000000 && b.level === 1 + Math.floor(b.rows / 10) && Number.isSafeInteger(b.elapsedMs) && b.elapsedMs >= 0 && b.elapsedMs <= 31536000000)) return emptyRecords();
    return r;
  } catch { return emptyRecords(); }
}
export function recordResult(records: Records, run: Run): Records {
  if (run.status !== "ended" || run.score <= records[run.preset].score) return records;
  return { ...records, [run.preset]: { score: run.score, rows: run.rows, level: run.level, elapsedMs: run.elapsedMs } };
}
export function saveValue(storage: StorageLike, key: typeof SETTINGS_KEY | typeof RECORDS_KEY, value: Settings | Records): boolean {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
