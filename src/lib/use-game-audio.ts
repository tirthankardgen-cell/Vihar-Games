"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioSettingsKey, createGameAudio, loadAudioPreferences, type AudioCue, type AudioGame, type AudioPreferences } from "./game-audio";

export function useGameAudio(game: AudioGame, playing: boolean, blocked = false) {
  const [preferences, setPreferences] = useState<AudioPreferences>({ sound: true, music: true });
  const [notice, setNotice] = useState("");
  const audio = useRef<ReturnType<typeof createGameAudio> | null>(null);
  const activity = useRef({ playing, blocked });
  useEffect(() => {
    activity.current = { playing, blocked };
    if (blocked || document.visibilityState !== "visible" || !document.hasFocus()) audio.current?.stop();
    else audio.current?.setPlaying(playing);
  }, [playing, blocked]);
  useEffect(() => {
    let disposed = false;
    const player = createGameAudio(game, () => setNotice("Audio is unavailable in this browser. You can keep playing."));
    audio.current = player;
    queueMicrotask(() => {
      if (disposed) return;
      let saved: AudioPreferences = { sound: true, music: true };
      try { saved = loadAudioPreferences(localStorage, game); } catch { /* Storage is optional. */ }
      setPreferences(saved); player.enable(saved.sound); player.enableMusic(saved.music);
      // Carrom mounts its table after Start. That gesture also unlocks its audio.
      if (navigator.userActivation?.hasBeenActive && !activity.current.blocked && document.visibilityState === "visible" && document.hasFocus()) {
        player.setPlaying(activity.current.playing); player.unlock();
      }
    });
    // Saved preferences still wait for a user gesture before creating audio.
    const gesture = () => {
      if (activity.current.blocked || document.visibilityState !== "visible" || !document.hasFocus()) return;
      player.setPlaying(activity.current.playing); player.unlock();
    };
    const stop = () => player.stop();
    const visibility = () => { if (document.visibilityState !== "visible") stop(); };
    document.addEventListener("pointerdown", gesture, true); document.addEventListener("keydown", gesture, true);
    document.addEventListener("visibilitychange", visibility); window.addEventListener("blur", stop); window.addEventListener("pagehide", stop);
    return () => {
      disposed = true; player.dispose(); audio.current = null;
      document.removeEventListener("pointerdown", gesture, true); document.removeEventListener("keydown", gesture, true);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", stop); window.removeEventListener("pagehide", stop);
    };
  }, [game]);
  const cue = useCallback((value: AudioCue) => {
    if (!activity.current.blocked && document.visibilityState === "visible" && document.hasFocus()) audio.current?.cue(value);
  }, []);
  const update = (key: keyof AudioPreferences) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next); audio.current?.enable(next.sound); audio.current?.enableMusic(next.music);
    if (!activity.current.blocked && document.visibilityState === "visible" && document.hasFocus()) audio.current?.unlock();
    try { localStorage.setItem(audioSettingsKey(game), JSON.stringify(next)); }
    catch { setNotice("Audio preferences could not be saved. They still work for this visit."); }
  };
  return { preferences, notice, update, cue, stop: () => audio.current?.stop() };
}
