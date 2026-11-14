import styles from "@/components/paperwing/paperwing.module.css";

export default function PaperwingLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
