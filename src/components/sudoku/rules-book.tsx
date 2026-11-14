"use client";
import { useState } from "react";
import { sudokuRules } from "@/games/sudoku/rules";
import styles from "./sudoku.module.css";
const pages = sudokuRules.flatMap((section) => section.items.map((text) => ({ title: section.title, text })));
export function RulesBook() {
  const [index, setIndex] = useState(0), page = pages[index];
  return <section className={styles.rulesBook} aria-label="Sudoku rules journal">
    <div className={styles.rulesLabel}><span>THE SHORT GUIDE</span><span>{String(index + 1).padStart(2, "0")} / {pages.length}</span></div>
    <article className={styles.rulesArticle} key={index} aria-live="polite"><p className={styles.ruleNumber}>{String(index + 1).padStart(2, "0")}</p><h2>{page.title}</h2><p>{page.text}</p></article>
    <div className={styles.rulesPager}><button className={styles.secondary} disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button><span>{index + 1} of {pages.length}</span><button className={styles.secondary} disabled={index === pages.length - 1} onClick={() => setIndex(index + 1)}>Next →</button></div>
  </section>;
}
