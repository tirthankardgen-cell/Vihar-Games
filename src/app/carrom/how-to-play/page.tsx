import type { Metadata } from "next";
import { CarromNav, CarromFooter } from "@/components/carrom/shared";
import { RulesBook } from "@/components/carrom/rules-book";
import styles from "@/components/carrom/carrom.module.css";

export const metadata: Metadata = {
  title: "How to play Carrom",
  description: "Learn our casual carrom rules: striker placement, extra turns, queen cover, fouls, penalty debt, and the final coin. A little wisdom, one page at a time.",
  alternates: { canonical: "/carrom/how-to-play" },
};

export default function Page() {
  return <main id="main-content" className={styles.page}><CarromNav /><RulesBook /><CarromFooter /></main>;
}
