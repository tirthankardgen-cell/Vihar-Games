"use client";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { getPuzzle, lines, type Mark, type Run } from "@/games/lantern-logic/engine";
import styles from "./lantern.module.css";
export type Tool = Mark | "select";
export const markLabels = ["Unknown", "Lit", "Empty"];
export function LanternBoard({ run, selected, onSelect, tool, zoom, checked, onPaint, onUndo, onRedo }: { run: Run; selected: number; onSelect: (i: number) => void; tool: Tool; zoom: boolean; checked: boolean; onPaint: (indices: number[], mark: Mark) => void; onUndo: () => void; onRedo: () => void }) {
  const p = getPuzzle(run.puzzleId)!, states = lines(run), scroller = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; indices: Set<number>; mark: Mark } | null>(null), [draft, setDraft] = useState<{ indices: Set<number>; mark: Mark } | null>(null);
  const rowWidth = Math.max(...p.rows.map((a) => a.length)) * 14 + 16, headerHeight = Math.max(...p.columns.map((a) => a.length)) * 17 + 14;
  const css = { "--size": p.size, "--gutter": `${rowWidth}px`, "--header": `${headerHeight}px`, "--column-count": Math.max(...p.columns.map((a) => a.length)) } as CSSProperties;
  const focus = (i: number) => { onSelect(i); scroller.current?.querySelector<HTMLButtonElement>(`[data-cell="${i}"]`)?.focus({ preventScroll: true }); scroller.current?.querySelector(`[data-cell="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" }); };
  const key = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const row = Math.floor(i / p.size), col = i % p.size;
    const next = e.key === "ArrowLeft" ? row * p.size + Math.max(0, col - 1) : e.key === "ArrowRight" ? row * p.size + Math.min(p.size - 1, col + 1) : e.key === "ArrowUp" ? Math.max(0, row - 1) * p.size + col : e.key === "ArrowDown" ? Math.min(p.size - 1, row + 1) * p.size + col : null;
    if (next !== null) { e.preventDefault(); focus(next); }
    else if (e.key === " " || e.key.toLowerCase() === "x" || e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); onPaint([i], e.key === " " ? 1 : e.key.toLowerCase() === "x" ? 2 : 0); }
    else if ((e.ctrlKey || e.metaKey) && ["z", "y"].includes(e.key.toLowerCase())) { e.preventDefault(); if (e.shiftKey || e.key.toLowerCase() === "y") onRedo(); else onUndo(); }
    else if (e.key === "Enter") { e.preventDefault(); if (tool !== "select") onPaint([i], tool); }
  };
  const start = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    if (e.button !== 0 || !e.isPrimary) return;
    onSelect(i);
    if (tool === "select") return;
    e.preventDefault(); e.currentTarget.focus({ preventScroll: true });
    gesture.current = { id: e.pointerId, indices: new Set([i]), mark: tool };
    setDraft({ indices: new Set([i]), mark: tool }); scroller.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current; if (!g || g.id !== e.pointerId) return;
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-cell]");
    if (!hit || !scroller.current?.contains(hit)) return;
    const i = Number(hit.dataset.cell); if (g.indices.has(i)) return;
    g.indices.add(i); onSelect(i); setDraft({ indices: new Set(g.indices), mark: g.mark });
  };
  const finish = (e: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const g = gesture.current; if (!g || g.id !== e.pointerId) return;
    gesture.current = null; setDraft(null); if (scroller.current?.hasPointerCapture(e.pointerId)) scroller.current.releasePointerCapture(e.pointerId);
    if (!cancelled) { focus([...g.indices].at(-1)!); onPaint([...g.indices], g.mark); }
  };
  return <div className={styles.boardArea} style={css}><div ref={scroller} className={`${styles.boardScroller} ${tool === "select" ? styles.pan : styles.paint}`} onPointerMove={move} onPointerUp={(e) => finish(e)} onPointerCancel={(e) => finish(e, true)} onLostPointerCapture={(e) => finish(e, true)} data-zoom={zoom || undefined}>
    <div className={styles.puzzleGrid} role="group" aria-label={`${p.size} by ${p.size} puzzle board. Arrow keys navigate, Space lights, X marks Empty, Delete erases.`}>
      <div className={styles.corner} aria-hidden="true"><span>COL ↓</span><span>ROW →</span></div>
      {p.columns.map((clue, c) => <div key={`c${c}`} className={`${styles.columnClue} ${states.columns[c] === "satisfied" ? styles.satisfied : ""} ${checked && states.columns[c] === "contradictory" ? styles.contradiction : ""}`} aria-label={`Column ${c + 1}, clues ${clue.join(", ")}${checked && states.columns[c] === "contradictory" ? ", contradictory" : ""}`}>{clue.map((n, j) => <span key={j}>{n}</span>)}</div>)}
      {p.rows.map((clue, r) => <div key={`r${r}`} className={styles.gridRow}><div className={`${styles.rowClue} ${states.rows[r] === "satisfied" ? styles.satisfied : ""} ${checked && states.rows[r] === "contradictory" ? styles.contradiction : ""}`} aria-label={`Row ${r + 1}, clues ${clue.join(", ")}${checked && states.rows[r] === "contradictory" ? ", contradictory" : ""}`}>{clue.map((n, j) => <span key={j}>{n}</span>)}</div>{Array.from({ length: p.size }, (_, c) => { const i = r * p.size + c, value = draft?.indices.has(i) ? draft.mark : run.cells[i]; return <button key={i} data-cell={i} data-mark={value} data-selected={i === selected || undefined} tabIndex={i === selected ? 0 : -1} className={`${styles.cell} ${(c + 1) % 5 === 0 ? styles.fifthColumn : ""} ${(r + 1) % 5 === 0 ? styles.fifthRow : ""}`} aria-label={`Row ${r + 1}, column ${c + 1}, ${markLabels[value]}${i === selected ? ", selected" : ""}`} onFocus={() => onSelect(i)} onPointerDown={(e) => start(e, i)} onKeyDown={(e) => key(e, i)} onClick={(e) => { if (e.detail === 0 && tool !== "select") onPaint([i], tool); }}>{value === 2 ? <span aria-hidden="true">×</span> : value === 1 ? <span className={styles.glint} aria-hidden="true" /> : null}</button>; })}</div>)}
    </div></div></div>;
}
