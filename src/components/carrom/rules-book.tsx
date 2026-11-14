"use client";

import { useState } from "react";
import Link from "next/link";
import { carromRules } from "@/games/carrom/rules";
import { BoardArt, Coin } from "./board-art";
import { Icon } from "./icons";
import styles from "./carrom.module.css";

// Short paged passages keep the complete published text readable on phones.
const pages = carromRules.flatMap((chapter, chapterIndex) => chapter.items.flatMap((text) => {
  const passages: string[] = [];
  for (const word of text.split(" ")) {
    const last = passages.length - 1;
    if (last < 0 || passages[last].length + word.length + 1 > 195) passages.push(word);
    else passages[last] += ` ${word}`;
  }
  return passages.map((passage) => ({ title: chapter.title, text: passage, chapterIndex }));
}));

export function RulesBook() {
  const [page, setPage] = useState(0);
  const current = pages[page];
  return <article className={`${styles.content} ${styles.rules}`}>
    <div className={styles.rulesIntro}><p className={styles.eyebrow}>The little book of carrom</p><h1>A little aim.<br />A little wisdom.</h1><p className={styles.intro}>The familiar game,<br />one page at a time.</p><nav className={styles.chapters} aria-label="Rule chapters">{carromRules.map((chapter, i) => <button key={chapter.title} aria-current={current.chapterIndex === i ? "step" : undefined} onClick={() => setPage(pages.findIndex((entry) => entry.chapterIndex === i))}><span>0{i + 1}</span>{chapter.title}</button>)}</nav><Link className={styles.textButton} href="/carrom/play">Take a seat at the board<Icon name="arrow" /></Link></div>
    <div className={styles.rulePaper}><div className={styles.paperHeading}><span className={styles.eyebrow}>Chapter 0{current.chapterIndex + 1}</span><span>{page + 1} / {pages.length}</span></div><div className={styles.ruleArt} aria-hidden="true">{current.chapterIndex === 0 || current.chapterIndex === 1 ? <BoardArt aiming={current.chapterIndex === 1} /> : <Coin color={current.chapterIndex === 2 ? "queen" : current.chapterIndex === 3 ? "striker" : current.chapterIndex === 4 ? "cream" : "ink"} />}</div><div className={styles.ruleText} aria-live="polite" aria-atomic="true"><h2>{current.title}</h2><p>{current.text}</p></div><div className={styles.pagination}><button className={styles.iconButton} aria-label="Previous rule" disabled={page === 0} onClick={() => setPage(page - 1)}><Icon name="back" /></button><span>A LITTLE WISDOM, ONE PAGE AT A TIME</span><button className={styles.iconButton} aria-label="Next rule" disabled={page === pages.length - 1} onClick={() => setPage(page + 1)}><Icon name="arrow" /></button></div></div>
  </article>;
}
