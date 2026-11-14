"use client";

import { useState } from "react";
import { monsoonRules } from "@/games/monsoon-blocks/rules";
import { ShapePreview } from "./art";
import { SHAPES } from "@/games/monsoon-blocks/engine";
import styles from "./monsoon.module.css";

// Short sentence groups keep the exact published rules readable in shallow players.
const pages = monsoonRules.flatMap((section) => section.items.flatMap((text) => {
  const chunks: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
    const last = chunks.at(-1);
    if (last && last.length + sentence.length < 290) chunks[chunks.length - 1] = `${last} ${sentence}`;
    else chunks.push(sentence);
  }
  return chunks.map((chunk) => ({ title: section.title, text: chunk }));
}));
export function RulesBook() {
  const [index, setIndex] = useState(0), page = pages[index];
  return <section className={styles.rulesBook} aria-label="Monsoon Blocks rules">
    <div className={styles.ruleLabel}><span>A SMALL GUIDE TO THE RAIN</span><span>{String(index + 1).padStart(2, "0")} / {pages.length}</span></div>
    <article className={styles.ruleArticle} key={index} aria-live="polite"><ShapePreview shape={SHAPES[index % 7]} className={styles.ruleShape} /><h2>{page.title}</h2><p>{page.text}</p></article>
    <div className={styles.rulePager}><button className={styles.secondary} disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button><span>{index + 1} of {pages.length}</span><button className={styles.secondary} disabled={index === pages.length - 1} onClick={() => setIndex(index + 1)}>Next →</button></div>
  </section>;
}
