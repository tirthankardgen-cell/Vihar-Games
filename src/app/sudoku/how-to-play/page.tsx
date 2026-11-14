import type { Metadata } from "next";
import Link from "next/link";
import { JournalNav, JournalFooter } from "@/components/sudoku/shared";
import { RulesBook } from "@/components/sudoku/rules-book";
import styles from "@/components/sudoku/sudoku.module.css";
export const metadata: Metadata = { title: "How to play Sudoku", description: "Sudoku rules, keyboard controls, pencil notes, hints, checks, pause, local saves, and difficulty explained.", alternates: { canonical: "/sudoku/how-to-play" } };
export default function SudokuRulesPage() {
  return <main id="main-content" className={styles.page}><JournalNav><Link className={styles.textButton} href="/sudoku/play">Play Sudoku →</Link></JournalNav><div className={styles.rulesPage}><div className={styles.rulesIntro}><p className={styles.eyebrow}>A FEW NOTES BEFORE YOU BEGIN</p><h1>Small rules.<br /><span>Many possibilities.</span></h1><p>Turn a page.<br />Then make it your own.</p></div><RulesBook /></div><JournalFooter /></main>;
}
