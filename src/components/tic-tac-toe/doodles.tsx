import type { Mark } from "@/games/tic-tac-toe/engine";
import styles from "./notebook.module.css";

const crosses = [
  ["M22 20 C32 35 43 40 49 50 S66 67 80 76", "M74 22 C66 31 54 44 48 53 S32 70 20 81"],
  ["M25 26 C37 32 42 47 53 55 S65 70 74 79", "M79 19 C69 34 55 43 49 51 S35 62 26 76"],
  ["M20 23 C33 32 38 43 49 50 S70 67 78 73", "M72 20 C65 34 56 40 48 52 S30 74 22 79"],
  ["M28 18 C35 32 43 43 54 53 S68 66 77 80", "M80 27 C67 35 59 43 49 55 S33 70 20 74"],
  ["M21 28 C33 35 46 45 51 56 S68 73 75 81", "M76 19 C67 29 58 46 46 53 S33 65 24 77"],
];
const circles = [
  "M67 20 C53 12 34 18 26 33 C20 42 23 49 20 57 C18 72 34 83 48 79 C62 82 76 69 79 56 C84 42 76 25 67 20 C63 18 59 18 56 19",
  "M61 18 C43 15 26 28 25 43 C19 56 24 73 39 77 C48 83 66 78 73 65 C85 52 79 40 77 31 C75 22 66 16 58 18",
  "M73 29 C64 15 46 18 34 22 C23 27 21 43 24 54 C21 67 35 80 47 81 C64 83 77 72 76 60 C83 46 77 35 73 29 C70 24 66 22 63 22",
  "M66 22 C50 14 37 22 29 32 C21 38 19 51 24 62 C27 76 39 84 54 78 C69 79 81 68 78 51 C82 37 75 26 66 22 C62 20 58 19 54 21",
  "M62 19 C46 13 29 25 24 39 C18 50 24 61 27 70 C35 81 51 81 65 76 C78 69 80 55 76 43 C78 29 71 21 62 19 C57 18 52 20 48 22",
];

export function DoodleMark({ mark, variation = 0, animate = false }: { mark: Mark; variation?: number; animate?: boolean }) {
  const paths = mark === "X" ? crosses[variation % crosses.length] : [circles[variation % circles.length]];
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={`${styles.mark} ${mark === "X" ? styles.markX : styles.markO} ${animate ? styles.drawMark : ""}`}>
    {paths.map((path, index) => <path key={path} d={path} pathLength="1" strokeWidth={mark === "X" ? index === 0 ? 4.7 : 5.1 : 4.8} />)}
  </svg>;
}

export function GridLines({ animate = false }: { animate?: boolean }) {
  return <svg viewBox="0 0 300 300" aria-hidden="true" className={`${styles.gridLines} ${animate ? styles.drawGrid : ""}`}>
    <path d="M103 11 C96 62 103 109 98 151 S98 243 105 289" pathLength="1" strokeWidth="2.4" />
    <path d="M205 15 C198 69 205 111 200 158 S203 246 197 286" pathLength="1" strokeWidth="2.2" />
    <path d="M12 98 C62 103 107 95 153 101 S239 99 287 105" pathLength="1" strokeWidth="2.3" />
    <path d="M16 203 C62 198 105 205 155 200 S241 204 290 197" pathLength="1" strokeWidth="2.5" />
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
