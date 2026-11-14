import type { Metadata } from "next";
import Link from "next/link";
import { CoverArt, Postmark } from "@/components/paperwing/art";
import { PaperwingNav, PaperwingFooter } from "@/components/paperwing/shared";
import styles from "@/components/paperwing/paperwing.module.css";

export const metadata: Metadata = { title: "Paperwing · A little paper. A lot of sky.", description: "Fly an original folded swallow through airmail gates. Standard and Practice, local saves, and a quiet personal best. No account needed.", alternates: { canonical: "/paperwing" }, openGraph: { title: "Paperwing | Vihar Games", description: "An airmail adventure, one small flap at a time.", url: "/paperwing" } };
export default function PaperwingPage() {
  return <main id="main-content" className={styles.page}><PaperwingNav />
    <section className={styles.hero} aria-labelledby="paperwing-title"><div className={styles.heroCopy}>
      <p className={styles.eyebrow}><span className={styles.inkDot} /> A SMALL ADVENTURE IN OPEN SKY</p>
      <h1 id="paperwing-title">A little paper.<br /><span>A lot of sky.</span></h1>
      <p className={styles.heroDescription}>One folded swallow. One more opening.<br />Find your rhythm, and see how far it takes you.</p>
      <div className={styles.heroActions}><Link className={styles.primary} href="/paperwing/play">Let&apos;s fly <span aria-hidden="true">↗</span></Link><Link className={styles.textButton} href="/paperwing/how-to-play">How to fly <span aria-hidden="true">→</span></Link></div>
      <p className={styles.heroNote}>SOLO PLAY <i /> STANDARD &amp; PRACTICE <i /> NO SIGN-UP</p>
    </div><figure className={styles.heroArt}><CoverArt /><Postmark /><figcaption>TO: ANYONE WHO COULD USE A LITTLE SKY</figcaption></figure></section>
    <PaperwingFooter />
  </main>;
}
