"use client";
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
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

export type PlayCallout = { title: string; label: string; tone?: "warm" | "royal" | "alert"; id: string | number };
export function usePlayCallout(paused: boolean) {
  const [event, setEvent] = useState<PlayCallout | null>(null);
  const remaining = useRef({ event: null as PlayCallout | null, ms: 2300 });
  useEffect(() => {
    if (remaining.current.event !== event) remaining.current = { event, ms: 2300 };
    if (!event || paused) return;
    const start = performance.now(), timer = window.setTimeout(() => setEvent(null), remaining.current.ms);
    return () => { clearTimeout(timer); remaining.current.ms = Math.max(0, remaining.current.ms - (performance.now() - start)); };
  }, [event, paused]);
  const show = useCallback((next: PlayCallout) => setEvent(next), []);
  const dismiss = useCallback(() => setEvent(null), []);
  return { event, show, dismiss };
}
export function PlayCallout({ event, paused = false }: { event: PlayCallout; paused?: boolean }) {
  return <div key={event.id} className={styles.callout} data-tone={event.tone ?? "warm"} data-paused={paused} role="status" aria-atomic="true"><span aria-hidden="true">✦</span><small>{event.label}</small><strong>{event.title}</strong></div>;
}
