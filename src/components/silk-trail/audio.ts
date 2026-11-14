// Original "Mulberry Thread": quiet plucked notes, a leaf rustle and a wooden end note.
// Scheduling is independent of simulation. Pause cancels every queued source.
const melody = [293.66, 349.23, 440, 392, 349.23, 293.66, 261.63, 293.66, 349.23, 392, 523.25, 440, 392, 349.23, 329.63, 293.66];
export function createAudio(onUnavailable: () => void) {
  let context: AudioContext | null = null, sound = true, music = true, playing = false, disposed = false, failed = false;
  let timer: ReturnType<typeof setInterval> | null = null, beat = 0, nextBeat = 0;
  const effects = new Set<AudioScheduledSourceNode>(), notes = new Set<AudioScheduledSourceNode>();
  const unavailable = () => { if (!failed && !disposed) { failed = true; onUnavailable(); } };
  const stopSources = (sources: Set<AudioScheduledSourceNode>) => { for (const s of sources) { try { s.stop(); } catch { /* Already stopped. */ } } sources.clear(); };
  const getContext = () => { if (disposed || !sound && !music) return null; try { context ??= new AudioContext(); return context; } catch { unavailable(); return null; } };
  const unlock = () => { const c = getContext(); if (c) void c.resume().catch(unavailable); };
  const tone = (c: AudioContext, frequency: number, start: number, duration: number, volume: number, sources: Set<AudioScheduledSourceNode>) => {
    const oscillator = c.createOscillator(), gain = c.createGain(); oscillator.type = "triangle"; oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start); gain.gain.linearRampToValueAtTime(volume, start + .007); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(c.destination); sources.add(oscillator);
    oscillator.onended = () => { sources.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + .01);
  };
  const stopMusic = () => { if (timer !== null) clearInterval(timer); timer = null; stopSources(notes); };
  const startMusic = () => {
    if (!music || !playing || disposed || timer !== null) return; const c = getContext(); if (!c) return;
    nextBeat = c.currentTime + .04;
    const schedule = () => {
      if (!playing || !music || disposed || c.state !== "running") return;
      try { if (nextBeat < c.currentTime - .15) nextBeat = c.currentTime + .04;
        while (nextBeat < c.currentTime + .15) {
          const index = beat % melody.length; tone(c, melody[index], nextBeat, .55, .018, notes);
          if (index % 4 === 0) tone(c, index < 8 ? 146.83 : 174.61, nextBeat, 2.2, .008, notes);
          nextBeat += .72; beat++;
        }
      } catch { stopMusic(); unavailable(); }
    };
    schedule(); timer = setInterval(schedule, 70);
  };
  return {
    unlock, enable(value: boolean) { sound = value; if (!value) stopSources(effects); },
    enableMusic(value: boolean) { music = value; if (value) startMusic(); else stopMusic(); },
    start() { playing = true; startMusic(); },
    leaf() {
      if (!sound || disposed) return; const c = getContext(); if (!c || c.state !== "running") return;
      try { const length = Math.floor(c.sampleRate * .13), buffer = c.createBuffer(1, length, c.sampleRate), samples = buffer.getChannelData(0);
        let state = 91; for (let i = 0; i < length; i++) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; samples[i] = ((state / 0x100000000) * 2 - 1) * (1 - i / length); }
        const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(); source.buffer = buffer; filter.type = "bandpass"; filter.frequency.value = 1800; gain.gain.value = .075;
        source.connect(filter).connect(gain).connect(c.destination); effects.add(source);
        source.onended = () => { effects.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); }; source.start();
      } catch { unavailable(); }
    },
    end() { if (!sound || disposed) return; const c = getContext(); if (c?.state === "running") { try { tone(c, 155, c.currentTime, .16, .05, effects); } catch { unavailable(); } } },
    stop() { playing = false; stopMusic(); stopSources(effects); }, reset() { beat = 0; },
    dispose() { disposed = true; playing = false; stopMusic(); stopSources(effects); void context?.close().catch(() => {}); context = null; },
  };
}
