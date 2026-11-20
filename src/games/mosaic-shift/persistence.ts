import { newRun, puzzleById, slide, solved, type Run } from "./engine.ts";
export const SESSION_KEY = "vihar-games:mosaic-shift:session:v1";
export const SETTINGS_KEY = "vihar-games:mosaic-shift:settings:v1";
export const RECORDS_KEY = "vihar-games:mosaic-shift:records:v1";
export type RecordEntry = { puzzleId: string; version: string; size: number; moves: number; elapsedMs: number; hints: number; assisted: boolean };
export type Records = Record<string, RecordEntry>;
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000;
const time = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 31_536_000_000;
export function validateRun(value: unknown): Run | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Run, puzzle = puzzleById(r.puzzleId);
  if (!puzzle || r.version !== puzzle.version || r.size !== puzzle.size || !Array.isArray(r.tiles) || r.tiles.length !== r.size * r.size || new Set(r.tiles).size !== r.tiles.length || r.tiles.some(t => !Number.isInteger(t) || t < 0 || t >= r.tiles.length) || r.tiles.indexOf(0) !== r.empty) return null;
  if (!count(r.moves) || !count(r.hints) || !time(r.elapsedMs) || typeof r.assisted !== "boolean" || r.assisted !== (r.hints > 0) || !Array.isArray(r.history) || r.history.length > 1_000_000 || !count(r.cursor) || r.cursor > r.history.length || r.moves < r.history.length) return null;
  let tiles = newRun(puzzle).tiles; let current = r.cursor === 0 ? tiles : null;
  for (let i = 0; i < r.history.length; i++) {
    if (solved(tiles)) return null;
    const next = slide(tiles, r.history[i], r.size); if (!next) return null;
    tiles = next; if (i + 1 === r.cursor) current = tiles;
  }
  if (!current || current.some((tile, i) => tile !== r.tiles[i])) return null;
  return { ...r, tiles: [...r.tiles], history: [...r.history] };
}
export function loadSession(raw: string | null): Run | null {
  try { const save = JSON.parse(raw ?? "null"); return save?.schema === 1 ? validateRun(save.run) : null; } catch { return null; }
}
export function saveSession(run: Run): string { return JSON.stringify({ schema: 1, run }); }
export const recordKey = (r: Pick<Run, "puzzleId" | "version" | "assisted">) => `${r.puzzleId}:${r.version}:${r.assisted ? "assisted" : "unassisted"}`;
export function loadRecords(raw: string | null): Records {
  try {
    const value = JSON.parse(raw ?? "{}"); if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const valid: Records = {};
    for (const [key, r] of Object.entries(value) as [string, RecordEntry][]) {
      const p = r && puzzleById(r.puzzleId);
      if (p && r.version === p.version && r.size === p.size && count(r.moves) && count(r.hints) && time(r.elapsedMs) && typeof r.assisted === "boolean" && r.assisted === (r.hints > 0) && key === recordKey(r)) valid[key] = r;
    }
    return valid;
  } catch { return {}; }
}
export function addRecord(records: Records, run: Run): Records {
  if (!solved(run.tiles)) return records;
  const key = recordKey(run), old = records[key];
  if (old && (old.moves < run.moves || old.moves === run.moves && old.elapsedMs <= run.elapsedMs)) return records;
  const { puzzleId, version, size, moves, elapsedMs, hints, assisted } = run;
  return { ...records, [key]: { puzzleId, version, size, moves, elapsedMs, hints, assisted } };
}
