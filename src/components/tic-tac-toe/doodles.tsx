import type { Mark } from "@/games/tic-tac-toe/engine";
import styles from "./notebook.module.css";

const crosses = [
  ["M25 24 Q45 46 77 76", "M76 23 Q47 51 24 78"],
  ["M23 27 Q48 47 75 77", "M77 25 Q51 46 27 76"],
  ["M27 22 Q49 49 78 73", "M73 24 Q48 49 23 77"],
];
const circles = [
  "M70 25 C51 13 26 26 23 49 C19 72 40 85 62 77 C85 69 86 40 70 25",
  "M68 22 C44 13 24 31 24 53 C23 75 48 85 67 72 C87 60 86 34 68 22",
  "M72 28 C53 12 28 23 23 44 C16 67 36 84 59 78 C81 74 87 45 72 28",
];

export function DoodleMark({ mark, variation = 0, animate = false }: { mark: Mark; variation?: number; animate?: boolean }) {
  const paths = mark === "X" ? crosses[variation % 3] : [circles[variation % 3]];
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={`${styles.mark} ${mark === "X" ? styles.markX : styles.markO} ${animate ? styles.drawMark : ""}`}>
    {paths.map((path) => <path key={path} d={path} pathLength="1" />)}
  </svg>;
}

export function GridLines({ animate = false }: { animate?: boolean }) {
  return <svg viewBox="0 0 300 300" aria-hidden="true" className={`${styles.gridLines} ${animate ? styles.drawGrid : ""}`}>
    <path d="M100 12 Q98 144 102 287" pathLength="1" />
    <path d="M201 14 Q198 160 200 288" pathLength="1" />
    <path d="M13 101 Q145 98 287 101" pathLength="1" />
    <path d="M12 201 Q157 198 288 202" pathLength="1" />
  </svg>;
}

export function WinningLine({ line, mark, animate = true }: { line: readonly number[]; mark: Mark; animate?: boolean }) {
  if (line.length !== 3) return null;
  const point = (cell: number) => ({ x: (cell % 3) * 100 + 50, y: Math.floor(cell / 3) * 100 + 50 });
  const start = point(line[0]);
  const end = point(line[2]);
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const dx = ((end.x - start.x) / length) * 28;
  const dy = ((end.y - start.y) / length) * 28;
  return <svg viewBox="0 0 300 300" aria-hidden="true" className={`${styles.winningLine} ${mark === "O" ? styles.winningLineO : ""} ${animate ? styles.drawWin : ""}`}>
    <path d={`M${start.x - dx} ${start.y - dy} Q${(start.x + end.x) / 2 + 1} ${(start.y + end.y) / 2 - 1} ${end.x + dx} ${end.y + dy}`} pathLength="1" />
  </svg>;
}

export function Arrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 32 22" aria-hidden="true" className={`${styles.arrow} ${back ? styles.backArrow : ""}`}><path d="M2 11 Q16 10 29 11 M21 3 L29 11 L21 19" /></svg>;
}

export function ButtonOutline() {
  return <svg viewBox="0 0 200 52" preserveAspectRatio="none" aria-hidden="true" className={styles.buttonOutline}>
    <path d="M5 3 Q97 1 196 4 L197 48 Q98 51 4 48 L3 4 L8 3" vectorEffect="non-scaling-stroke" />
  </svg>;
}
