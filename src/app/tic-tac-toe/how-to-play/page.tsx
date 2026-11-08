import type { Metadata } from "next";
import { NotebookFooter, NotebookNav } from "@/components/tic-tac-toe/notebook";
import { RulesNotebook } from "@/components/tic-tac-toe/rules-notebook";
import styles from "@/components/tic-tac-toe/notebook.module.css";

export const metadata: Metadata = {
  title: "How to play Tic Tac Toe",
  description: "Learn Tic Tac Toe in a few simple steps: take turns, make three in a row, and play another round in the notebook.",
  alternates: { canonical: "/tic-tac-toe/how-to-play" },
  robots: { index: true, follow: true },
};

export default function RulesPage() {
  return <main id="main-content" className={styles.page}>
    <NotebookNav rules />
    <RulesNotebook />
    <NotebookFooter />
  </main>;
}
