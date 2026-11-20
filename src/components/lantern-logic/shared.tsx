"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./lantern.module.css";
export function WorkshopNav({ children, embedded = false }: { children?: React.ReactNode; embedded?: boolean }) {
  const mark = <><svg width="26" height="34" viewBox="0 0 26 34" fill="none" aria-hidden="true"><path d="M13 0v4M8 5h10M6 8 3 13v11l3 4h14l3-4V13l-3-5ZM8 31h10m-5-3v6" stroke="currentColor" strokeWidth="1.5" /><path d="M9 14h8v8H9z" fill="#D1A24E" /></svg><span>LANTERN LOGIC<small>THE LANTERN WORKSHOP</small></span></>;
  return <nav className={styles.nav} aria-label="Lantern Logic navigation">{embedded ? <span className={styles.brand}>{mark}</span> : <Link href="/lantern-logic" className={styles.brand} aria-label="Lantern Logic overview">{mark}</Link>}<div className={styles.navActions}>{children ?? <Link className={styles.textButton} href="/">← All games</Link>}</div></nav>;
}
export function WorkshopFooter() { return <footer className={styles.footer}><span>A small ritual. A little light.</span><span>VIHAR · ONE PLAYER · NO HURRY</span></footer>; }
export function WorkshopDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={(e) => e.stopPropagation()}><div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.secondary} onClick={onClose} aria-label="Close dialog">×</button></div>{children}</dialog>;
}
