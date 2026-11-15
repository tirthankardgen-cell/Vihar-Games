"use client";
import type { ButtonHTMLAttributes } from "react";
import styles from "./play-tools.module.css";

type Symbol = "menu" | "pause" | "play" | "back" | "audio" | "book";
export function PlayButton({ icon, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: Symbol; label: string }) {
  const paths = {
    menu: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    pause: <path d="M8 5v14M16 5v14" />,
    play: <path d="m8 4 12 8-12 8Z" />,
    back: <path d="M20 12H4m7-7-7 7 7 7" />,
    audio: <><path d="M3 9h4l5-4v14l-5-4H3Z" /><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    book: <path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" />,
  };
  return <button type="button" {...props} className={styles.button} aria-label={label} title={label}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[icon]}</svg></button>;
}

export function PlayState({ label, onAction, retry = false, countdown, disabled = false, spaceStart = false }: { label: string; onAction: () => void; retry?: boolean; countdown?: number; disabled?: boolean; spaceStart?: boolean }) {
  return <div className={styles.state}>
    <button type="button" className={styles.stateButton} aria-label={label} title={label} onClick={onAction} disabled={disabled} data-space-start={spaceStart || undefined}>
      {countdown ? <span aria-hidden="true">{countdown}</span> : <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{retry ? <path d="M25 14a10 10 0 1 0-3 10M25 6v8h-8" /> : <path d="m12 7 14 9-14 9Z" />}</svg>}
    </button>
  </div>;
}
