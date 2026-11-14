import type { Metadata } from "next";
import Link from "next/link";
import { ChessNav, ChessFooter } from "@/components/chess/shared";
import { Icon } from "@/components/chess/icons";
import { Piece } from "@/components/chess/pieces";
import styles from "@/components/chess/chess.module.css";

export const metadata: Metadata = { title: "Chess · A game in the courtyard", description: "Play untimed chess with Acharya Dev or a friend. Three computer levels, classic rules, and a warm Indian courtyard. No account needed.", alternates: { canonical: "/chess" }, openGraph: { title: "Chess | Vihar Games", url: "/chess", description: "Sixty-four squares. A little time together." } };
export default function ChessPage() {
  return <main id="main-content" className={`${styles.page} ${styles.landing}`}><ChessNav home />
    <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.eyebrow}>The courtyard is yours. Take your time.</p><div className={styles.heroEmblem} aria-hidden="true"><span /><Piece type="n" color="w" /><span /></div><h1 lang="hi">शतरंज</h1><p className={styles.englishTitle}>C H E S S</p><h2 lang="hi">एक चाल। अनगिनत कहानियाँ।</h2><p>A quiet courtyard. A thoughtful rival.<br />Sixty-four squares to make your own.</p><div className={styles.actions}><Link className={styles.primary} href="/chess/play"><span>Come, play a game<small lang="hi">आइए, एक बाज़ी हो जाए</small></span><Icon name="arrow" /></Link><Link className={styles.textButton} href="/chess/how-to-play">How to play<Icon name="book" /></Link></div><div className={styles.heroDetails}><span>COMPUTER</span><i>✦</i><span>PASS &amp; PLAY</span><i>✦</i><span>NO CLOCK</span></div></div></section><ChessFooter />
  </main>;
}
