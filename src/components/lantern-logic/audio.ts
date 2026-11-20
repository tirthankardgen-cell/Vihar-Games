// Original "Paper Lantern": slow pentatonic plucks, a dry graphite brush,
// and one warm bell. Audio scheduling is independent of the puzzle clock.
const melody = [62, 69, 74, 0, 72, 69, 67, 0, 62, 67, 69, 0, 74, 72, 67, 0, 65, 69, 72, 0, 69, 67, 62, 0];
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);
export function createAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null, sound = true, music = true, playing = false, disposed = false, failed = false, beat = 0, nextBeat = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const effects = new Set<AudioScheduledSourceNode>(), notes = new Set<AudioScheduledSourceNode>();
  const unavailable = () => { if (!failed && !disposed) { failed = true; onUnavailable(); } };
  const stopSources = (sources: Set<AudioScheduledSourceNode>) => { for (const s of [...sources]) { try { s.stop(); } catch { /* Already ended. */ } } sources.clear(); };
  const tone = (c: AudioContext, note: number, at: number, length: number, volume: number, sources: Set<AudioScheduledSourceNode>, type: OscillatorType = "sine") => {
    const s = c.createOscillator(), gain = c.createGain(); sources.add(s);
    s.onended = () => { sources.delete(s); s.disconnect(); gain.disconnect(); };
    s.type = type; s.frequency.setValueAtTime(frequency(note), at);
    gain.gain.setValueAtTime(.0001, at); gain.gain.linearRampToValueAtTime(volume, at + .01); gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    s.connect(gain).connect(c.destination); s.start(at); s.stop(at + length + .01);
  };
  const stopMusic = () => { if (timer !== null) clearInterval(timer); timer = null; stopSources(notes); };
  const startMusic = () => {
    const c = context; if (disposed || !playing || !music || !c || c.state !== "running" || timer !== null) return;
    nextBeat = c.currentTime + .04;
    const schedule = () => {
      if (!playing || !music || disposed || c.state !== "running") { stopMusic(); return false; }
      try { if (nextBeat < c.currentTime - .15) nextBeat = c.currentTime + .04;
        while (nextBeat < c.currentTime + .15) { const i = beat % melody.length; if (melody[i]) tone(c, melody[i], nextBeat, .8, .017, notes, "triangle"); if (i % 8 === 0) tone(c, i < 16 ? 38 : 41, nextBeat, 2.8, .009, notes); nextBeat += .86; beat++; }
        return true;
      } catch { stopMusic(); unavailable(); return false; }
    };
    if (schedule()) timer = setInterval(schedule, 80);
  };
  return {
    unlock() { if (disposed || !sound && !music) return; try { context ??= new AudioContext(); if (context.state === "running") startMusic(); else void context.resume().then(() => { if (!disposed) startMusic(); }).catch(unavailable); } catch { unavailable(); } },
    configure(value: { sound: boolean; music: boolean }) { sound = value.sound; music = value.music; if (!sound) stopSources(effects); if (!music) stopMusic(); else startMusic(); },
    setPlaying(value: boolean) { playing = value; if (value) startMusic(); else stopMusic(); },
    pencil() {
      const c = context; if (!sound || disposed || !c || c.state !== "running") return;
      try { const length = Math.floor(c.sampleRate * .065), buffer = c.createBuffer(1, length, c.sampleRate), samples = buffer.getChannelData(0); let seed = 73;
        for (let i = 0; i < length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; samples[i] = (seed / 2147483648 - 1) * (1 - i / length); }
        const s = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(); effects.add(s); s.buffer = buffer; filter.type = "bandpass"; filter.frequency.value = 2600; gain.gain.value = .055;
        s.onended = () => { effects.delete(s); s.disconnect(); filter.disconnect(); gain.disconnect(); }; s.connect(filter).connect(gain).connect(c.destination); s.start();
      } catch { stopSources(effects); unavailable(); }
    },
    bell() { const c = context; if (!sound || disposed || !c || c.state !== "running") return; try { tone(c, 74, c.currentTime, 1.5, .045, effects); tone(c, 86, c.currentTime, .8, .007, effects); } catch { stopSources(effects); unavailable(); } },
    stop() { playing = false; stopMusic(); stopSources(effects); },
    dispose() { disposed = true; playing = false; stopMusic(); stopSources(effects); void context?.close().catch(() => {}); context = null; },
  };
}
