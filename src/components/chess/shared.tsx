"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import styles from "./chess.module.css";

export function ChessNav({ controls, embedded = false, home = false }: { controls?: React.ReactNode; embedded?: boolean; home?: boolean }) {
  return <nav className={styles.nav} aria-label="Chess navigation">
    {embedded ? <span className={styles.navBrand}><span className={styles.brandMark} lang="hi">श</span><span>शतरंज <b>VIHAR CHESS</b></span></span> : <Link className={styles.navBrand} href={home ? "/" : "/chess"} aria-label={home ? "Vihar Games home" : "Chess courtyard"}><span className={styles.brandMark} lang="hi">श</span><span>शतरंज <b>VIHAR CHESS</b></span></Link>}
    <div className={styles.navActions}>{controls}<Link className={styles.helpLink} href="/chess/how-to-play" target={embedded ? "_blank" : undefined} rel={embedded ? "noopener noreferrer" : undefined}><Icon name="book" /><span>How to play</span></Link></div>
  </nav>;
}
export function ChessFooter() { return <footer className={styles.footer}><span>A little play. A little togetherness.</span><span lang="hi">चाल आपकी।</span></footer>; }
export function Mentor({ compact = false, difficulty }: { compact?: boolean; difficulty?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`${styles.mentor} ${compact ? styles.compactMentor : ""}`}>
    <div className={styles.avatar}>{failed ? <span aria-label="Acharya Dev">AD</span> : <Image src="/art/chess/acharya-dev.svg" width={80} height={80} alt="Acharya Dev, your chess mentor" onError={() => setFailed(true)} unoptimized />}</div>
    <div><strong>Acharya Dev</strong><span lang="hi">आचार्य देव</span><small>Vihar Computer{difficulty ? ` · ${difficulty}` : ""}</small></div>
  </div>;
}
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  // Strict Mode may reopen the same dialog before its cleanup close event runs.
  // Escape belongs to the open dialog, including inside Vihar's embedded player.
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onClose={() => { if (ref.current && !ref.current.open) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}><div className={styles.dialogHeading}><h2>{title}</h2><button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>{children}</dialog>;
}
