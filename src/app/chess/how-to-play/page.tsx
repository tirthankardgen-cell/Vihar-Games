import type { Metadata } from "next";
import Link from "next/link";
import { ChessNav } from "@/components/chess/shared";
import { chessRules } from "@/games/chess/rules";
import styles from "@/components/chess/chess.module.css";
export const metadata: Metadata = { title: "How to play Chess", description: "Learn chess moves, castling, en passant, promotion, checkmate, and the exact draw rules. Play a local game with Acharya Dev or a friend.", alternates: { canonical: "/chess/how-to-play" }, robots: { index: true, follow: true } };
export default function Page() {
  return <main id="main-content" className={styles.page}><ChessNav /><article className={`${styles.content} ${styles.rules}`}><p className={styles.eyebrow}>A familiar game, a fresh beginning</p><h1>One move at a time.</h1><p className={styles.intro}>Protect your king. Look after your pieces. Find the move that changes everything.</p>{chessRules.map((section) => <section className={styles.ruleSection} key={section.title}><h2>{section.title}</h2><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}<Link className={styles.primary} href="/chess/play">Ready? Let&apos;s play →</Link></article></main>;
}
