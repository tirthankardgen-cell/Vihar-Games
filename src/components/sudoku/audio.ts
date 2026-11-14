// Original slow journal theme and small pencil/bell cues, synthesized locally.
// Audio has its own clock; it never changes the puzzle, timer or randomness.
import type { AudioSettings } from "@/games/sudoku/persistence";
export type Cue = "entry" | "note" | "erase" | "undo" | "redo" | "hint" | "check" | "conflict" | "start" | "resume" | "complete";
const beat = 60 / 72;
const chords = [[50, 57, 62], [47, 54, 59], [43, 50, 59], [45, 52, 61], [50, 57, 66], [43, 54, 59], [40, 55, 59], [45, 52, 61]];
const melody = [[74, 0, 78, 0, 81, 78, 0, 76], [74, 0, 71, 0, 78, 0, 74, 0], [71, 0, 74, 0, 79, 0, 78, 74], [76, 0, 73, 0, 69, 0, 73, 0], [74, 0, 78, 81, 0, 78, 76, 0], [74, 0, 71, 0, 78, 0, 74, 0], [76, 0, 79, 0, 78, 0, 74, 0], [73, 0, 76, 0, 69, 0, 0, 0]];
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);
async function renderMusic(sampleRate: number): Promise<AudioBuffer> {
  const duration = chords.length * 4 * beat;
  const offline = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const tone = (note: number, at: number, length: number, volume: number, pan: number, pad = false) => {
    const source = offline.createOscillator(), gain = offline.createGain(), stereo = offline.createStereoPanner();
    source.type = "sine"; source.frequency.value = frequency(note); stereo.pan.value = pan;
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + (pad ? .24 : .018));
    gain.gain.exponentialRampToValueAtTime(.0001, at + length - .02); gain.gain.linearRampToValueAtTime(0, at + length);
    source.connect(gain).connect(stereo).connect(offline.destination); source.start(at); source.stop(at + length);
  };
  chords.forEach((chord, bar) => {
    const at = bar * 4 * beat;
    chord.forEach((note, n) => tone(note, at, 4 * beat - .01, .014, (n - 1) * .35, true));
    tone(chord[0] - 12, at, 2.8 * beat, .028, 0, true);
    melody[bar].forEach((note, n) => { if (note) tone(note, at + n * beat / 2, Math.min(.8, duration - (at + n * beat / 2) - .01), .046, n % 2 ? .15 : -.15); });
  });
  return offline.startRendering();
}

export function createSudokuAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null, master: GainNode | null = null;
  let settings: AudioSettings = { sound: false, music: false, volume: .4 };
  let playing = false, disposed = false, reported = false, unlocked = false;
  let music: AudioBufferSourceNode | null = null, buffer: Promise<AudioBuffer> | null = null, offset = 0, started = 0;
  const sources = new Map<AudioScheduledSourceNode, AudioNode[]>();
  const unavailable = () => { if (!disposed && !reported) { reported = true; onUnavailable(); } };
  const release = (source: AudioScheduledSourceNode) => { const nodes = sources.get(source); if (!nodes) return; sources.delete(source); source.disconnect(); nodes.forEach((n) => n.disconnect()); };
  const track = (source: AudioScheduledSourceNode, nodes: AudioNode[]) => { sources.set(source, nodes); source.onended = () => release(source); };
  const stopSource = (source: AudioScheduledSourceNode) => { try { source.stop(); } catch { /* Source already ended. */ } release(source); };
  const stopMusic = () => {
    if (!music || !context) return;
    offset = (offset + context.currentTime - started) % music.buffer!.duration;
    stopSource(music); music = null;
  };
  const stopEffects = () => { for (const source of sources.keys()) if (source !== music) stopSource(source); };
  const visible = () => document.visibilityState === "visible" && document.hasFocus();
  const ready = () => !disposed && unlocked && context?.state === "running" && visible() ? context : null;
  const startMusic = () => {
    const ctx = ready(); if (!ctx || !settings.music || !settings.volume || !playing || music) return;
    buffer ??= renderMusic(ctx.sampleRate);
    void buffer.then((rendered) => {
      // A slow render/resume must not start audio after mute, pause or Exit.
      if (disposed || context !== ctx || !ready() || !settings.music || !settings.volume || !playing || music || !master) return;
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = rendered; source.loop = true; gain.gain.value = .7;
      source.connect(gain).connect(master); track(source, [gain]);
      music = source; started = ctx.currentTime; source.start(0, offset);
    }).catch(unavailable);
  };
  const unlock = () => {
    if (disposed || !(settings.sound || settings.music) || !visible()) return;
    try {
      context ??= new AudioContext();
      if (!master) { master = context.createGain(); master.connect(context.destination); }
      master.gain.value = settings.volume; unlocked = true;
      if (context.state === "running") startMusic(); else void context.resume().then(startMusic).catch(unavailable);
    } catch { unavailable(); }
  };
  const chime = (notes: number[], volume: number, duration: number) => {
    const ctx = ready(); if (!ctx || !master) return;
    notes.forEach((note, n) => {
      const at = ctx.currentTime + n * .09, source = ctx.createOscillator(), gain = ctx.createGain();
      source.type = "sine"; source.frequency.value = frequency(note);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .009);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration - .015); gain.gain.linearRampToValueAtTime(0, at + duration);
      source.connect(gain).connect(master!); track(source, [gain]); source.start(at); source.stop(at + duration);
    });
  };
  return {
    configure(value: AudioSettings) {
      settings = value;
      if (master && context) master.gain.setTargetAtTime(value.volume, context.currentTime, .025);
      if (!value.sound || !value.volume) stopEffects();
      if (!value.music || !value.volume) stopMusic(); else startMusic();
    },
    unlock,
    setPlaying(value: boolean) { playing = value; if (value) startMusic(); else stopMusic(); },
    reset() { stopMusic(); stopEffects(); offset = 0; },
    cue(cue: Cue) {
      if (!settings.sound || !settings.volume || !ready()) return;
      const cues: Record<Cue, [number[], number, number]> = {
        entry: [[72], .07, .1], note: [[83], .035, .055], erase: [[59], .045, .07],
        undo: [[69, 64], .045, .1], redo: [[64, 69], .045, .1], hint: [[74, 81], .065, .27],
        check: [[71, 78], .055, .2], conflict: [[50, 49], .035, .13],
        start: [[62, 69, 74], .055, .25], resume: [[69, 74], .045, .15], complete: [[74, 78, 81, 86], .08, .65],
      };
      try { chime(...cues[cue]); } catch { unavailable(); }
    },
    stop() { playing = false; stopMusic(); stopEffects(); },
    dispose() { disposed = true; playing = false; stopMusic(); stopEffects(); master?.disconnect(); void context?.close().catch(() => {}); context = null; master = null; buffer = null; },
  };
}
