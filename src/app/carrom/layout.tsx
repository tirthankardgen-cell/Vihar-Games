import styles from "@/components/carrom/carrom.module.css";

export default function CarromLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
