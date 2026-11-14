"use client";

import { useState } from "react";
import { duneDashRules } from "@/games/dune-dash/rules";
import styles from "./dune-dash.module.css";

const pages = duneDashRules.flatMap((section) => section.items.map((text) => ({ title: section.title, text })));
export function RulesBook() {
  const [page, setPage] = useState(0), current = pages[page];
  return <article className={styles.rulesBook} aria-label="Dune Dash rules">
    <p className={styles.eyebrow}>FIELD NOTE {String(page + 1).padStart(2, "0")} / HOW TO RUN</p>
    <div className={styles.ruleBody} aria-live="polite"><h2>{current.title}</h2><p>{current.text}</p></div>
    <nav className={styles.pagination} aria-label="Rules pages"><button className={styles.secondary} disabled={page === 0} onClick={() => setPage((n) => n - 1)}>← Previous</button><span>{page + 1} / {pages.length}</span><button className={styles.secondary} disabled={page === pages.length - 1} onClick={() => setPage((n) => n + 1)}>Next →</button></nav>
  </article>;
}
