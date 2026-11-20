import test from "node:test";
import assert from "node:assert/strict";
import { createAudio } from "../../components/lantern-logic/audio.ts";
function environment() {
  const original = { AudioContext: globalThis.AudioContext, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval }, timers = new Map<number, () => void>(), contexts: Context[] = []; let id = 0;
  class Source {
    active = false; startAt = 0; onended: (() => void) | null = null; frequency = { setValueAtTime() {} };
    connect(target: unknown) { return target; } disconnect() {}
    start(at = 0) { this.active = true; this.startAt = at; }
    stop(at?: number) { if (at === undefined) { this.active = false; this.onended?.(); } }
  }
  class Context {
    state = "running"; currentTime = 0; sampleRate = 1000; destination = {}; sources: Source[] = [];
    constructor() { contexts.push(this); } resume() { return Promise.resolve(); } close() { this.state = "closed"; return Promise.resolve(); }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; } createBufferSource() { return this.createOscillator(); }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
    createBiquadFilter() { return { frequency: { value: 0 }, connect: (target: unknown) => target, disconnect() {} }; }
    createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
  globalThis.setInterval = ((callback: () => void) => { timers.set(++id, callback); return id; }) as unknown as typeof setInterval;
  globalThis.clearInterval = ((key: number) => { timers.delete(key); }) as unknown as typeof clearInterval;
  return { contexts, timers, restore: () => Object.assign(globalThis, original) };
}
test("default music waits for interaction/play; pause and dispose release all sound", () => {
  const env = environment(), audio = createAudio(() => assert.fail("device failure"));
  try { audio.configure({ sound: true, music: true }); audio.setPlaying(true); assert.equal(env.contexts.length, 0); audio.unlock(); audio.pencil(); audio.bell();
    const c = env.contexts[0]; assert.ok(c.sources.length >= 5); assert.equal(env.timers.size, 1); audio.stop(); assert.equal(env.timers.size, 0); assert.ok(c.sources.every((s) => !s.active));
    audio.setPlaying(true); audio.setPlaying(true); assert.equal(env.timers.size, 1); audio.dispose(); assert.equal(c.state, "closed"); assert.equal(env.timers.size, 0); const count = c.sources.length; audio.unlock(); audio.pencil(); audio.bell(); audio.setPlaying(true); assert.equal(c.sources.length, count);
  } finally { audio.dispose(); env.restore(); }
});
test("sound and music have independent mute switches", () => {
  const env = environment(), audio = createAudio(() => assert.fail("device failure"));
  try { audio.unlock(); audio.setPlaying(true); const c = env.contexts[0], music = [...c.sources]; audio.pencil(); const pencil = c.sources.at(-1)!;
    audio.configure({ sound: true, music: false }); assert.ok(music.every((s) => !s.active)); assert.ok(pencil.active); assert.equal(env.timers.size, 0);
    audio.configure({ sound: false, music: true }); assert.equal(pencil.active, false); assert.equal(env.timers.size, 1); const count = c.sources.length; audio.pencil(); audio.bell(); assert.equal(c.sources.length, count);
  } finally { audio.dispose(); env.restore(); }
});
test("delayed clocks never replay missed notes; unavailable audio is recoverable", () => {
  const env = environment(); let failures = 0; const audio = createAudio(() => failures++);
  try { audio.unlock(); audio.setPlaying(true); const c = env.contexts[0], count = c.sources.length; c.currentTime = 100; for (const schedule of env.timers.values()) schedule(); assert.ok(c.sources.length - count <= 2); assert.ok(c.sources.slice(count).every((s) => s.startAt > 100));
    c.state = "suspended"; for (const schedule of env.timers.values()) schedule(); assert.equal(env.timers.size, 0);
    audio.dispose(); globalThis.AudioContext = class { constructor() { throw new Error("No device"); } } as unknown as typeof AudioContext;
    const unavailable = createAudio(() => failures++); unavailable.unlock(); unavailable.unlock(); assert.equal(failures, 1); unavailable.dispose();
  } finally { audio.dispose(); env.restore(); }
});
