import localFont from "next/font/local";
import styles from "@/components/tic-tac-toe/notebook.module.css";

const notebookFont = localFont({ src: "../fonts/Caveat-Variable.ttf", variable: "--font-notebook", weight: "400 700", display: "swap" });

export default function TicTacToeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${notebookFont.variable} ${styles.shell}`}>{children}</div>;
}
