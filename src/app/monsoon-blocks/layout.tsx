import styles from "@/components/monsoon-blocks/monsoon.module.css";
export default function MonsoonLayout({ children }: { children: React.ReactNode }) { return <div className={styles.shell}>{children}</div>; }
