// Original airmail waltz and paper sounds. Audio never drives the flight clock.
const BEAT = 60 / 96;
const chords = [[48, 52, 55], [45, 48, 52], [53, 57, 60], [43, 47, 50], [50, 53, 57], [45, 48, 52], [53, 57, 60], [43, 47, 55]];
const melody = [[72, 0, 76, 79, 76, 74], [72, 69, 0, 72, 76, 0], [77, 0, 76, 72, 69, 0], [74, 71, 67, 0, 71, 74], [77, 74, 0, 69, 72, 74], [76, 0, 72, 69, 0, 72], [77, 76, 72, 0, 69, 72], [74, 0, 71, 67, 0, 71]];
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

async function renderMusic(sampleRate: number): Promise<AudioBuffer> {
  const duration = chords.length * 3 * BEAT;
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const tone = (note: number, at: number, length: number, volume: number, pan: number, pad = false) => {
    const source = ctx.createOscillator(), gain = ctx.createGain(), panner = ctx.createStereoPanner();
    source.type = "sine"; source.frequency.value = frequency(note); panner.pan.value = pan;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + (pad ? .16 : .012));
    gain.gain.exponentialRampToValueAtTime(.0001, at + length - .012);
    gain.gain.linearRampToValueAtTime(0, at + length);
    source.connect(gain).connect(panner).connect(ctx.destination);
    source.start(at); source.stop(at + length);
  };
  chords.forEach((chord, bar) => {
    const at = bar * 3 * BEAT;
    chord.forEach((note, i) => tone(note, at, 3 * BEAT - .015, .013, (i - 1) * .4, true));
    tone(chord[0] - 12, at, BEAT * 1.6, .028, 0);
    tone(chord[0] - 12, at + 2 * BEAT, BEAT * .8, .017, 0);
    melody[bar].forEach((note, eighth) => {
      const start = at + eighth * BEAT / 2;
      if (note) tone(note, start, Math.min(.45, duration - start - .015), .048, eighth % 2 ? .2 : -.2);
    });
  });
  return ctx.startRendering();
}

export function createAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null;
  const sources = new Map<AudioScheduledSourceNode, AudioNode[]>();
  let enabled = false, disposed = false, unlocked = false, reported = false, playing = false;
  let music: AudioBufferSourceNode | null = null, musicOffset = 0, musicStarted = 0;
  let musicBuffer: Promise<AudioBuffer> | null = null;
  const unavailable = () => { if (!disposed && !reported) { reported = true; onUnavailable(); } };
  const release = (source: AudioScheduledSourceNode) => {
    const nodes = sources.get(source); if (!nodes) return;
    sources.delete(source); source.disconnect(); nodes.forEach((node) => node.disconnect());
  };
  const stopSource = (source: AudioScheduledSourceNode) => {
    try { source.stop(); } catch { /* Already ended. */ }
    release(source);
  };
  const track = (source: AudioScheduledSourceNode, nodes: AudioNode[]) => {
    sources.set(source, nodes); source.onended = () => release(source);
  };
  const stopMusic = () => {
    if (!music || !context) return;
    musicOffset = (musicOffset + context.currentTime - musicStarted) % music.buffer!.duration;
    stopSource(music); music = null;
  };
  const silence = () => { stopMusic(); for (const source of sources.keys()) stopSource(source); };
  const getContext = () => enabled && unlocked && !disposed && context?.state !== "closed" ? context : null;
  const startMusic = () => {
    const ctx = getContext();
    if (!ctx || !playing || music || ctx.state !== "running") return;
    musicBuffer ??= renderMusic(ctx.sampleRate);
    void musicBuffer.then((buffer) => {
      if (disposed || !enabled || !playing || music || context !== ctx || ctx.state !== "running") return;
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = buffer; source.loop = true; gain.gain.value = .65;
      source.connect(gain).connect(ctx.destination); track(source, [gain]);
      music = source; musicStarted = ctx.currentTime; source.start(0, musicOffset);
    }).catch(unavailable);
  };
  const unlock = () => {
    if (!enabled || disposed) return;
    try {
      context ??= new AudioContext(); unlocked = true;
      if (context.state === "running") startMusic();
      else void context.resume().then(startMusic).catch(unavailable);
    } catch { unavailable(); }
  };
  const chime = (notes: number[], volume: number, duration: number) => {
    const ctx = getContext(); if (!ctx) return;
    notes.forEach((note, i) => {
      const at = ctx.currentTime + i * .075, source = ctx.createOscillator(), gain = ctx.createGain();
      source.type = "sine"; source.frequency.value = frequency(note);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration - .012); gain.gain.linearRampToValueAtTime(0, at + duration);
      source.connect(gain).connect(ctx.destination); track(source, [gain]);
      source.start(at); source.stop(at + duration);
    });
  };
  return {
    enable(value: boolean) { enabled = value; if (!value) silence(); else startMusic(); },
    unlock,
    setPlaying(value: boolean) { playing = value; if (value) startMusic(); else stopMusic(); },
    reset() { playing = false; silence(); musicOffset = 0; },
    flap() {
      const ctx = getContext(); if (!ctx) return;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .065), ctx.sampleRate), values = buffer.getChannelData(0);
      for (let i = 0; i < values.length; i++) values[i] = (Math.random() * 2 - 1) * (1 - i / values.length);
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; filter.type = "bandpass"; filter.frequency.value = 1800; gain.gain.value = .085;
      source.connect(filter).connect(gain).connect(ctx.destination); track(source, [filter, gain]);
      source.start(); source.stop(ctx.currentTime + .065);
    },
    gate() { chime([76, 79], .055, .22); },
    land() { chime([69, 64, 60], .042, .3); },
    stop() { playing = false; silence(); },
    dispose() { disposed = true; playing = false; silence(); void context?.close().catch(() => {}); context = null; musicBuffer = null; },
  };
}
