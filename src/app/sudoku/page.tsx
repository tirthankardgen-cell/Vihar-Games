import type { Metadata } from "next";
import Link from "next/link";
import { JournalNav, JournalFooter } from "@/components/sudoku/shared";
import { JournalCover } from "@/components/sudoku/cover";
import styles from "@/components/sudoku/sudoku.module.css";
export const metadata: Metadata = { title: "Sudoku · The Puzzle Journal", description: "A quiet Sudoku journal. Play Easy, Medium, and Hard puzzles with pencil notes, hints, and local saves. No account needed.", alternates: { canonical: "/sudoku" }, openGraph: { title: "Sudoku | Vihar Games", description: "One square at a time. A little space for a clearer mind.", url: "/sudoku" } };
export default function SudokuPage() {
  return <main id="main-content" className={styles.page}><JournalNav />
    <section className={styles.hero} aria-labelledby="sudoku-title"><div className={styles.heroCopy}>
      <p className={styles.eyebrow}><span className={styles.inkDot} /> A QUIET CHALLENGE, JUST FOR YOU</p>
      <h1 id="sudoku-title">Sudoku<span>One square<br />at a time.</span></h1>
      <p className={styles.heroDescription}>A few numbers. A little possibility.<br />Find your focus in the pages of a puzzle journal.</p>
      <div className={styles.heroActions}><Link className={styles.primary} href="/sudoku/play">Open your journal <span aria-hidden="true">→</span></Link><Link className={styles.textButton} href="/sudoku/how-to-play">How to play ↗</Link></div>
      <p className={styles.heroNote}>EASY · MEDIUM · HARD <span /> SAVED ON THIS DEVICE</p>
    </div><JournalCover /></section><JournalFooter /></main>;
}
