import { getPuzzle, isComplete, pause, presets, RULES_VERSION, type Mark, type Preset, type Run, type Transaction } from "./engine.ts";
export const SESSION_KEY = "vihar-games:lantern-logic:session:v1";
export const SETTINGS_KEY = "vihar-games:lantern-logic:settings:v1";
export const RECORDS_KEY = "vihar-games:lantern-logic:records:v1";
export type Settings = { version: 1; preset: Preset; sound: boolean; music: boolean; showTime: boolean };
export const defaultSettings: Settings = { version: 1, preset: "workshop", sound: true, music: true, showTime: false };
export type RecordEntry = { attemptId: string; puzzleId: string; puzzleVersion: number; rulesVersion: string; preset: Preset; elapsed: number; hints: number; assisted: boolean; date: string };
export type Records = { version: 1; entries: RecordEntry[] };
export const emptyRecords = (): Records => ({ version: 1, entries: [] });
const mark = (m: unknown): m is Mark => m === 0 || m === 1 || m === 2;
const counter = (n: unknown, max: number) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
const identifier = (s: unknown): s is string => typeof s === "string" && s.length > 0 && s.length <= 100;
function history(value: unknown, size: number): value is Transaction[] {
  return Array.isArray(value) && value.length <= 1000 && value.every((t) => Array.isArray(t) && t.length > 0 && t.length <= size && new Set(t.map((c) => c?.index)).size === t.length && t.every((c) => c && Number.isInteger(c.index) && c.index >= 0 && c.index < size && mark(c.before) && mark(c.after) && c.before !== c.after));
}
export function validateRun(value: unknown): Run | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Run, p = getPuzzle(r.puzzleId);
  if (!p || r.version !== 1 || r.rulesVersion !== RULES_VERSION || r.puzzleVersion !== p.version || r.preset !== p.preset || !identifier(r.attemptId) || !Array.isArray(r.cells) || r.cells.length !== p.size ** 2 || !r.cells.every(mark) || !history(r.undo, r.cells.length) || !history(r.redo, r.cells.length) || !counter(r.hints, 1000000) || !Number.isInteger(r.hints) || typeof r.assisted !== "boolean" || r.hints > 0 && !r.assisted || !counter(r.elapsed, 31536000) || !["active", "paused", "completed"].includes(r.status)) return null;
  // Check every reversible transaction against the current snapshot, in each
  // direction. Corrupt history cannot silently change unrelated cell states.
  const backwards = [...r.cells], forwards = [...r.cells];
  for (const t of [...r.undo].reverse()) for (const c of t) { if (backwards[c.index] !== c.after) return null; backwards[c.index] = c.before; }
  for (const t of [...r.redo].reverse()) for (const c of t) { if (forwards[c.index] !== c.before) return null; forwards[c.index] = c.after; }
  if ((r.status === "completed") !== isComplete(r)) return null;
  // Allowlist fields. Stored clues/answers, if injected, are never trusted.
  return pause({ version: 1, rulesVersion: RULES_VERSION, puzzleId: p.id, puzzleVersion: p.version, preset: p.preset, attemptId: r.attemptId, cells: [...r.cells], undo: r.undo, redo: r.redo, elapsed: r.elapsed, hints: r.hints, assisted: r.assisted, status: r.status });
}
export function loadRun(storage: Pick<Storage, "getItem">): { run: Run | null; damaged: boolean } {
  try { const raw = storage.getItem(SESSION_KEY); if (!raw) return { run: null, damaged: false }; const run = validateRun(JSON.parse(raw)); return { run, damaged: !run }; }
  catch { return { run: null, damaged: true }; }
}
export function loadSettings(storage: Pick<Storage, "getItem">): Settings {
  try { const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null"); return { version: 1, preset: presets.includes(s?.preset) ? s.preset : "workshop", sound: typeof s?.sound === "boolean" ? s.sound : true, music: typeof s?.music === "boolean" ? s.music : true, showTime: typeof s?.showTime === "boolean" ? s.showTime : false }; }
  catch { return { ...defaultSettings }; }
}
export function loadRecords(storage: Pick<Storage, "getItem">): Records {
  try { const saved = JSON.parse(storage.getItem(RECORDS_KEY) ?? "null"); if (saved?.version !== 1 || !Array.isArray(saved.entries) || saved.entries.length > 200) return emptyRecords();
    return { version: 1, entries: saved.entries.filter((e: RecordEntry) => { const p = getPuzzle(e?.puzzleId); return p && p.preset === e.preset && p.version === e.puzzleVersion && e.rulesVersion === RULES_VERSION && identifier(e.attemptId) && counter(e.elapsed, 31536000) && counter(e.hints, 1000000) && Number.isInteger(e.hints) && typeof e.assisted === "boolean" && (!e.hints || e.assisted) && typeof e.date === "string" && Number.isFinite(Date.parse(e.date)); }) };
  } catch { return emptyRecords(); }
}
export function recordResult(records: Records, run: Run, date: string): Records {
  if (run.status !== "completed" || !isComplete(run) || records.entries.some((e) => e.attemptId === run.attemptId)) return records;
  const { attemptId, puzzleId, puzzleVersion, rulesVersion, preset, elapsed, hints, assisted } = run;
  return { version: 1, entries: [{ attemptId, puzzleId, puzzleVersion, rulesVersion, preset, elapsed, hints, assisted, date }, ...records.entries].slice(0, 200) };
}
export function saveValue(storage: Pick<Storage, "setItem">, key: string, value: unknown): boolean { try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
