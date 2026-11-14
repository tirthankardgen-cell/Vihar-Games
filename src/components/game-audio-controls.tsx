"use client";

import { useEffect, useRef, useState } from "react";
import type { useGameAudio } from "@/lib/use-game-audio";
import styles from "./game-audio-controls.module.css";

export function GameAudioControls({ audio }: { audio: ReturnType<typeof useGameAudio> }) {
  const [open, setOpen] = useState(false), ref = useRef<HTMLDivElement>(null);
  const { sound, music } = audio.preferences;
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); ref.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", outside); ref.current?.addEventListener("keydown", escape);
    const element = ref.current;
    return () => { document.removeEventListener("pointerdown", outside); element?.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={ref} className={styles.controls}>
    <button type="button" className={styles.trigger} aria-label="Audio settings" aria-expanded={open} title="Sound and music" onClick={() => setOpen(!open)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Z" />{sound || music ? <path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}</svg>
    </button>
    {open && <div className={styles.panel} role="group" aria-label="Sound and music">
      <button type="button" aria-pressed={sound} onClick={() => audio.update("sound")}>Sound {sound ? "on" : "off"}<span aria-hidden="true">{sound ? "✓" : "○"}</span></button>
      <button type="button" aria-pressed={music} onClick={() => audio.update("music")}>Music {music ? "on" : "off"}<span aria-hidden="true">{music ? "✓" : "○"}</span></button>
      {audio.notice && <p role="status">{audio.notice}</p>}
    </div>}
  </div>;
}
