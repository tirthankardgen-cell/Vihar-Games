import type { Metadata } from "next";
import Link from "next/link";
import { MonsoonNav, MonsoonFooter } from "@/components/monsoon-blocks/shared";
import { RulesBook } from "@/components/monsoon-blocks/rules-book";
import { WindowMark } from "@/components/monsoon-blocks/art";
import styles from "@/components/monsoon-blocks/monsoon.module.css";
export const metadata: Metadata = { title: "How to Play Monsoon Blocks", description: "Learn Monsoon Blocks: seven-piece bags, clockwise rotation, hold, lock delay, row scoring, keyboard and touch controls, and Standard or Practice.", alternates: { canonical: "/monsoon-blocks/how-to-play" } };
export default function MonsoonRulesPage() {
  return <main id="main-content" className={styles.page}><MonsoonNav><Link className={styles.textButton} href="/monsoon-blocks/play">Play Monsoon Blocks →</Link></MonsoonNav><section className={styles.rulesPage}><div className={styles.rulesIntro}><span className={styles.brandMark}><WindowMark /></span><p className={styles.eyebrow}>THE RULES OF THE WINDOW</p><h1>A little room<br />for understanding.</h1><p>A few short pages. All the rules you need to find your rhythm.</p><Link className={styles.primary} href="/monsoon-blocks/play">Ready for the rain →</Link></div><RulesBook /></section><MonsoonFooter /></main>;
}
