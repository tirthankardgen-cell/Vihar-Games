import test from "node:test";
import assert from "node:assert/strict";
import { createAudio } from "../../components/silk-trail/audio.ts";
function environment() {
  const original = { AudioContext: globalThis.AudioContext, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  const timers = new Map<number, () => void>(), contexts: Context[] = []; let id = 0;
  class Source {
    active = false; startAt = 0; frequency = { setValueAtTime() {} }; onended: (() => void) | null = null;
    connect(target: unknown) { return target; } disconnect() {}
    start(at = 0) { this.active = true; this.startAt = at; }
    stop(at?: number) { if (at === undefined) { this.active = false; this.onended?.(); } }
  }
  class Context {
    state = "running"; currentTime = 0; sampleRate = 1000; destination = {}; sources: Source[] = [];
    constructor() { contexts.push(this); } resume() { return Promise.resolve(); } close() { this.state = "closed"; return Promise.resolve(); }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    createBufferSource() { return this.createOscillator(); }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
    createBiquadFilter() { return { frequency: { value: 0 }, connect: (target: unknown) => target, disconnect() {} }; }
    createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
  globalThis.setInterval = ((callback: () => void) => { timers.set(++id, callback); return id; }) as unknown as typeof setInterval;
  globalThis.clearInterval = ((key: number) => { timers.delete(key); }) as unknown as typeof clearInterval;
  return { contexts, timers, restore: () => Object.assign(globalThis, original) };
}
test("enabled music waits for play; pause/dispose release sources and timers", () => {
  const env = environment(), audio = createAudio(() => assert.fail("unexpected audio failure"));
  try {
    audio.enableMusic(true); assert.equal(env.contexts.length, 0); audio.unlock(); audio.start(); audio.leaf(); audio.end();
    const c = env.contexts[0]; assert.ok(c.sources.length >= 4); assert.equal(env.timers.size, 1);
    audio.stop(); assert.equal(env.timers.size, 0); assert.ok(c.sources.every((s) => !s.active));
    audio.start(); audio.start(); assert.equal(env.timers.size, 1); audio.dispose(); assert.equal(c.state, "closed"); assert.equal(env.timers.size, 0);
    const count = c.sources.length; audio.start(); audio.leaf(); audio.end(); audio.unlock(); assert.equal(c.sources.length, count);
  } finally { audio.dispose(); env.restore(); }
});
test("independent mute switches stop only their own sources", () => {
  const env = environment(), audio = createAudio(() => assert.fail("unexpected audio failure"));
  try {
    audio.unlock(); audio.start(); const c = env.contexts[0], music = [...c.sources]; audio.leaf(); const effect = c.sources.at(-1)!;
    audio.enableMusic(false); assert.equal(env.timers.size, 0); assert.ok(music.every((s) => !s.active)); assert.ok(effect.active);
    audio.enableMusic(true); const newMusic = c.sources.slice(music.length + 1); audio.enable(false); assert.equal(effect.active, false); assert.ok(newMusic.every((s) => s.active));
    const count = c.sources.length; audio.leaf(); audio.end(); assert.equal(c.sources.length, count);
  } finally { audio.dispose(); env.restore(); }
});
test("delayed and suspended audio clocks do not replay missed beats or restart after pause", async () => {
  const env = environment(), audio = createAudio(() => assert.fail("unexpected audio failure"));
  try {
    audio.unlock(); audio.start(); const c = env.contexts[0], count = c.sources.length;
    c.currentTime = 100; for (const schedule of env.timers.values()) schedule(); assert.ok(c.sources.length - count <= 2);
    assert.ok(c.sources.slice(count).every((s) => s.startAt > 100)); c.state = "suspended";
    const pausedCount = c.sources.length; for (const schedule of env.timers.values()) schedule(); assert.equal(c.sources.length, pausedCount);
    audio.stop(); c.state = "running"; await Promise.resolve(); assert.equal(env.timers.size, 0); assert.ok(c.sources.every((s) => !s.active));
  } finally { audio.dispose(); env.restore(); }
});
test("unavailable device is recoverable and reports once", () => {
  const env = environment(); let failures = 0;
  globalThis.AudioContext = class { constructor() { throw new Error("No device"); } } as unknown as typeof AudioContext;
  const audio = createAudio(() => failures++);
  try { audio.unlock(); audio.start(); audio.leaf(); audio.end(); assert.equal(failures, 1); assert.equal(env.timers.size, 0); }
  finally { audio.dispose(); env.restore(); }
});
