import { test } from "node:test";
import assert from "node:assert/strict";
import { audioSettingsKey, createGameAudio, loadAudioPreferences, type AudioGame } from "./game-audio.ts";
import { loadAudioSettings as loadSudokuAudio } from "../games/sudoku/persistence.ts";
import { loadSettings as loadPaperwing, SETTINGS_KEY as PAPERWING_KEY } from "../games/paperwing/persistence.ts";
import { loadSettings as loadDuneDash, SETTINGS_KEY as DUNE_KEY } from "../games/dune-dash/persistence.ts";
import { loadSettings as loadMonsoon, SETTINGS_KEY as MONSOON_KEY } from "../games/monsoon-blocks/persistence.ts";

function environment(state = "running") {
  const originals = { AudioContext: globalThis.AudioContext, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  const contexts: Context[] = [], timers = new Map<number, () => void>();
  let timerId = 0;
  class Source {
    frequency = { setValueAtTime() {} }; type = "sine"; onended: (() => void) | null = null;
    active = false; disconnected = false; startAt = 0;
    connect(target: unknown) { return target; }
    disconnect() { this.disconnected = true; }
    start(time: number) { this.active = true; this.startAt = time; }
    stop(time?: number) { if (time === undefined) { this.active = false; this.onended?.(); } }
  }
  class Context {
    currentTime = 0; destination = {}; state = state; sources: Source[] = [];
    constructor() { contexts.push(this); }
    async resume() { this.state = "running"; }
    async close() { this.state = "closed"; }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
  globalThis.setInterval = ((callback: () => void) => { const id = ++timerId; timers.set(id, callback); return id; }) as unknown as typeof setInterval;
  globalThis.clearInterval = ((id: number) => { timers.delete(id); }) as unknown as typeof clearInterval;
  return { contexts, timers, restore() { Object.assign(globalThis, originals); } };
}
const games: AudioGame[] = ["chess", "carrom", "tic-tac-toe"];
for (const game of games) test(`${game}: saved audio waits for a gesture; pause and disposal release sources and timers`, () => {
  const env = environment(), player = createGameAudio(game, () => assert.fail("Audio should be available"));
  try {
    player.setPlaying(true); player.cue("move"); assert.equal(env.contexts.length, 0);
    player.enable(true); player.enableMusic(true); assert.equal(env.contexts.length, 0);
    player.unlock(); player.cue("move");
    const ctx = env.contexts[0]; assert.equal(env.timers.size, 1); assert.ok(ctx.sources.some((source) => source.active));
    player.stop(); assert.equal(env.timers.size, 0); assert.ok(ctx.sources.every((source) => !source.active && source.disconnected));
    player.setPlaying(true); player.setPlaying(true); assert.equal(env.timers.size, 1);
    player.dispose(); assert.equal(env.timers.size, 0); assert.equal(ctx.state, "closed");
    const count = ctx.sources.length; player.unlock(); player.setPlaying(true); player.cue("complete"); assert.equal(ctx.sources.length, count);
  } finally { player.dispose(); env.restore(); }
});
test("effects and music mute independently, and completion can sound after music ends", () => {
  const env = environment(), player = createGameAudio("chess", () => assert.fail("Audio should be available"));
  try {
    player.enable(true); player.enableMusic(true); player.setPlaying(true); player.unlock();
    const ctx = env.contexts[0], notes = [...ctx.sources]; player.cue("move"); const effect = ctx.sources.at(-1)!;
    player.enable(false); assert.equal(effect.active, false); assert.ok(notes.every((source) => source.active));
    player.enable(true); player.cue("move"); const nextEffect = ctx.sources.at(-1)!;
    player.enableMusic(false); assert.equal(env.timers.size, 0); assert.ok(notes.every((source) => !source.active)); assert.equal(nextEffect.active, true);
    player.setPlaying(false); player.cue("complete"); assert.ok(ctx.sources.slice(-4).every((source) => source.active));
  } finally { player.dispose(); env.restore(); }
});
test("a suspended context starts after resume but cannot restart after pause or disposal", async () => {
  const env = environment("suspended"), player = createGameAudio("carrom", () => assert.fail("Audio should be available"));
  try {
    player.enableMusic(true); player.setPlaying(true); player.unlock(); assert.equal(env.timers.size, 0);
    player.stop(); await Promise.resolve(); assert.equal(env.timers.size, 0);
    env.contexts[0].state = "suspended"; player.setPlaying(true); player.unlock(); player.dispose();
    await Promise.resolve(); assert.equal(env.timers.size, 0); assert.ok(env.contexts[0].sources.every((source) => !source.active));
  } finally { player.dispose(); env.restore(); }
});
test("a delayed audio clock schedules a bounded next beat; a rest still resumes its transport", () => {
  const env = environment(), player = createGameAudio("chess", () => assert.fail("Audio should be available"));
  try {
    player.enableMusic(true); player.setPlaying(true); player.unlock(); const ctx = env.contexts[0];
    ctx.currentTime = 30; const count = ctx.sources.length; for (const tick of env.timers.values()) tick();
    assert.ok(ctx.sources.length - count <= 3); assert.ok(ctx.sources.slice(count).every((source) => source.startAt > 30));
    // Beat 3 is a rest. Pausing here must still allow later notes to play.
    ctx.currentTime += 1; for (const tick of env.timers.values()) tick(); player.stop(); player.setPlaying(true);
    assert.equal(env.timers.size, 1);
    ctx.currentTime += 1; for (const tick of env.timers.values()) tick(); assert.ok(ctx.sources.some((source) => source.active));
  } finally { player.dispose(); env.restore(); }
});
test("device failures report once, without timers or uncaught errors", () => {
  const env = environment(); let reports = 0;
  globalThis.AudioContext = class { constructor() { throw Error("Unavailable"); } } as unknown as typeof AudioContext;
  const player = createGameAudio("tic-tac-toe", () => { reports++; });
  try { player.enable(true); player.enableMusic(true); player.setPlaying(true); player.unlock(); player.unlock(); player.cue("move"); assert.equal(reports, 1); assert.equal(env.timers.size, 0); }
  finally { player.dispose(); env.restore(); }
});
test("audio defaults on per game, preserves saved mutes, and recovers malformed or blocked storage", () => {
  const data = new Map([[audioSettingsKey("chess"), JSON.stringify({ sound: true, music: false })]]), storage = { getItem: (key: string) => data.get(key) ?? null };
  assert.deepEqual(loadAudioPreferences(storage, "chess"), { sound: true, music: false });
  assert.deepEqual(loadAudioPreferences(storage, "carrom"), { sound: true, music: true });
  assert.deepEqual(loadAudioPreferences({ getItem: () => '{"sound":false,"music":false}' }, "chess"), { sound: false, music: false });
  for (const raw of ["bad", "null", '{"sound":"true","music":1}']) assert.deepEqual(loadAudioPreferences({ getItem: () => raw }, "chess"), { sound: true, music: true });
  assert.deepEqual(loadAudioPreferences({ getItem() { throw Error("Blocked"); } }, "chess"), { sound: true, music: true });
});
test("all seven playable games default to audio on, including storage recovery, while saved off choices survive", () => {
  const data = new Map<string, string>(), storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  const blocked = { ...storage, getItem() { throw Error("Blocked"); } };
  for (const source of [storage, blocked]) {
    for (const game of games) assert.deepEqual(loadAudioPreferences(source, game), { sound: true, music: true });
    for (const settings of [loadSudokuAudio(source), loadDuneDash(source), loadMonsoon(source)]) { assert.equal(settings.sound, true); assert.equal(settings.music, true); }
    assert.equal(loadPaperwing(source).sound, true);
  }
  data.set(PAPERWING_KEY, JSON.stringify({ mode: "practice", sound: false }));
  data.set(DUNE_KEY, JSON.stringify({ version: 1, mode: "practice", sound: false, music: false }));
  data.set(MONSOON_KEY, JSON.stringify({ preset: "practice", sound: false, music: false }));
  assert.equal(loadPaperwing(storage).sound, false);
  for (const settings of [loadDuneDash(storage), loadMonsoon(storage)]) { assert.equal(settings.sound, false); assert.equal(settings.music, false); }
});
