"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./chess.module.css";

export function ChessNav({ controls, embedded = false }: { controls?: React.ReactNode; embedded?: boolean }) {
  return <nav className={styles.nav} aria-label="Chess navigation">{!embedded && <Link href="/chess">← The courtyard</Link>}{controls}{!embedded && <span lang="hi">शतरंज</span>}<Link href="/chess/how-to-play" target={embedded ? "_blank" : undefined} rel={embedded ? "noopener noreferrer" : undefined}>How to play ↗</Link></nav>;
}
export function Mentor({ compact = false }: { compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={`${styles.mentor} ${compact ? styles.compactMentor : ""}`}>
    <div className={styles.avatar}>{failed ? <span aria-label="Acharya Dev">AD</span> : <Image src="/art/chess/acharya-dev.svg" width={80} height={80} alt="Acharya Dev, your chess mentor" onError={() => setFailed(true)} unoptimized />}</div>
    <div><strong>Acharya Dev</strong><span lang="hi">आचार्य देव</span><small>Vihar Computer</small></div>
  </div>;
}
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onClose={onClose}><h2>{title}</h2>{children}</dialog>;
}
