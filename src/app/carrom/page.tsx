import type { Metadata } from "next";
import Link from "next/link";
import { BoardArt, Coin } from "@/components/carrom/board-art";
import { Icon } from "@/components/carrom/icons";
import { CarromNav, CarromFooter } from "@/components/carrom/shared";
import styles from "@/components/carrom/carrom.module.css";

export const metadata: Metadata = {
  title: "Carrom · One more round in the courtyard",
  description: "Play Carrom in an Indian courtyard. Practice, challenge the computer, or share one device with a friend. No account needed.",
  alternates: { canonical: "/carrom" },
  openGraph: { title: "Carrom | Vihar Games", url: "/carrom", description: "A familiar board. A little togetherness. Play Carrom in the courtyard." },
};

export default function CarromPage() {
  return <main id="main-content" className={`${styles.page} ${styles.landing}`}>
    <CarromNav home />
    <section className={styles.hero} aria-labelledby="carrom-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>The familiar sound of a family evening</p>
        <div className={styles.emblem} aria-hidden="true"><span /><Coin color="striker" /><span /></div>
        <h1 id="carrom-title" lang="hi">कैरम</h1>
        <p className={styles.englishTitle}>C A R R O M</p>
        <h2 lang="hi">एक निशाना। फिर एक और।</h2>
        <p className={styles.heroDescription}>A little aim. A little friendly rivalry.<br />Pull up a chair. The board is waiting.</p>
        <div className={styles.heroActions}>
          <Link className={styles.primary} href="/carrom/play"><Coin color="striker" /><span>Come, take a seat<small lang="hi">आइए, एक बाज़ी हो जाए</small></span><Icon name="arrow" /></Link>
          <Link className={styles.textButton} href="/carrom/how-to-play">How to play<Icon name="book" /></Link>
        </div>
        <p className={styles.previewNote}>Practice · Play the computer · Pass &amp; play</p>
      </div>
      <figure className={styles.heroBoard}><div className={styles.boardCaption}><span>THE FAMILY FAVOURITE</span><span>✦</span></div><BoardArt /><figcaption><span>NINE COINS EACH</span><i>✦</i><span>ONE SHARED QUEEN</span></figcaption></figure>
    </section>
    <CarromFooter />
  </main>;
}
