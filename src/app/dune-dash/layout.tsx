import styles from "@/components/dune-dash/dune-dash.module.css";

export default function DuneDashLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
