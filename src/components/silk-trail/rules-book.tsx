"use client";
import { useState } from "react";
import { silkRules } from "@/games/silk-trail/rules";
import styles from "./silk.module.css";
// Each short page keeps the full published rules readable at accessibility zoom.
const pages = silkRules.flatMap((section) => section.items.flatMap((item) => item.split(/(?<=[.!?])\s+(?=[A-Z])/).map((text) => ({ title: section.title, text }))));
export function RulesBook() {
  const [index, setIndex] = useState(0), page = pages[index];
  return <section className={styles.rulesBook} aria-label="Silk Trail rules"><div className={styles.ruleLabel}><span>THE GARDEN GUIDE</span><span>{String(index + 1).padStart(2, "0")} / {pages.length}</span></div><article className={styles.ruleArticle} aria-live="polite"><h2>{page.title}</h2><p>{page.text}</p></article><div className={styles.rulePager}><button className={styles.secondary} disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button><span>{index + 1} / {pages.length}</span><button className={styles.secondary} disabled={index === pages.length - 1} onClick={() => setIndex(index + 1)}>Next →</button></div></section>;
}
