import { createRun, RULES_VERSION, STEP, validRun, scoreOf, type Mode, type Run } from "./engine.ts";

export const SESSION_KEY = "vihar-games:dune-dash:session:v1";
export const SETTINGS_KEY = "vihar-games:dune-dash:settings:v1";
export const RECORDS_KEY = "vihar-games:dune-dash:records:v1";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type Session = { version: 1; rulesVersion: string; id: string; run: Run; remainder: number; date: string };
export type Settings = { version: 1; mode: Mode; sound: boolean; music: boolean };
type Best = { distance: number; score: number; elapsed: number };
export type Records = { version: 1; rulesVersion: string; endless: Best; practice: Best };
export const defaultSettings: Settings = { version: 1, mode: "endless", sound: false, music: false };
export const emptyRecords = (): Records => ({ version: 1, rulesVersion: RULES_VERSION, endless: { distance: 0, score: 0, elapsed: 0 }, practice: { distance: 0, score: 0, elapsed: 0 } });
export const newSession = (mode: Mode, seed: number, id: string, date: string): Session => ({ version: 1, rulesVersion: RULES_VERSION, id, date, run: createRun(mode, seed), remainder: 0 });

export function parseSession(raw: string | null): Session | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const s = JSON.parse(raw) as Session;
    return s && s.version === 1 && s.rulesVersion === RULES_VERSION && typeof s.id === "string" && s.id.length > 0 && s.id.length < 100 && typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && Number.isFinite(s.remainder) && s.remainder >= 0 && s.remainder < STEP && validRun(s.run) ? s : null;
  } catch { return null; }
}
export function loadSession(storage: StorageLike) {
  const raw = storage.getItem(SESSION_KEY), session = parseSession(raw);
  return { session, damaged: !!raw && !session };
}
export function loadSettings(storage: StorageLike): Settings {
  try {
    const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings;
    return s?.version === 1 && ["endless", "practice"].includes(s.mode) && typeof s.sound === "boolean" && (s.music === undefined || typeof s.music === "boolean") ? { ...s, music: s.music ?? false } : defaultSettings;
  } catch { return defaultSettings; }
}
export function loadRecords(storage: StorageLike): Records {
  try {
    const r = JSON.parse(storage.getItem(RECORDS_KEY) ?? "null") as Records;
    if (r?.version !== 1 || r.rulesVersion !== RULES_VERSION || ![r.endless, r.practice].every((v) => v && Number.isFinite(v.distance) && v.distance >= 0 && v.distance <= 31536000 * 420 && Number.isSafeInteger(v.score) && v.score === Math.floor(v.distance / 10) && Number.isFinite(v.elapsed) && v.elapsed >= 0 && v.elapsed <= 31536000)) return emptyRecords();
    return r;
  } catch { return emptyRecords(); }
}
export function recordResult(records: Records, run: Run): Records {
  return run.status === "ended" && run.distance > records[run.mode].distance ? { ...records, [run.mode]: { distance: run.distance, score: scoreOf(run), elapsed: run.elapsed } } : records;
}
export function saveValue(storage: StorageLike, key: string, value: Session | Settings | Records): boolean {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
