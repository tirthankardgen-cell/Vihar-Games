"use client";

import { useEffect, useRef } from "react";
import { conflicts, noteDigits, related, values, type Run } from "@/games/sudoku/engine";
import styles from "./sudoku.module.css";

export function SudokuBoard({ run, selected, onSelect, onDigit, onNotes, onUndo, onRedo, zoomed = false }: {
  run: Run; selected: number; onSelect: (i: number) => void; onDigit: (d: number) => void;
  onNotes: () => void; onUndo: () => void; onRedo: () => void; zoomed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null), board = values(run);
  const selectedValue = board[selected];
  useEffect(() => {
    if (zoomed) ref.current?.querySelector(`[data-cell="${selected}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selected, zoomed]);
  const move = (i: number) => { onSelect(i); ref.current?.querySelector<HTMLButtonElement>(`[data-cell="${i}"]`)?.focus({ preventScroll: true }); };
  return <div ref={ref} className={`${styles.board} ${zoomed ? styles.zoomed : ""}`} role="grid" aria-label="Sudoku puzzle, nine rows and nine columns" aria-rowcount={9} aria-colcount={9} onKeyDown={(e) => {
    const modified = e.ctrlKey || e.metaKey;
    if (modified && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) onRedo(); else onUndo(); return; }
    if (modified && e.key.toLowerCase() === "y") { e.preventDefault(); onRedo(); return; }
    if (modified || e.altKey) return;
    const row = Math.floor(selected / 9), col = selected % 9;
    const moves: Record<string, number> = { ArrowLeft: row * 9 + Math.max(0, col - 1), ArrowRight: row * 9 + Math.min(8, col + 1), ArrowUp: Math.max(0, row - 1) * 9 + col, ArrowDown: Math.min(8, row + 1) * 9 + col, Home: row * 9, End: row * 9 + 8 };
    if (e.key in moves) { e.preventDefault(); move(moves[e.key]); }
    else if (/^[1-9]$/.test(e.key)) { e.preventDefault(); onDigit(Number(e.key)); }
    else if (["0", "Delete", "Backspace"].includes(e.key)) { e.preventDefault(); onDigit(0); }
    else if (e.key.toLowerCase() === "n") { e.preventDefault(); onNotes(); }
  }}>
    {Array.from({ length: 9 }, (_, row) => <div key={row} role="row" className={styles.boardRow}>
      {Array.from({ length: 9 }, (_, col) => {
        const i = row * 9 + col, cell = run.cells[i], fixed = run.puzzle.clues[i] !== "0", bad = conflicts(run, i), checked = run.checked.includes(i), notes = noteDigits(cell.notes);
        const label = `Row ${row + 1}, column ${col + 1}, ${fixed ? `fixed clue ${board[i]}` : cell.value ? `entry ${cell.value}` : notes.length ? `notes ${notes.join(", ")}` : "empty, editable"}${bad.length ? `; repeated in ${bad.join(", ")}` : ""}${checked ? "; checked incorrect" : ""}${cell.hinted ? "; supplied by hint" : ""}`;
        return <div key={i} role="gridcell" aria-selected={selected === i} aria-readonly={fixed || run.status !== "active"} aria-rowindex={row + 1} aria-colindex={col + 1} className={styles.gridCell}>
          <button data-cell={i} tabIndex={selected === i ? 0 : -1} aria-label={label} onClick={() => onSelect(i)} className={[styles.cell, fixed ? styles.fixed : styles.entry, selected === i ? styles.selected : related(i, selected) ? styles.related : "", selectedValue && selectedValue === board[i] ? styles.matching : "", bad.length ? styles.conflict : "", checked ? styles.checked : ""].join(" ")}>
            {board[i] ? <span className={styles.numeral}>{board[i]}</span> : <span className={styles.notes} aria-hidden="true">{Array.from({ length: 9 }, (_, n) => <span key={n}>{cell.notes & (1 << n) ? n + 1 : ""}</span>)}</span>}
            {cell.hinted && <span className={styles.hintMark} aria-hidden="true">H</span>}
            {checked && <span className={styles.checkMark} aria-hidden="true">!</span>}
          </button>
        </div>;
      })}
    </div>)}
  </div>;
}
