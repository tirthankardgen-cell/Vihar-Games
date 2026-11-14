import styles from "@/components/sudoku/sudoku.module.css";
export default function SudokuLayout({ children }: { children: React.ReactNode }) { return <div className={styles.shell}>{children}</div>; }
