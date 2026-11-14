"use client";
import { useState } from "react";
import type { Match } from "@/games/chess/engine";
import { Icon } from "./icons";
import styles from "./chess.module.css";
export function MoveBook({ match }: { match: Match }) {
  const [back, setBack] = useState(0);
  const total = Math.ceil(match.notation.length / 2), lastPage = Math.max(0, Math.ceil(total / 4) - 1);
  const page = Math.max(0, lastPage - back), first = page * 4;
  return <div className={styles.moveBook} aria-label="Move history">
    <div className={styles.panelHeading}><h2>Move book</h2><span>{total ? `${total} moves` : "A fresh beginning"}</span></div>
    {!total ? <div className={styles.emptyBook}><Icon name="book" /><p>Every game begins<br />with a possibility.</p><span>WHITE MAKES THE FIRST MOVE</span></div> : <><table><thead><tr><th scope="col">#</th><th scope="col">White</th><th scope="col">Black</th></tr></thead><tbody>{Array.from({ length: Math.min(4, total - first) }, (_, row) => { const i = first + row; return <tr key={i}><th scope="row">{i + 1}.</th><td>{match.notation[i * 2]}</td><td>{match.notation[i * 2 + 1] ?? "—"}</td></tr>; })}</tbody></table><div className={styles.historyPages}><button className={styles.iconButton} aria-label="Earlier moves" disabled={page === 0} onClick={() => setBack(lastPage - page + 1)}><Icon name="back" /></button><span>{page + 1} / {lastPage + 1}</span><button className={styles.iconButton} aria-label="Later moves" disabled={page === lastPage} onClick={() => setBack(Math.max(0, back - 1))}><Icon name="arrow" /></button></div></>}
  </div>;
}
