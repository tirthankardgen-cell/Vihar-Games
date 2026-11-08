import Link from "next/link";
import { Arrow, ButtonOutline, DoodleMark, GridLines, WinningLine } from "./doodles";
import { NotebookFooter, NotebookNav } from "./notebook";
import styles from "./notebook.module.css";

const drawing = ["X", "O", null, null, "X", null, "O", null, "X"] as const;

export default function TicTacToeLanding() {
  return <main id="main-content" className={`${styles.page} ${styles.hero}`}>
    <NotebookNav />
    <section className={styles.heroBody} aria-labelledby="tic-tac-toe-title">
      <div>
        <p className={styles.eyebrow}>An old favourite. A fresh page.</p>
        <h1 id="tic-tac-toe-title" className={styles.heroTitle}>Tic Tac<br /><span>Toe.</span></h1>
        <p className={styles.heroLead}>A blank page. A friendly rivalry.</p>
        <p className={styles.heroCopy}>Play the computer, or pass the notebook to a friend. Three in a row is all it takes.</p>
        <div className={styles.heroActions}>
          <Link href="/tic-tac-toe/play" className={styles.button}>Let&apos;s Play <Arrow /><ButtonOutline /></Link>
        </div>
        <p className={styles.heroSmall}>No sign-up. Just X, O, and a little time.</p>
      </div>
      <div className={styles.heroArt} aria-hidden="true">
        <div className={styles.board}>
          <div className={styles.boardRows}>{[0, 1, 2].map((row) => <div key={row} className={styles.boardRow}>
            {drawing.slice(row * 3, row * 3 + 3).map((mark, column) => <div key={column} className={styles.staticCell}>{mark && <DoodleMark mark={mark} variation={row + column} animate />}</div>)}
          </div>)}</div>
          <GridLines animate /><WinningLine line={[0, 4, 8]} mark="X" />
        </div>
        <p className={styles.artCaption}>a little friendly competition <Arrow /></p>
      </div>
    </section>
    <NotebookFooter />
  </main>;
}
