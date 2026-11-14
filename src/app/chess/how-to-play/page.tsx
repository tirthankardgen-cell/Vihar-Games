import type { Metadata } from "next";
import { ChessNav, ChessFooter } from "@/components/chess/shared";
import { RulesBook } from "@/components/chess/rules-book";
import styles from "@/components/chess/chess.module.css";
export const metadata: Metadata = { title: "How to play Chess", description: "Learn chess moves, castling, en passant, promotion, checkmate, and the exact draw rules. Play a local game with Acharya Dev or a friend.", alternates: { canonical: "/chess/how-to-play" }, robots: { index: true, follow: true } };
export default function Page() {
  return <main id="main-content" className={styles.page}><ChessNav /><RulesBook /><ChessFooter /></main>;
}
