"use client";

import { useState } from "react";
import { paperwingRules } from "@/games/paperwing/rules";
import { BirdMark } from "./art";
import styles from "./paperwing.module.css";

const pages = paperwingRules.flatMap((section) => section.items.map((text) => ({ title: section.title, text })));
export function RulesBook({ dialog = false }: { dialog?: boolean }) {
  const [page, setPage] = useState(0), current = pages[page];
  return <article className={`${styles.rulesBook} ${dialog ? styles.modalBook : ""}`} aria-label="Paperwing rules">
    <div className={styles.ruleTop}><span className={styles.eyebrow}>POSTCARD {String(page + 1).padStart(2, "0")} / HOW TO FLY</span><BirdMark /></div>
    <div className={styles.ruleBody} aria-live="polite"><h2>{current.title}</h2><p>{current.text}</p></div>
    <nav className={styles.pagination} aria-label="Rules pages"><button className={styles.secondary} disabled={page === 0} onClick={() => setPage((n) => n - 1)}>← Previous</button><span>{page + 1} / {pages.length}</span><button className={styles.secondary} disabled={page === pages.length - 1} onClick={() => setPage((n) => n + 1)}>Next →</button></nav>
  </article>;
}
