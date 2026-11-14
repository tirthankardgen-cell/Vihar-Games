import type { Metadata } from "next";
import Link from "next/link";
import { CoverArt } from "@/components/dune-dash/art";
import { DuneFooter, DuneNav } from "@/components/dune-dash/shared";
import styles from "@/components/dune-dash/dune-dash.module.css";

export const metadata: Metadata = { title: "Dune Dash · A little fox. A long horizon.", description: "Jump sandstone and duck beneath swifts in an original desert fox runner. Endless and Practice, local saves, and your own quiet best.", alternates: { canonical: "/dune-dash" }, openGraph: { title: "Dune Dash | Vihar Games", description: "An open horizon. A small desert explorer. Leave only little pawprints.", url: "/dune-dash" } };
export default function DuneDashPage() {
  return <main id="main-content" className={styles.page}><DuneNav />
    <section className={styles.hero} aria-labelledby="dune-title"><div className={styles.heroCopy}>
      <p className={styles.eyebrow}>FIELD NOTES FROM THE OPEN DESERT</p><h1 id="dune-title">A little fox.<br /><span>A long horizon.</span></h1>
      <p className={styles.heroDescription}>Light feet, long ears, and a trail of possibilities. Leap the stones. Let the swifts pass overhead.</p>
      <div className={styles.heroActions}><Link className={styles.primary} href="/dune-dash/play">Let&apos;s wander <span aria-hidden="true">↗</span></Link><Link className={styles.textButton} href="/dune-dash/how-to-play">Your field guide <span aria-hidden="true">→</span></Link></div>
      <p className={styles.heroNote}>SOLO PLAY · ENDLESS &amp; PRACTICE · NO SIGN-UP</p>
    </div><figure className={styles.heroArt}><CoverArt /></figure></section><DuneFooter />
  </main>;
}
