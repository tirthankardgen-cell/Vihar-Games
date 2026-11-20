import type { Metadata } from "next";
import Link from "next/link";
import { WorkshopFooter, WorkshopNav } from "@/components/lantern-logic/shared";
import { RulesBook } from "@/components/lantern-logic/rules-book";
import styles from "@/components/lantern-logic/lantern.module.css";
export const metadata: Metadata = { title: "How to play Lantern Logic", description: "Ordered nonogram clues, mark tools, hints, checks, keyboard controls, zoom, and saved progress.", alternates: { canonical: "/lantern-logic/how-to-play" } };
export default function LanternRulesPage() { return <main id="main-content" className={styles.page}><WorkshopNav><Link className={styles.textButton} href="/lantern-logic/play">Enter the workshop →</Link></WorkshopNav><div className={styles.rulesPage}><div className={styles.rulesIntro}><p className={styles.eyebrow}>THE CRAFT, IN TWELVE LITTLE NOTES</p><h1>Let the numbers<br /><span>show the way.</span></h1><p>A few simple rules.<br />A picture waiting between them.</p></div><RulesBook /></div><WorkshopFooter /></main>; }
