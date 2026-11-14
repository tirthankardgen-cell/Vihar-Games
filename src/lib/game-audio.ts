// Original synthesized music and effects. No downloads or game-clock work.
export type AudioGame = "chess" | "carrom" | "tic-tac-toe";
export type AudioCue = "start" | "move" | "undo" | "check" | "capture" | "strike" | "pocket" | "complete" | "draw";
export type AudioPreferences = { sound: boolean; music: boolean };
export const audioSettingsKey = (game: AudioGame) => `vihar-games:${game}:audio:v1`;
export function loadAudioPreferences(storage: Pick<Storage, "getItem">, game: AudioGame): AudioPreferences {
  try {
    const saved = JSON.parse(storage.getItem(audioSettingsKey(game)) ?? "null");
    return { sound: typeof saved?.sound === "boolean" ? saved.sound : true, music: typeof saved?.music === "boolean" ? saved.music : true };
  } catch { return { sound: true, music: true }; }
}

// Neem Shade, Veranda Evening, and Notebook Waltz.
const scores = {
  chess: { beat: 1, type: "triangle", melody: [62, 65, 69, 0, 72, 69, 65, 0, 67, 70, 74, 0, 70, 67, 62, 0, 65, 69, 72, 0, 74, 72, 69, 0, 64, 67, 71, 0, 69, 65, 62, 0], bass: [38, 43, 41, 45] },
  carrom: { beat: .8, type: "triangle", melody: [67, 71, 74, 0, 76, 74, 71, 0, 64, 67, 71, 0, 72, 71, 67, 0, 69, 72, 76, 0, 74, 72, 69, 0, 62, 67, 69, 0, 71, 69, 67, 0], bass: [43, 40, 45, 38] },
  "tic-tac-toe": { beat: .65, type: "sine", melody: [72, 76, 79, 76, 74, 0, 69, 72, 76, 72, 71, 0, 77, 76, 72, 69, 72, 0, 74, 71, 67, 71, 72, 0], bass: [48, 45, 53, 43] },
} satisfies Record<AudioGame, { beat: number; type: OscillatorType; melody: number[]; bass: number[] }>;
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);
const cues: Record<AudioCue, number[]> = {
  start: [60, 67, 72], move: [76], undo: [72, 67], check: [67, 72],
  capture: [60, 72], strike: [48, 60], pocket: [79, 84], complete: [72, 76, 79, 84], draw: [67, 72, 67],
};

export function createGameAudio(game: AudioGame, onUnavailable: () => void) {
  const score = scores[game];
  let context: AudioContext | null = null, sound = false, music = false, playing = false, disposed = false, reported = false;
  let timer: ReturnType<typeof setInterval> | null = null, beat = 0, nextBeat = 0;
  const effects = new Map<OscillatorNode, GainNode>(), notes = new Map<OscillatorNode, GainNode>();
  const unavailable = () => { if (!disposed && !reported) { reported = true; onUnavailable(); } };
  const release = (source: OscillatorNode, sources: Map<OscillatorNode, GainNode>) => {
    const gain = sources.get(source); if (!gain) return;
    sources.delete(source); source.disconnect(); gain.disconnect();
  };
  const stopSources = (sources: Map<OscillatorNode, GainNode>) => {
    for (const source of sources.keys()) { try { source.stop(); } catch { /* Already ended. */ } release(source, sources); }
  };
  const tone = (ctx: AudioContext, note: number, at: number, length: number, volume: number, sources: Map<OscillatorNode, GainNode>, type: OscillatorType = "sine") => {
    const source = ctx.createOscillator(), gain = ctx.createGain();
    // Track before configuring so a device failure can release partial nodes.
    sources.set(source, gain); source.onended = () => release(source, sources);
    source.type = type; source.frequency.setValueAtTime(frequency(note), at);
    gain.gain.setValueAtTime(.0001, at); gain.gain.linearRampToValueAtTime(volume, at + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    source.connect(gain).connect(ctx.destination); source.start(at); source.stop(at + length + .01);
  };
  const stopMusic = () => { if (timer !== null) clearInterval(timer); timer = null; stopSources(notes); };
  const startMusic = () => {
    const ctx = context;
    if (!ctx || ctx.state !== "running" || !music || !playing || disposed || timer !== null) return;
    nextBeat = ctx.currentTime + .04;
    const schedule = () => {
      if (!playing || !music || disposed) return false;
      if (ctx.state !== "running") { stopMusic(); return false; }
      // A suspended or delayed clock never causes a burst of missed notes.
      if (nextBeat < ctx.currentTime - .16) nextBeat = ctx.currentTime + .04;
      try {
        while (nextBeat < ctx.currentTime + .16) {
          const index = beat % score.melody.length, note = score.melody[index];
          if (note) tone(ctx, note, nextBeat, score.beat * .85, .025, notes, score.type);
          const bar = game === "tic-tac-toe" ? 6 : 8;
          if (index % bar === 0) {
            const bass = score.bass[Math.floor(index / bar) % score.bass.length];
            tone(ctx, bass, nextBeat, score.beat * 2.8, .012, notes);
            tone(ctx, bass + 7, nextBeat, score.beat * 2.8, .006, notes);
          }
          nextBeat += score.beat; beat++;
        }
        return true;
      } catch { stopMusic(); unavailable(); return false; }
    };
    if (schedule()) timer = setInterval(schedule, 80);
  };
  const unlock = () => {
    if (disposed || !sound && !music) return;
    try {
      context ??= new AudioContext();
      if (context.state === "running") startMusic();
      else void context.resume().then(() => { if (!disposed) startMusic(); }).catch(unavailable);
    } catch { unavailable(); }
  };
  return {
    enable(value: boolean) { sound = value; if (!value) stopSources(effects); },
    enableMusic(value: boolean) { music = value; if (value) startMusic(); else stopMusic(); },
    unlock,
    setPlaying(value: boolean) { playing = value; if (value) startMusic(); else stopMusic(); },
    cue(cue: AudioCue) {
      const ctx = context; if (!sound || disposed || !ctx || ctx.state !== "running") return;
      try {
        cues[cue].forEach((note, i) => tone(ctx, note, ctx.currentTime + i * .065, cue === "complete" ? .35 : .12, .055, effects, score.type));
      } catch { stopSources(effects); unavailable(); }
    },
    stop() { playing = false; stopMusic(); stopSources(effects); },
    dispose() { disposed = true; playing = false; stopMusic(); stopSources(effects); void context?.close().catch(() => {}); context = null; },
  };
}
