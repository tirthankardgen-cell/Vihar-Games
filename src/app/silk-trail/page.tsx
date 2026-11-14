import type { Metadata } from "next";
import Link from "next/link";
import { GardenArt } from "@/components/silk-trail/art";
import { SilkFooter, SilkNav } from "@/components/silk-trail/shared";
import styles from "@/components/silk-trail/silk.module.css";
export const metadata: Metadata = { title: "Silk Trail · A Silk Garden", description: "Guide a garden snake, gather mulberry leaves, and leave a little room to grow. Calm, Flow, and Swift, with keyboard and touch play and local saves.", alternates: { canonical: "/silk-trail" }, openGraph: { title: "Silk Trail | Vihar Games", description: "Follow a little green thread. An original illustrated silk garden.", url: "/silk-trail" } };
export default function SilkPage() {
  return <main id="main-content" className={styles.page}><SilkNav /><section className={styles.hero} aria-labelledby="silk-title"><div className={styles.heroCopy}><p className={styles.eyebrow}>A SMALL GARDEN. A GROWING THREAD.</p><h1 id="silk-title"><span>Silk </span><span>Trail</span></h1><p className={styles.tagline}>Leave a little room to grow.</p><p className={styles.heroDescription}>Gather a leaf. Take a turn.<br />Find your rhythm in a garden woven from silk.</p><div className={styles.actions}><Link className={styles.primary} href="/silk-trail/play">Enter the garden →</Link><Link className={styles.textButton} href="/silk-trail/how-to-play">How to play ↗</Link></div><p className={styles.heroNote}>CALM · FLOW · SWIFT / KEYBOARD & TOUCH / SAVED LOCALLY</p></div><GardenArt /></section><SilkFooter /></main>;
}
