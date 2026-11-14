import { test } from "node:test";
import assert from "node:assert/strict";
import { createAudio } from "../../components/monsoon-blocks/audio.ts";

// Observe Web Audio's public lifecycle without a device or real-time test sleeps.
function environment() {
  const originals = { AudioContext: globalThis.AudioContext, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  const contexts: FakeContext[] = [], timers = new Map<number, () => void>();
  let timerId = 0;
  class Source {
    frequency = { setValueAtTime() {} }; type = "sine"; onended: (() => void) | null = null;
    active = false; startAt = 0; stopped = false;
    connect(target: unknown) { return target; }
    disconnect() {}
    start(time: number) { this.active = true; this.startAt = time; }
    stop(time?: number) { if (time === undefined) { this.active = false; this.stopped = true; this.onended?.(); } }
  }
  class FakeContext {
    currentTime = 0; destination = {}; state = "running"; sources: Source[] = [];
    constructor() { contexts.push(this); }
    resume() { return Promise.resolve(); }
    close() { this.state = "closed"; return Promise.resolve(); }
    createOscillator() { const source = new Source(); this.sources.push(source); return source; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.AudioContext = FakeContext as unknown as typeof AudioContext;
  globalThis.setInterval = ((callback: () => void) => { const id = ++timerId; timers.set(id, callback); return id; }) as unknown as typeof setInterval;
  globalThis.clearInterval = ((id: number) => { timers.delete(id); }) as unknown as typeof clearInterval;
  return {
    contexts, timers,
    restore() { Object.assign(globalThis, originals); },
  };
}
test("sound and music start muted, and enabled music waits for active play", () => {
  const env = environment(), audio = createAudio(() => assert.fail("Audio should be available"));
  try {
    audio.start(); audio.placement(); audio.clear(); assert.equal(env.contexts.length, 0); assert.equal(env.timers.size, 0);
    audio.stop(); audio.enableMusic(true); assert.equal(env.contexts.length, 0);
    audio.unlock(); audio.start(); assert.equal(env.contexts.length, 1); assert.equal(env.timers.size, 1);
    assert.ok(env.contexts[0].sources.some((source) => source.active));
  } finally { audio.dispose(); env.restore(); }
});
test("pause cancels all music, effects, and timers; resume starts one transport", () => {
  const env = environment(), audio = createAudio(() => assert.fail("Audio should be available"));
  try {
    audio.enable(true); audio.enableMusic(true); audio.start(); audio.placement();
    const context = env.contexts[0]; assert.ok(context.sources.filter((source) => source.active).length > 4);
    audio.stop(); assert.equal(env.timers.size, 0); assert.ok(context.sources.every((source) => !source.active));
    audio.start(); audio.start(); assert.equal(env.timers.size, 1);
    audio.dispose(); assert.equal(context.state, "closed"); assert.equal(env.timers.size, 0);
    assert.ok(context.sources.every((source) => !source.active));
    const count = context.sources.length; audio.start(); audio.placement(); assert.equal(context.sources.length, count);
  } finally { audio.dispose(); env.restore(); }
});
test("the music switch leaves effects independent and the effects switch leaves music independent", () => {
  const env = environment(), audio = createAudio(() => assert.fail("Audio should be available"));
  try {
    audio.enable(true); audio.enableMusic(true); audio.start();
    const context = env.contexts[0], musicSources = [...context.sources];
    audio.placement(); const effects = context.sources.slice(musicSources.length);
    audio.enable(false); assert.ok(effects.every((source) => !source.active)); assert.ok(musicSources.every((source) => source.active));
    audio.enable(true); audio.placement(); const newEffects = context.sources.slice(-2);
    audio.enableMusic(false); assert.equal(env.timers.size, 0); assert.ok(musicSources.every((source) => !source.active));
    assert.ok(newEffects.every((source) => source.active));
  } finally { audio.dispose(); env.restore(); }
});
test("a stalled audio clock schedules a bounded next beat without a burst of missed notes", () => {
  const env = environment(), audio = createAudio(() => assert.fail("Audio should be available"));
  try {
    audio.enableMusic(true); audio.start(); const context = env.contexts[0], count = context.sources.length;
    context.currentTime = 20; for (const schedule of env.timers.values()) schedule();
    assert.ok(context.sources.length - count <= 4); assert.ok(context.sources.slice(count).every((source) => source.startAt > 20));
  } finally { audio.dispose(); env.restore(); }
});
test("unavailable audio reports recovery without starting a timer or affecting gameplay", () => {
  const env = environment(); let failures = 0;
  globalThis.AudioContext = class { constructor() { throw Error("No output"); } } as unknown as typeof AudioContext;
  const audio = createAudio(() => { failures++; });
  try { audio.enableMusic(true); audio.enable(true); audio.start(); audio.placement(); assert.ok(failures > 0); assert.equal(env.timers.size, 0); }
  finally { audio.dispose(); env.restore(); }
});
