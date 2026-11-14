import styles from "@/components/silk-trail/silk.module.css";
export default function SilkLayout({ children }: { children: React.ReactNode }) { return <div className={styles.shell}>{children}</div>; }
