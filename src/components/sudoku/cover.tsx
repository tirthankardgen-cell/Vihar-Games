import styles from "./sudoku.module.css";
// Live numerals and planar linework; the cover is a miniature journal page.
const example = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
export function JournalCover() {
  return <figure className={styles.cover} aria-label="A ruled Sudoku page with graphite clues, blue ink and pencil notes">
    <div className={styles.coverHeading}><span>DAILY MOMENTS</span><span>№ 009</span></div>
    <div className={styles.coverGrid} aria-hidden="true">{[...example].map((v, i) => <span key={i} className={`${styles.coverCell} ${i === 2 || i === 11 ? styles.coverBlue : ""}`}>{v !== "0" ? v : i === 2 ? "4" : i === 11 ? "2" : i === 3 ? <small>2 · 6</small> : ""}</span>)}</div>
    <figcaption><span className={styles.handNote}>one square at a time.</span><span className={styles.coverStamp}>9 ROWS<br />9 COLUMNS<br />ONE QUIET MOMENT</span></figcaption>
  </figure>;
}
