"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ticTacToeRules } from "@/games/tic-tac-toe/rules";
import { Arrow, ButtonOutline } from "./doodles";
import styles from "./notebook.module.css";

const titles = ["Take turns.", "Make your mark.", "Three wins.", "A full page.", "One more round.", "Pass the notebook.", "Choose a challenge.", "Call it a round."];

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function pageSize() {
  if (window.innerHeight <= 620 || window.innerWidth <= 350) return 1;
  return window.innerWidth < 900 || window.innerHeight <= 800 ? 2 : 4;
}

export function RulesNotebook() {
  const count = useSyncExternalStore(subscribe, pageSize, () => 1);
  const [firstRule, setFirstRule] = useState(0);
  const start = Math.floor(firstRule / count) * count;
  const page = start / count + 1;
  const pages = Math.ceil(ticTacToeRules.length / count);

  return <section className={`${styles.content} ${styles.rulesContent}`}>
    <p className={`${styles.eyebrow} ${styles.rulesEyebrow}`}>A few little rules</p>
    <h1 className={styles.screenTitle}>A minute to learn. One more round to play.</h1>
    <div className={styles.rulesList} data-page-size={count}>{ticTacToeRules.map((rule, index) => <section key={rule} className={styles.rule} hidden={index < start || index >= start + count}>
      <span className={styles.ruleNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <div><h2>{titles[index]}</h2><p>{rule}</p></div>
    </section>)}</div>
    <nav className={styles.rulesPagination} aria-label="Rules pages">
      <button className={styles.textButton} type="button" disabled={start === 0} onClick={() => setFirstRule(start - count)}><Arrow back /> Previous</button>
      <span aria-live="polite" aria-atomic="true">Page {page} of {pages}</span>
      <button className={styles.textButton} type="button" disabled={start + count >= ticTacToeRules.length} onClick={() => setFirstRule(start + count)}>Next <Arrow /></button>
    </nav>
    <p className={styles.notice}>Private online rooms are coming soon. Computer play and pass-and-play are ready now.</p>
    <div className={styles.rulesActions}><Link href="/tic-tac-toe/play" className={styles.button}>Let&apos;s Play <Arrow /><ButtonOutline /></Link></div>
  </section>;
}
