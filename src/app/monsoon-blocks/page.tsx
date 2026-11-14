import type { Metadata } from "next";
import Link from "next/link";
import { RainWindowArt } from "@/components/monsoon-blocks/art";
import { MonsoonNav, MonsoonFooter } from "@/components/monsoon-blocks/shared";
import styles from "@/components/monsoon-blocks/monsoon.module.css";
export const metadata: Metadata = { title: "Monsoon Blocks · A Rain Window", description: "Arrange patterned glass shapes, clear rows, and find your rhythm. Original Rain Window artwork, Standard and Practice, local saves, and keyboard or touch play.", alternates: { canonical: "/monsoon-blocks" }, openGraph: { title: "Monsoon Blocks | Vihar Games", description: "A little calm between the drops. Seven shapes, a rain-washed window, and room to think.", url: "/monsoon-blocks" } };
export default function MonsoonPage() {
  return <main id="main-content" className={styles.page}><MonsoonNav /><section className={styles.hero} aria-labelledby="monsoon-title"><div className={styles.heroCopy}>
    <p className={styles.eyebrow}><span className={styles.rainDot} /> A SMALL CHALLENGE FOR A RAINY DAY</p><h1 id="monsoon-title"><span>Monsoon</span><span>Blocks</span></h1><p className={styles.heroTagline}>A little calm between the drops.</p><p className={styles.heroDescription}>Arrange the glass. Clear a row.<br />Find a quiet rhythm in a rain-washed window.</p><div className={styles.heroActions}><Link className={styles.primary} href="/monsoon-blocks/play">Let it rain <span aria-hidden="true">→</span></Link><Link className={styles.textButton} href="/monsoon-blocks/how-to-play">How to play ↗</Link></div><p className={styles.heroNote}>STANDARD & PRACTICE · KEYBOARD & TOUCH · SAVED LOCALLY</p>
  </div><RainWindowArt /></section><MonsoonFooter /></main>;
}
