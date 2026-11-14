import { clearTurns, createRun, isPreset, RULES_VERSION, tickMs, validRun, type Preset, type Run } from "./engine.ts";
export const SESSION_KEY = "vihar-games:silk-trail:session:v1";
export const SETTINGS_KEY = "vihar-games:silk-trail:settings:v1";
export const RECORDS_KEY = "vihar-games:silk-trail:records:v1";
export type Session = { version: 1; rulesVersion: string; id: string; run: Run; remainder: number };
export type Settings = { preset: Preset; sound: boolean; music: boolean; large: boolean };
export type Records = { version: 1; rulesVersion: string; calm: number; flow: number; swift: number };
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const defaultSettings: Settings = { preset: "flow", sound: true, music: true, large: false };
export const emptyRecords = (): Records => ({ version: 1, rulesVersion: RULES_VERSION, calm: 0, flow: 0, swift: 0 });
export const newSession = (preset: Preset, seed: number, id: string): Session => ({ version: 1, rulesVersion: RULES_VERSION, id, run: createRun(preset, seed), remainder: 0 });
export function parseSession(raw: string | null): Session | null {
  if (!raw || raw.length > 22000) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (!s || s.version !== 1 || s.rulesVersion !== RULES_VERSION || typeof s.id !== "string" || !s.id || s.id.length > 100 || !validRun(s.run) || !Number.isFinite(s.remainder) || s.remainder < 0 || s.remainder >= tickMs(s.run.preset) || s.run.status === "ended" && s.remainder !== 0) return null;
    return { ...s, run: clearTurns(s.run) };
  } catch { return null; }
}
export function loadSession(storage: StorageLike) {
  try { const raw = storage.getItem(SESSION_KEY), session = parseSession(raw);
    if (raw && !session) { storage.removeItem(SESSION_KEY); return { session: null, damaged: true, unavailable: false }; }
    return { session, damaged: false, unavailable: false };
  } catch { return { session: null, damaged: false, unavailable: true }; }
}
export function loadSettings(storage: StorageLike): Settings {
  try { const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Settings;
    return s && isPreset(s.preset) && typeof s.sound === "boolean" && typeof s.music === "boolean" && typeof s.large === "boolean" ? s : { ...defaultSettings };
  } catch { return { ...defaultSettings }; }
}
export function loadRecords(storage: StorageLike): Records {
  try { const r = JSON.parse(storage.getItem(RECORDS_KEY) ?? "null") as Records;
    return r && r.version === 1 && r.rulesVersion === RULES_VERSION && [r.calm, r.flow, r.swift].every((score) => Number.isInteger(score) && score >= 0 && score <= 397) ? r : emptyRecords();
  } catch { return emptyRecords(); }
}
export function recordResult(records: Records, run: Run): Records {
  return run.status === "ended" && run.score > records[run.preset] ? { ...records, [run.preset]: run.score } : records;
}
export function saveSession(storage: StorageLike, session: Session): boolean {
  return saveValue(storage, SESSION_KEY, { ...session, run: clearTurns(session.run) });
}
export function saveValue(storage: StorageLike, key: string, value: unknown): boolean {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
