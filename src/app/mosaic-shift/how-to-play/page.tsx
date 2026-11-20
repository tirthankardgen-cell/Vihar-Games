import type { Metadata } from "next";
import Link from "next/link";
import { StudioNav, StudioFooter, MosaicPreview } from "@/components/mosaic-shift/shared";
import { RulesBook } from "@/components/mosaic-shift/rules-book";
import styles from "@/components/mosaic-shift/mosaic.module.css";
export const metadata: Metadata = { title: "How to play Mosaic Shift", description: "Sliding tile rules, hints, undo, local records, and Ceramic Studio controls.", alternates: { canonical: "/mosaic-shift/how-to-play" } };
export default function MosaicRulesPage() { return <main id="main-content" className={styles.page}><StudioNav><Link className={styles.textButton} href="/mosaic-shift/play">Play →</Link></StudioNav><div className={styles.rulesPage}><aside className={styles.rulesIntro}><p className={styles.eyebrow}>A FEW SIMPLE GUIDELINES</p><h1>Make room.<br />Find the pattern.</h1><MosaicPreview complete /></aside><RulesBook /></div><StudioFooter /></main>; }
