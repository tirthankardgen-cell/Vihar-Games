"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BirdMark } from "./art";
import styles from "./paperwing.module.css";

export function PaperwingNav({ embedded = false, children }: { embedded?: boolean; children?: React.ReactNode }) {
  const brand = <><span className={styles.brandMark}><BirdMark /></span><span>PAPERWING<small>VIHAR AIRMAIL</small></span></>;
  return <nav className={styles.nav} aria-label="Paperwing navigation">
    {embedded ? <span className={styles.brand}>{brand}</span> : <Link href="/paperwing" className={styles.brand} aria-label="Paperwing home">{brand}</Link>}
    <div className={styles.navActions}>{children ?? <Link className={styles.textButton} href="/">All games <span aria-hidden="true">↗</span></Link>}</div>
  </nav>;
}
export function PaperwingFooter() {
  return <footer className={styles.footer}><span>A little paper. A lot of sky.</span><span>ORIGINAL FLIGHTS BY VIHAR</span></footer>;
}
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onClose={() => { if (ref.current && !ref.current.open) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}>
    <div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.iconButton} aria-label="Close dialog" onClick={onClose}>×</button></div>{children}
  </dialog>;
}
