import { createRun, validRun, RULES_VERSION, STEP, type Mode, type Run } from "./engine.ts";

export const SESSION_KEY = "vihar-games:paperwing:session:v1";
export const SETTINGS_KEY = "vihar-games:paperwing:settings:v1";
export const RECORDS_KEY = "vihar-games:paperwing:records:v1";
export type Session = { version: 1; rulesVersion: string; id: string; run: Run; remainder: number };
export type Settings = { mode: Mode; sound: boolean };
export type RecordValue = { score: number; elapsed: number };
export type Records = { version: 1; rulesVersion: string; standard: RecordValue; practice: RecordValue };
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const defaultSettings: Settings = { mode: "standard", sound: false };
export const emptyRecords = (): Records => ({ version: 1, rulesVersion: RULES_VERSION, standard: { score: 0, elapsed: 0 }, practice: { score: 0, elapsed: 0 } });
export const newSession = (mode: Mode, seed: number, id: string): Session => ({ version: 1, rulesVersion: RULES_VERSION, id, run: createRun(mode, seed), remainder: 0 });
export function parseSession(raw: string | null): Session | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (s.version !== 1 || s.rulesVersion !== RULES_VERSION || typeof s.id !== "string" || !s.id || s.id.length > 100 || !validRun(s.run) || !Number.isFinite(s.remainder) || s.remainder < 0 || s.remainder >= STEP) return null;
    return s;
  } catch { return null; }
}
export function loadSession(storage: StorageLike): { session: Session | null; damaged: boolean } {
  try {
    const raw = storage.getItem(SESSION_KEY), session = parseSession(raw);
    if (raw && !session) {
      let legacy = false;
      try { legacy = JSON.parse(raw).rulesVersion === "1.0.0"; } catch { /* Corrupt saves still report recovery. */ }
      storage.removeItem(SESSION_KEY); return { session: null, damaged: !legacy };
    }
    return { session, damaged: false };
  } catch { return { session: null, damaged: false }; }
}
export function saveSession(storage: StorageLike, session: Session): boolean {
  try { storage.setItem(SESSION_KEY, JSON.stringify(session)); return true; } catch { return false; }
}
export function loadSettings(storage: StorageLike): Settings {
  try {
    const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings;
    return (s.mode === "standard" || s.mode === "practice") && typeof s.sound === "boolean" ? s : defaultSettings;
  } catch { return defaultSettings; }
}
export function loadRecords(storage: StorageLike): Records {
  try {
    const r = JSON.parse(storage.getItem(RECORDS_KEY) ?? "null") as Records;
    if (r.version !== 1 || ![RULES_VERSION, "1.0.0"].includes(r.rulesVersion) || ![r.standard, r.practice].every((v) => v && Number.isSafeInteger(v.score) && v.score >= 0 && Number.isFinite(v.elapsed) && v.elapsed >= 0 && v.elapsed <= 31536000)) return emptyRecords();
    return { ...r, rulesVersion: RULES_VERSION };
  } catch { return emptyRecords(); }
}
export function recordResult(records: Records, run: Run): Records {
  if (run.status !== "ended" || run.score <= records[run.mode].score) return records;
  return { ...records, [run.mode]: { score: run.score, elapsed: run.elapsed } };
}
export function saveValue(storage: StorageLike, key: typeof SETTINGS_KEY | typeof RECORDS_KEY, value: Settings | Records): boolean {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
