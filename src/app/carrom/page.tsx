import type { Metadata } from "next";
import Link from "next/link";
import { BoardArt, Coin } from "@/components/carrom/board-art";
import { Icon } from "@/components/carrom/icons";
import { CarromNav, CarromFooter } from "@/components/carrom/shared";
import styles from "@/components/carrom/carrom.module.css";

export const metadata: Metadata = {
  title: "Carrom · The Veranda Club",
  description: "Pull up a chair at the Veranda Club. Practice Carrom, challenge Ravi, or share a board with a friend. No account needed.",
  alternates: { canonical: "/carrom" },
  openGraph: { title: "Carrom | Vihar Games", url: "/carrom", description: "A familiar board. A friendly rival. One more evening at the Veranda Club." },
};

export default function CarromPage() {
  return <main id="main-content" className={`${styles.page} ${styles.landing}`}>
    <CarromNav home />
    <section className={styles.hero} aria-labelledby="carrom-title">
      <div className={styles.heroCopy}>
        <p className={styles.heroEyebrow}><span aria-hidden="true" />GOOD EVENINGS START HERE</p>
        <div className={styles.emblem} aria-hidden="true"><span /><Coin color="striker" /><span /></div>
        <h1 id="carrom-title" lang="hi">कैरम</h1>
        <p className={styles.englishTitle}>C A R R O M</p>
        <h2 lang="hi">एक निशाना। फिर एक और।</h2>
        <p className={styles.heroDescription}>The click of a coin. The comfort of good company.<br />Your favourite evening, one shot at a time.</p>
        <div className={styles.heroActions}>
          <Link className={styles.primary} href="/carrom/play"><Coin color="striker" /><span>Come, take a seat<small lang="hi">आइए, एक बाज़ी हो जाए</small></span><Icon name="arrow" /></Link>
        </div>
        <p className={styles.previewNote}><Icon name="people" />Solo, with Ravi, or with a friend <span>·</span> No sign-up</p>
      </div>
      <figure className={styles.heroBoard}><div className={styles.boardCaption}><span>A CLASSIC, IN GOOD COMPANY</span><Icon name="spark" /></div><BoardArt /><figcaption><span>NINE COINS EACH</span><i>✦</i><span>ONE SHARED QUEEN</span></figcaption><div className={styles.boardSeal} aria-hidden="true"><Coin color="queen" /><span>Little rivalries.<br /><strong>Lovely evenings.</strong></span></div></figure>
    </section>
    <CarromFooter />
  </main>;
}
