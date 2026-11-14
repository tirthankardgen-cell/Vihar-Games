import { puzzleBank } from "./bank.ts";
import { RULES_VERSION, isComplete, pause, type Run, type Cell, type Edit, type Difficulty } from "./engine.ts";
export const SESSION_KEY = "vihar-games:sudoku:session:v1";
export const SETTINGS_KEY = "vihar-games:sudoku:settings:v1";
export type AudioSettings = { sound: boolean; music: boolean; volume: number };
export const AUDIO_KEY = "vihar-games:sudoku:audio:v1";
export const defaultAudioSettings: AudioSettings = { sound: true, music: true, volume: .4 };
export function loadAudioSettings(storage: Pick<Storage, "getItem">): AudioSettings {
  try {
    const value = JSON.parse(storage.getItem(AUDIO_KEY) ?? "null");
    return value?.version === 1 && typeof value.sound === "boolean" && typeof value.music === "boolean" && Number.isFinite(value.volume) && value.volume >= 0 && value.volume <= 1 ? { sound: value.sound, music: value.music, volume: value.volume } : defaultAudioSettings;
  } catch { return defaultAudioSettings; }
}
export const RECORDS_KEY = "vihar-games:sudoku:records:v1";
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type RecordEntry = { attemptId: string; puzzleId: string; difficulty: Difficulty; elapsed: number; hints: number; checks: number; restarted: boolean; date: string };
export type Records = { version: 1; rulesVersion: string; entries: RecordEntry[] };
export const emptyRecords = (): Records => ({ version: 1, rulesVersion: RULES_VERSION, entries: [] });
const count = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 1000000;
const time = (n: number) => Number.isFinite(n) && n >= 0 && n <= 315360000;
const validId = (s: string) => typeof s === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(s);
const validCell = (c: Cell) => !!c && Number.isInteger(c.value) && c.value >= 0 && c.value <= 9 && Number.isInteger(c.notes) && c.notes >= 0 && c.notes <= 511 && typeof c.hinted === "boolean" && !(c.value && c.notes) && (!c.hinted || c.value > 0);
const sameCell = (a: Cell, b: Cell) => a.value === b.value && a.notes === b.notes && a.hinted === b.hinted;
export function parseRun(raw: string | null): Run | null {
  if (!raw || raw.length > 2000000) return null;
  try {
    const r = JSON.parse(raw) as Run, p = puzzleBank.find((p) => p.id === r.puzzle?.id);
    if (!p || r.version !== 1 || r.rulesVersion !== RULES_VERSION || !validId(r.attemptId) || r.puzzle.clues !== p.clues || r.puzzle.solution !== p.solution || r.puzzle.difficulty !== p.difficulty || !Array.isArray(r.cells) || r.cells.length !== 81 || !r.cells.every(validCell) || !time(r.elapsed) || !count(r.hints) || !count(r.checks) || typeof r.restarted !== "boolean" || !["active", "paused", "completed"].includes(r.status)) return null;
    const validAt = (c: Cell, i: number) => validCell(c) && (p.clues[i] === "0" || c.value === 0 && c.notes === 0 && !c.hinted) && (!c.hinted || c.value === Number(p.solution[i]));
    if (!r.cells.every(validAt)) return null;
    const validEdit = (e: Edit) => e && Number.isInteger(e.index) && e.index >= 0 && e.index < 81 && p.clues[e.index] === "0" && validAt(e.before, e.index) && validAt(e.after, e.index);
    if (![r.undo, r.redo].every((h) => Array.isArray(h) && h.length <= 5000 && h.every(validEdit)) || !Array.isArray(r.checked) || r.checked.length > 81 || new Set(r.checked).size !== r.checked.length || !r.checked.every((i) => Number.isInteger(i) && i >= 0 && i < 81 && r.cells[i].value && r.cells[i].value !== Number(p.solution[i])) || r.checked.length > 0 && !r.checks) return null;
    // Replay history to reject saves that could overwrite a clue or restore impossible state.
    const replay: Cell[] = Array.from({ length: 81 }, () => ({ value: 0, notes: 0, hinted: false }));
    for (const e of r.undo) { if (!sameCell(replay[e.index], e.before)) return null; replay[e.index] = e.after; }
    if (!r.cells.every((c, i) => sameCell(c, replay[i]))) return null;
    for (const e of [...r.redo].reverse()) { if (!sameCell(replay[e.index], e.before)) return null; replay[e.index] = e.after; }
    if ((r.status === "completed") !== isComplete(r) || r.cells.some((c) => c.hinted) && r.hints === 0) return null;
    return pause({ ...r, puzzle: p });
  } catch { return null; }
}
export function loadRun(storage: StorageLike): { run: Run | null; damaged: boolean } {
  const raw = storage.getItem(SESSION_KEY), run = parseRun(raw);
  return { run, damaged: !!raw && !run };
}
export function saveValue(storage: StorageLike, key: string, value: unknown): boolean {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function loadDifficulty(storage: StorageLike): Difficulty {
  try { const s = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null"); return s?.version === 1 && ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "easy"; } catch { return "easy"; }
}
export function loadRecords(storage: StorageLike): Records {
  try {
    const r = JSON.parse(storage.getItem(RECORDS_KEY) ?? "null") as Records;
    if (r.version !== 1 || r.rulesVersion !== RULES_VERSION || !Array.isArray(r.entries) || r.entries.length > 100 || !r.entries.every((e) => e && validId(e.attemptId) && puzzleBank.some((p) => p.id === e.puzzleId && p.difficulty === e.difficulty) && time(e.elapsed) && count(e.hints) && count(e.checks) && typeof e.restarted === "boolean" && typeof e.date === "string" && Number.isFinite(Date.parse(e.date))) || new Set(r.entries.map((e) => e.attemptId)).size !== r.entries.length) return emptyRecords();
    return r;
  } catch { return emptyRecords(); }
}
export function recordResult(records: Records, run: Run, date: string): Records {
  if (run.status !== "completed" || !isComplete(run) || records.entries.some((r) => r.attemptId === run.attemptId)) return records;
  const entry: RecordEntry = { attemptId: run.attemptId, puzzleId: run.puzzle.id, difficulty: run.puzzle.difficulty, elapsed: run.elapsed, hints: run.hints, checks: run.checks, restarted: run.restarted, date };
  return { ...records, entries: [entry, ...records.entries].slice(0, 100) };
}
