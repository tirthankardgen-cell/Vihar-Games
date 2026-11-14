"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { TrailMark } from "./art";
import styles from "./silk.module.css";
export function SilkNav({ children, onMenu, embedded = false }: { children?: React.ReactNode; onMenu?: () => void; embedded?: boolean }) {
  const mark = <><span className={styles.mark}><TrailMark /></span><span>SILK TRAIL<small>A SILK GARDEN</small></span></>;
  return <nav className={styles.nav} aria-label="Silk Trail navigation">{onMenu ? <button className={styles.brand} onClick={onMenu} aria-label="Silk Trail menu">{mark}</button> : embedded ? <span className={styles.brand}>{mark}</span> : <Link className={styles.brand} href="/silk-trail">{mark}</Link>}<div className={styles.navActions}>{children ?? <Link className={styles.textButton} href="/">← All games</Link>}</div></nav>;
}
export function SilkFooter() { return <footer className={styles.footer}><span>Leave a little room to grow.</span><span>VIHAR · SILK GARDEN</span></footer>; }
export function SilkDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; d?.showModal(); return () => d?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={(e) => e.stopPropagation()}><div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.iconButton} aria-label="Close dialog" onClick={onClose}>×</button></div>{children}</dialog>;
}
export const formatTime = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
