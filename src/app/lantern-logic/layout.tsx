import styles from "@/components/lantern-logic/lantern.module.css";
export default function LanternLayout({ children }: { children: React.ReactNode }) { return <div className={styles.shell}>{children}</div>; }
