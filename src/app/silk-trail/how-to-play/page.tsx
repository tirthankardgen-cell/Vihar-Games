import type { Metadata } from "next";
import Link from "next/link";
import { RulesBook } from "@/components/silk-trail/rules-book";
import { SilkFooter, SilkNav } from "@/components/silk-trail/shared";
import styles from "@/components/silk-trail/silk.module.css";
export const metadata: Metadata = { title: "How to Play Silk Trail", description: "Read the exact Silk Trail rules: a 20 by 20 garden, leaves, turns, fixed speeds, pause, saves, and Garden complete.", alternates: { canonical: "/silk-trail/how-to-play" } };
export default function SilkRulesPage() { return <main id="main-content" className={styles.page}><SilkNav><Link className={styles.textButton} href="/silk-trail/play">Play Silk Trail →</Link></SilkNav><section className={styles.rulesPage}><div className={styles.rulesIntro}><p className={styles.eyebrow}>THE GARDEN GUIDE</p><h1>A little room<br />to understand.</h1><p>One leaf, one turn, one growing thread. A few short pages before you begin.</p><Link className={styles.primary} href="/silk-trail/play">Enter the garden →</Link></div><RulesBook /></section><SilkFooter /></main>; }
