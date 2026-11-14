import styles from "@/components/chess/chess.module.css";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
