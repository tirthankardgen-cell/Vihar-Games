"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import styles from "./carrom.module.css";

export function CarromNav({ home = false, embedded = false, compact = false, controls }: { home?: boolean; embedded?: boolean; compact?: boolean; controls?: React.ReactNode }) {
  const brand = <><span className={styles.brandMark} lang="hi">क</span><span lang="hi">कैरम <small lang="en">VIHAR CARROM</small></span></>;
  return <nav className={`${styles.nav} ${compact ? styles.compactNav : ""}`} aria-label="Carrom navigation">
    {embedded ? <span className={styles.brand}>{brand}</span> : <Link className={styles.brand} href={home ? "/" : "/carrom"} aria-label={home ? "Vihar Games home" : "Carrom home"}>{brand}</Link>}
    {!compact && <span className={styles.navClub}>THE VERANDA CLUB <i aria-hidden="true">✦</i> EST. FOR GOOD COMPANY</span>}
    <div className={styles.navActions}>{controls}{!compact && <Link className={styles.helpLink} href="/carrom/how-to-play" target={embedded ? "_blank" : undefined} rel={embedded ? "noopener noreferrer" : undefined}><Icon name="book" /><span>How to play</span></Link>}</div>
  </nav>;
}

export function CarromFooter() {
  return <footer className={styles.footer}><span><Icon name="cup" />Best served with chai.</span><span lang="hi">बस, एक बाज़ी और।</span></footer>;
}

export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onClose={() => { if (ref.current && !ref.current.open) onClose(); }} onKeyDown={(e) => { if (e.key === "Escape") e.stopPropagation(); }}><div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.iconButton} aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>{children}</dialog>;
}
