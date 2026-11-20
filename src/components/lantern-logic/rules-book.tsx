"use client";
import { useState } from "react";
import { lanternRules } from "@/games/lantern-logic/rules";
import styles from "./lantern.module.css";
export function RulesBook() {
  const notes = lanternRules.flatMap((section) => section.items.map((item) => ({ title: section.title, item })));
  const [page, setPage] = useState(0), rule = notes[page];
  return <section className={styles.rulesBook} aria-label="Lantern Logic rules"><div className={styles.rulesContent} aria-live="polite"><p className={styles.eyebrow}>WORKSHOP NOTES · {String(page + 1).padStart(2, "0")}</p><h2>{rule.title}</h2><p>{rule.item}</p>{page === 3 && <div className={styles.example} aria-label="Example: clue 2 1, Lit Lit Empty Lit Empty"><strong>2 1</strong><span className={styles.exampleLit} /><span className={styles.exampleLit} /><span>×</span><span className={styles.exampleLit} /><span>×</span></div>}</div><div className={styles.pagination}><button className={styles.secondary} onClick={() => setPage(page - 1)} disabled={page === 0}>← Previous</button><span>{page + 1} / {notes.length}</span><button className={styles.secondary} onClick={() => setPage(page + 1)} disabled={page === notes.length - 1}>Next →</button></div></section>;
}
