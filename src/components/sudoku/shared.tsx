"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./sudoku.module.css";

export function JournalNav({ children, embedded = false }: { children?: React.ReactNode; embedded?: boolean }) {
  const mark = <><span className={styles.brandMark} aria-hidden="true">9</span><span>SUDOKU<small>THE PUZZLE JOURNAL</small></span></>;
  return <nav className={styles.nav} aria-label="Sudoku navigation">
    {embedded ? <span className={styles.brand}>{mark}</span> : <Link href="/sudoku" className={styles.brand} aria-label="Sudoku overview">{mark}</Link>}
    <div className={styles.navActions}>{children ?? <Link className={styles.textButton} href="/">← All games</Link>}</div>
  </nav>;
}
export function JournalFooter() { return <footer className={styles.footer}><span>A little space for a clearer mind.</span><span>VIHAR · PUZZLE NO. 09</span></footer>; }
export function JournalDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; d?.showModal(); return () => d?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={(e) => e.stopPropagation()}>
    <div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.secondary} onClick={onClose} aria-label="Close dialog">×</button></div>{children}
  </dialog>;
}
