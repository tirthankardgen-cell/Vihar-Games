"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { WindowMark } from "./art";
import styles from "./monsoon.module.css";

export function MonsoonNav({ children, embedded = false, onMenu }: { children?: React.ReactNode; embedded?: boolean; onMenu?: () => void }) {
  const mark = <><span className={styles.brandMark}><WindowMark /></span><span>MONSOON BLOCKS<small>A RAIN WINDOW</small></span></>;
  return <nav className={styles.nav} aria-label="Monsoon Blocks navigation">
    {onMenu ? <button className={styles.brand} onClick={onMenu} aria-label="Monsoon Blocks menu">{mark}</button> : embedded ? <span className={styles.brand}>{mark}</span> : <Link className={styles.brand} href="/monsoon-blocks" aria-label="Monsoon Blocks overview">{mark}</Link>}
    <div className={styles.navActions}>{children ?? <Link className={styles.textButton} href="/">← All games</Link>}</div>
  </nav>;
}
export function MonsoonFooter() { return <footer className={styles.footer}><span>A little calm between the drops.</span><span>VIHAR · RAIN WINDOW</span></footer>; }
export function MonsoonDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; d?.showModal(); return () => d?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={(e) => e.stopPropagation()}>
    <div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.iconButton} onClick={onClose} aria-label="Close dialog">×</button></div>{children}
  </dialog>;
}
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000), minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
