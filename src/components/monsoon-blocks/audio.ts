// Original local audio: printed-glass taps, a clear chord, and "Cloudlight",
// a quiet 32-beat melody. Audio schedules independently of the game simulation.
const melody = [349.23, 440, 523.25, 440, 392, 349.23, 329.63, 261.63,
  293.66, 349.23, 440, 392, 349.23, 329.63, 293.66, 261.63,
  349.23, 392, 440, 523.25, 587.33, 523.25, 440, 392,
  329.63, 392, 523.25, 440, 349.23, 329.63, 293.66, 349.23];
const harmony = [[174.61, 220, 261.63], [146.83, 174.61, 220],
  [130.81, 164.81, 196], [116.54, 146.83, 174.61],
  [174.61, 220, 261.63], [146.83, 174.61, 220],
  [130.81, 164.81, 196], [174.61, 220, 261.63]];

export function createAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null, sound = false, music = false, playing = false, disposed = false;
  let timer: ReturnType<typeof setInterval> | null = null, beat = 0, nextBeat = 0;
  const effects = new Set<OscillatorNode>(), notes = new Set<OscillatorNode>();
  const stopSources = (sources: Set<OscillatorNode>) => { for (const source of sources) { try { source.stop(); } catch { /* Already ended. */ } } sources.clear(); };
  const getContext = () => {
    if (disposed || !sound && !music) return null;
    try { context ??= new AudioContext(); return context; } catch { onUnavailable(); return null; }
  };
  const unlock = () => { const ctx = getContext(); if (ctx) void ctx.resume().catch(onUnavailable); };
  const tone = (ctx: AudioContext, frequency: number, duration: number, start: number, volume: number, sources: Set<OscillatorNode>, type: OscillatorType = "sine") => {
    const source = ctx.createOscillator(), gain = ctx.createGain();
    source.type = type; source.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start); gain.gain.linearRampToValueAtTime(volume, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(gain).connect(ctx.destination); sources.add(source);
    source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(start); source.stop(start + duration + .01);
  };
  const stopMusic = () => { if (timer !== null) clearInterval(timer); timer = null; stopSources(notes); };
  const startMusic = () => {
    if (!music || !playing || disposed || timer !== null) return;
    const ctx = getContext(); if (!ctx) return;
    unlock(); nextBeat = ctx.currentTime + .06;
    const schedule = () => {
      if (!playing || !music || disposed) return;
      if (nextBeat < ctx.currentTime - .18) nextBeat = ctx.currentTime + .04;
      // Pause cancels every source and the short 180 ms scheduling queue.
      while (nextBeat < ctx.currentTime + .18) {
        const index = beat % melody.length;
        tone(ctx, melody[index], .72, nextBeat, .015, notes);
        if (index % 4 === 0) for (const frequency of harmony[Math.floor(index / 4)]) tone(ctx, frequency, 2.9, nextBeat, .006, notes, "triangle");
        nextBeat += .9; beat++;
      }
    };
    schedule(); timer = setInterval(schedule, 80);
  };
  const effect = (frequency: number, duration: number, delay = 0) => {
    if (!sound || disposed) return;
    const ctx = getContext(); if (!ctx) return;
    unlock(); tone(ctx, frequency, duration, ctx.currentTime + delay, .04, effects);
  };
  return {
    enable(value: boolean) { sound = value; if (!value) stopSources(effects); },
    enableMusic(value: boolean) { music = value; if (value) startMusic(); else stopMusic(); },
    unlock,
    start() { playing = true; startMusic(); },
    placement() { effect(540, .09); effect(1080, .05, .008); },
    clear() { effect(392, .23); effect(523.25, .25, .025); effect(659.25, .28, .05); },
    stop() { playing = false; stopMusic(); stopSources(effects); },
    reset() { beat = 0; },
    dispose() { disposed = true; playing = false; stopMusic(); stopSources(effects); void context?.close().catch(() => {}); context = null; },
  };
}
