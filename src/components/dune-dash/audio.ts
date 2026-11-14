// Original short, quiet notes. No samples, network, or simulation side effects.
export function createAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null, enabled = false, musicEnabled = false, playing = false, disposed = false;
  let timer: ReturnType<typeof setInterval> | null = null, nextBeat = 0, beat = 0;
  const voices = new Set<OscillatorNode>(), melodyVoices = new Set<OscillatorNode>();
  const stopVoices = (set: Set<OscillatorNode>) => { for (const voice of set) { try { voice.stop(); } catch { /* Ended already. */ } } set.clear(); };
  const stopMusic = () => { if (timer !== null) clearInterval(timer); timer = null; stopVoices(melodyVoices); };
  const stop = () => { playing = false; stopMusic(); stopVoices(voices); };
  const getContext = () => {
    if (disposed) return null;
    try { context ??= new AudioContext(); void context.resume().catch(onUnavailable); return context; }
    catch { onUnavailable(); return null; }
  };
  const note = (frequency: number, duration: number, volume: number, fall: number) => {
    if (!enabled || disposed) return;
    try {
      if (!getContext() || !context) return;
      const voice = context.createOscillator(), gain = context.createGain();
      voice.type = "sine"; voice.frequency.setValueAtTime(frequency, context.currentTime); voice.frequency.exponentialRampToValueAtTime(fall, context.currentTime + duration);
      gain.gain.setValueAtTime(volume, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
      voice.connect(gain).connect(context.destination); voices.add(voice);
      voice.onended = () => { voices.delete(voice); voice.disconnect(); gain.disconnect(); };
      voice.start(); voice.stop(context.currentTime + duration);
    } catch { onUnavailable(); }
  };
  // An original pentatonic plucked loop, scheduled against the audio clock.
  // A bounded look-ahead keeps it independent of frame rate and game physics.
  const melody = [220,0,261.63,293.66,0,329.63,293.66,0,261.63,0,196,220,0,293.66,261.63,0];
  const pluck = (frequency: number, at: number, volume: number, duration: number) => {
    if (!context) return;
    const voice = context.createOscillator(), gain = context.createGain();
    voice.type = "triangle"; voice.frequency.value = frequency;
    gain.gain.setValueAtTime(.001, at); gain.gain.linearRampToValueAtTime(volume, at + .008); gain.gain.exponentialRampToValueAtTime(.001, at + duration);
    voice.connect(gain).connect(context.destination); melodyVoices.add(voice);
    voice.onended = () => { melodyVoices.delete(voice); voice.disconnect(); gain.disconnect(); };
    voice.start(at); voice.stop(at + duration + .01);
  };
  const startMusic = () => {
    if (!playing || !musicEnabled || timer !== null || !getContext() || !context) return;
    nextBeat = context.currentTime + .025;
    const schedule = () => {
      if (!context || !playing || !musicEnabled) return;
      if (nextBeat < context.currentTime) nextBeat = context.currentTime + .025;
      for (let n = 0; n < 2 && nextBeat < context.currentTime + .12; n++) {
        const frequency = melody[beat % melody.length];
        if (frequency) pluck(frequency, nextBeat, .018, .48);
        if (beat % 8 === 0) pluck(beat % 16 === 0 ? 110 : 98, nextBeat, .012, 1.1);
        beat++; nextBeat += .375;
      }
    };
    schedule(); timer = setInterval(schedule, 80);
  };
  return {
    enable(value: boolean) { enabled = value; if (!value) stopVoices(voices); else getContext(); },
    music(value: boolean) { musicEnabled = value; if (!value) stopMusic(); else { getContext(); startMusic(); } },
    unlock() { if (enabled || musicEnabled) getContext(); },
    running(value: boolean) { playing = value; if (value) startMusic(); else stop(); },
    jump() { note(310, .11, .035, 530); }, tap() { note(140, .025, .015, 85); }, thud() { note(95, .15, .04, 36); },
    stop, dispose() { disposed = true; stop(); void context?.close().catch(() => {}); },
  };
}
