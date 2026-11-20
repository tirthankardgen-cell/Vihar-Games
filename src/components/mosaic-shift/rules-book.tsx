"use client";
import { useState } from "react";
import { mosaicRules } from "@/games/mosaic-shift/rules";
import styles from "./mosaic.module.css";
const pages = mosaicRules.flatMap(rule => {
  const sentences = rule.items[0].match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [rule.items[0]];
  const parts: string[] = [];
  for (const sentence of sentences) {
    for (const word of sentence.trim().split(/\s+/)) {
      const last = parts.at(-1);
      if (last && `${last} ${word}`.length <= 100) parts[parts.length - 1] = `${last} ${word}`;
      else parts.push(word);
    }
  }
  return parts.map((text, i) => ({ title: rule.title, text, continuation: i > 0 }));
});
export function RulesBook() {
  const [page, setPage] = useState(0), rule = pages[page];
  return <section className={styles.rulesBook} aria-label="Mosaic Shift rules"><div className={styles.bookLabel}><span>NOTES FROM THE STUDIO</span><span>RULES 1.0</span></div><article key={page} className={styles.ruleArticle} aria-live="polite"><p className={styles.eyebrow}>NOTE {String(page + 1).padStart(2, "0")}{rule.continuation ? " · CONTINUED" : ""}</p><h2>{rule.title}</h2><p>{rule.text}</p></article><div className={styles.pager}><button disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button><span>{page + 1} / {pages.length}</span><button disabled={page === pages.length - 1} onClick={() => setPage(page + 1)}>Next →</button></div></section>;
}
