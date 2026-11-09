import Link from "next/link";
import { Arrow, DoodleMark } from "./doodles";
import styles from "./notebook.module.css";

export function NotebookNav({ rules = false, controls, embedded = false }: { rules?: boolean; controls?: React.ReactNode; embedded?: boolean }) {
  return <header className={styles.nav}>
    {!embedded && <Link href="/" className={`${styles.navLink} ${styles.navBrand}`} aria-label="Vihar Games home">
      <span className={styles.tinyMarks} aria-hidden="true"><DoodleMark mark="X" /><DoodleMark mark="O" /></span>
      <span>Vihar Games</span>
    </Link>}
    {controls}
    <Link className={styles.navLink} href={rules ? "/tic-tac-toe" : "/tic-tac-toe/how-to-play"} target={embedded ? "_blank" : undefined} rel={embedded ? "noopener noreferrer" : undefined}>
      {rules ? <><Arrow back /> Back to notebook</> : <>How to play <Arrow /></>}
    </Link>
  </header>;
}

export function NotebookFooter() {
  return <footer className={styles.footer}><span>A little play. A little togetherness.</span><span>one more round?</span></footer>;
}

export function Steps({ step }: { step: 1 | 2 | 3 }) {
  return <ol className={styles.steps} aria-label="Game setup progress">
    {["Choose", "Set up", "Play"].map((name, index) => <li key={name} className={step === index + 1 ? styles.currentStep : ""} aria-current={step === index + 1 ? "step" : undefined}>
      <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>{name}
    </li>)}
  </ol>;
}
