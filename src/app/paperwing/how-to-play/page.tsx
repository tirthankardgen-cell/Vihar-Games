import type { Metadata } from "next";
import Link from "next/link";
import { PaperwingNav, PaperwingFooter } from "@/components/paperwing/shared";
import { RulesBook } from "@/components/paperwing/rules-book";
import styles from "@/components/paperwing/paperwing.module.css";

export const metadata: Metadata = { title: "How to fly Paperwing", description: "Exact Paperwing rules, controls, Standard and Practice modes, pause, saves, and local records.", alternates: { canonical: "/paperwing/how-to-play" } };
export default function PaperwingRulesPage() {
  return <main id="main-content" className={styles.page}><PaperwingNav><Link className={styles.textButton} href="/paperwing/play">Let&apos;s fly ↗</Link></PaperwingNav>
    <section className={styles.rulesPage} aria-labelledby="rules-title"><div className={styles.rulesIntro}><p className={styles.eyebrow}>A FEW LINES BEFORE YOU FLY</p><h1 id="rules-title">Your field guide<br /><span>to a little sky.</span></h1><p>Turn the postcards.<br />Then try a flight of your own.</p></div><RulesBook /></section><PaperwingFooter />
  </main>;
}
