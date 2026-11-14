import type { Metadata } from "next";
import Link from "next/link";
import { DuneFooter, DuneNav } from "@/components/dune-dash/shared";
import { RulesBook } from "@/components/dune-dash/rules-book";
import styles from "@/components/dune-dash/dune-dash.module.css";

export const metadata: Metadata = { title: "Dune Dash field guide", description: "Exact Dune Dash controls, collision rules, Endless and Practice, pause, saves and personal records.", alternates: { canonical: "/dune-dash/how-to-play" } };
export default function DuneDashRulesPage() {
  return <main id="main-content" className={styles.page}><DuneNav><Link className={styles.textButton} href="/dune-dash/play">Let&apos;s wander ↗</Link></DuneNav>
    <section className={styles.rulesPage} aria-labelledby="rules-title"><div className={styles.rulesIntro}><p className={styles.eyebrow}>A FEW NOTES FOR THE TRAIL</p><h1 id="rules-title">Know the desert.<br /><span>Find your stride.</span></h1><p>Turn the field notes.<br />Then leave a few pawprints of your own.</p></div><RulesBook /></section><DuneFooter />
  </main>;
}
