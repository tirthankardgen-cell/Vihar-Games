import type { Metadata } from "next";
import Link from "next/link";
import { ticTacToeRules } from "@/games/tic-tac-toe/rules";
import { Arrow, ButtonOutline } from "@/components/tic-tac-toe/doodles";
import { NotebookFooter, NotebookNav } from "@/components/tic-tac-toe/notebook";
import styles from "@/components/tic-tac-toe/notebook.module.css";

export const metadata: Metadata = {
  title: "How to play Tic Tac Toe",
  description: "Learn Tic Tac Toe in a few simple steps: take turns, make three in a row, and play another round in the notebook.",
  alternates: { canonical: "/tic-tac-toe/how-to-play" },
  robots: { index: true, follow: true },
};

const titles = ["Take turns.", "Make your mark.", "Three wins.", "A full page.", "One more round.", "Pass the notebook.", "Choose a challenge.", "Call it a round."];

export default function RulesPage() {
  return <main id="main-content" className={styles.page}>
    <NotebookNav rules />
    <section className={`${styles.content} ${styles.rulesContent}`}>
      <p className={styles.eyebrow} style={{ textAlign: "center", marginBottom: 13 }}>A few little rules</p>
      <h1 className={styles.screenTitle}>A minute to learn. One more round to play.</h1>
      <div className={styles.rulesList}>{ticTacToeRules.map((rule, index) => <section key={rule} className={styles.rule}>
        <span className={styles.ruleNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div><h2>{titles[index]}</h2><p>{rule}</p></div>
      </section>)}</div>
      <p className={styles.notice}>Private online rooms are coming soon. Computer play and pass-and-play are ready now.</p>
      <div className={styles.rulesActions}><Link href="/tic-tac-toe/play" className={styles.button}>Let&apos;s Play <Arrow /><ButtonOutline /></Link></div>
    </section>
    <NotebookFooter />
  </main>;
}
