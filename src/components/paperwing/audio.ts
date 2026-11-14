// Short original sounds are synthesized locally. Audio never drives simulation.
export function createAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null;
  const sources = new Set<AudioScheduledSourceNode>();
  let enabled = false, disposed = false;
  const getContext = () => {
    if (!enabled || disposed) return null;
    try {
      context ??= new AudioContext();
      void context.resume().catch(onUnavailable);
      return context;
    } catch { onUnavailable(); return null; }
  };
  const track = (source: AudioScheduledSourceNode, duration: number, ctx: AudioContext) => {
    sources.add(source); source.onended = () => { sources.delete(source); source.disconnect(); };
    source.start(); source.stop(ctx.currentTime + duration);
  };
  return {
    enable(value: boolean) { enabled = value; },
    flap() {
      const ctx = getContext(); if (!ctx) return;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .055), ctx.sampleRate), values = buffer.getChannelData(0);
      for (let i = 0; i < values.length; i++) values[i] = (Math.random() * 2 - 1) * (1 - i / values.length);
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; filter.type = "bandpass"; filter.frequency.value = 1600; gain.gain.value = .065;
      source.connect(filter).connect(gain).connect(ctx.destination); track(source, .055, ctx);
    },
    gate() {
      const ctx = getContext(); if (!ctx) return;
      const source = ctx.createOscillator(), gain = ctx.createGain();
      source.type = "sine"; source.frequency.value = 740; gain.gain.setValueAtTime(.045, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
      source.connect(gain).connect(ctx.destination); track(source, .2, ctx);
    },
    stop() { for (const source of sources) { try { source.stop(); } catch { /* Already ended. */ } } sources.clear(); },
    dispose() { disposed = true; for (const source of sources) { try { source.stop(); } catch { /* Already ended. */ } } sources.clear(); void context?.close().catch(() => {}); context = null; },
  };
}
