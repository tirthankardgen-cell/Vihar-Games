"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Fox } from "./art";
import styles from "./dune-dash.module.css";

export function DuneNav({ embedded = false, children }: { embedded?: boolean; children?: React.ReactNode }) {
  const brand = <><span className={styles.brandMark}><Fox /></span><span>DUNE DASH<small>DESERT FIELD NOTES</small></span></>;
  return <nav className={styles.nav} aria-label="Dune Dash navigation">
    {embedded ? <span className={styles.brand}>{brand}</span> : <Link href="/dune-dash" className={styles.brand} aria-label="Dune Dash home">{brand}</Link>}
    <div className={styles.navActions}>{children ?? <Link className={styles.textButton} href="/">All games <span aria-hidden="true">↗</span></Link>}</div>
  </nav>;
}
export function DuneFooter() {
  return <footer className={styles.footer}><span>Leave only little pawprints.</span><span>AN ORIGINAL FIELD STUDY BY VIHAR</span></footer>;
}
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}>
    <header className={styles.dialogHeading}><h2>{title}</h2><button className={styles.iconButton} onClick={onClose} aria-label="Close dialog">×</button></header>{children}
  </dialog>;
}
