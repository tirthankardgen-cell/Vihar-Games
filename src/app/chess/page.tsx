import type { Metadata } from "next";
import Link from "next/link";
import { Piece } from "@/components/chess/pieces";
import type { PieceSymbol } from "@/games/chess/engine";
import styles from "@/components/chess/chess.module.css";

export const metadata: Metadata = { title: "Chess · A game in the courtyard", description: "Play untimed chess with Acharya Dev or a friend. Three computer levels, classic rules, and a warm Indian courtyard. No account needed.", alternates: { canonical: "/chess" }, openGraph: { title: "Chess | Vihar Games", url: "/chess", description: "Sixty-four squares. A little time together." } };
export default function ChessPage() {
  const back: PieceSymbol[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  return <main id="main-content" className={styles.page}>
    <nav className={styles.nav} aria-label="Chess navigation"><Link href="/">← The collection</Link><span lang="hi">विहार</span><Link href="/chess/how-to-play">How to play ↗</Link></nav>
    <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.eyebrow}>The courtyard is open</p><h1 lang="hi">शतरंज</h1><h2>A little thought.<br />A little togetherness.</h2><p>Pull up a chair. Meet an old favourite, one move at a time.</p><div className={styles.actions}><Link className={styles.primary} href="/chess/play">Let&apos;s play →</Link><Link className={styles.secondary} href="/chess/how-to-play">How to play</Link></div><p className={styles.small} style={{ color: "#dfcda7" }}>Chess · No clock. No account. Just play.</p></div>
      <div className={styles.heroArt} aria-hidden="true"><div className={styles.miniBoard}>{Array.from({ length: 64 }, (_, i) => { const row = Math.floor(i / 8), col = i % 8; const type = row === 0 || row === 7 ? back[col] : row === 1 || row === 6 ? "p" : null; return <span key={i} className={(row + col) % 2 ? styles.dark : styles.light}>{type && <Piece type={type} color={row < 2 ? "b" : "w"} />}</span>; })}</div><p>Sixty-four squares. Endless possibilities.</p></div>
    </section>
    <section className={styles.landingNotes} aria-label="Ways to enjoy chess"><div><h2>A thoughtful companion</h2><p>Meet Acharya Dev, your Vihar chess mentor. Start gently on Easy, settle into Medium, or take on Hard.</p></div><div><h2>A board for two</h2><p>Pass the device to a friend. Pick your sides, take your time, and enjoy the game together.</p></div><div><h2>Pick up where you left off</h2><p>Your local game waits on this device. Come back to the same pieces, the same opponent, your next move.</p></div></section>
  </main>;
}
