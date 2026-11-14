"use client";
import { useState } from "react";
import Link from "next/link";
import { chessRules } from "@/games/chess/rules";
import { Piece } from "./pieces";
import { Icon } from "./icons";
import styles from "./chess.module.css";
const pages = chessRules.flatMap((section, sectionIndex) => section.items.map((text, itemIndex) => ({ title: section.title, text, sectionIndex, itemIndex })));
export function RulesBook() {
  const [page, setPage] = useState(0);
  const current = pages[page];
  return <article className={`${styles.content} ${styles.rules}`}>
    <div className={styles.rulesIntro}><p className={styles.eyebrow}>The little book of chess</p><h1>One move <br />at a time.</h1><p className={styles.intro}>A few simple ideas.<br />A lifetime of possibilities.</p><nav className={styles.ruleChapters} aria-label="Rule chapters">{chessRules.map((section, i) => <button key={section.title} aria-current={current.sectionIndex === i ? "step" : undefined} onClick={() => setPage(pages.findIndex((p) => p.sectionIndex === i))}><span>0{i + 1}</span>{section.title}</button>)}</nav><Link className={styles.textButton} href="/chess/play">Ready to play?<Icon name="arrow" /></Link></div>
    <div className={styles.rulePaper}><div className={styles.ruleTop}><span className={styles.eyebrow}>Chapter 0{current.sectionIndex + 1}</span><span>{page + 1} / {pages.length}</span></div><div className={styles.ruleArt} aria-hidden="true"><Piece type={(["k", "n", "r", "b", "p"] as const)[current.sectionIndex]} color="w" /></div><div className={styles.ruleText} aria-live="polite"><h2>{current.title}</h2><p>{current.text}</p></div><div className={styles.pagination}><button className={styles.iconButton} aria-label="Previous rule" disabled={page === 0} onClick={() => setPage(page - 1)}><Icon name="back" /></button><span>A LITTLE WISDOM, ONE PAGE AT A TIME</span><button className={styles.iconButton} aria-label="Next rule" disabled={page === pages.length - 1} onClick={() => setPage(page + 1)}><Icon name="arrow" /></button></div></div>
  </article>;
}
