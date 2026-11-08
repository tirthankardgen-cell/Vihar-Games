"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { type Match, markForSeat } from "@/games/tic-tac-toe/engine";
import { DoodleMark, GridLines, WinningLine } from "./doodles";
import styles from "./notebook.module.css";

export function Board({ match, locked, lastMove, onMove }: { match: Match; locked: boolean; lastMove: number | null; onMove: (cell: number) => void }) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [animateGrid] = useState(() => match.board.every((cell) => cell === null));
  const [focused, setFocused] = useState(0);
  const firstEmpty = match.board.findIndex((cell) => cell === null);
  const tabbable = match.board[focused] === null ? focused : firstEmpty;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, cell: number) {
    const deltas: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
    if (!(event.key in deltas) && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    let next = event.key === "Home" ? 0 : event.key === "End" ? 8 : (cell + deltas[event.key] + 9) % 9;
    const delta = event.key === "End" || event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    for (let tries = 0; tries < 9 && match.board[next] !== null; tries += 1) next = (next + delta + 9) % 9;
    if (!locked && match.board[next] === null) { setFocused(next); buttons.current[next]?.focus(); }
  }

  return <div className={styles.board}>
    <div className={styles.boardSketch}>
      <div className={styles.boardRows} role="grid" aria-label="Tic Tac Toe board" aria-describedby="turn-status">
        {[0, 1, 2].map((row) => <div key={row} className={styles.boardRow} role="row">
          {[0, 1, 2].map((column) => {
            const cell = row * 3 + column;
            const mark = match.board[cell];
            return <button key={cell} ref={(element) => { buttons.current[cell] = element; }} type="button" role="gridcell"
              className={styles.cell} aria-label={`Row ${row + 1}, column ${column + 1}, ${mark ?? "empty"}`}
              disabled={locked || mark !== null} tabIndex={cell === tabbable && !locked ? 0 : -1}
              onFocus={() => setFocused(cell)} onKeyDown={(event) => navigate(event, cell)} onClick={() => onMove(cell)}>
              {mark && <DoodleMark mark={mark} variation={cell + match.round} animate={lastMove === cell} />}
            </button>;
          })}
        </div>)}
      </div>
      <GridLines animate={animateGrid} />
      {match.winner !== null && match.reason === "three-in-a-row" && <WinningLine line={match.line} mark={markForSeat(match, match.winner)} />}
    </div>
  </div>;
}
