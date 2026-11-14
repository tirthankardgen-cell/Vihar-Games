"use client";

import { useId } from "react";
import { ghostPiece, HIDDEN, masks, pieceCells, SHAPES, type Cell, type Run, type Shape } from "@/games/monsoon-blocks/engine";
import styles from "./monsoon.module.css";

export const colours: Record<Shape, string> = { I: "#5D8195", O: "#C39551", T: "#806A85", J: "#526D84", L: "#B88067", S: "#619787", Z: "#A78481" };
export function WindowMark() {
  return <svg viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M6 42V20a14 14 0 0 1 28 0v22H6Z" stroke="currentColor" strokeWidth="1.4" /><path d="M20 7v35M6 25h28" stroke="currentColor" strokeWidth="1" /><path d="M12 16v3m14-5v3M12 31v4m15-5v3" stroke="#5D8195" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function Patterns({ id }: { id: string }) {
  return <defs>{SHAPES.map((shape, index) => <pattern key={shape} id={`${id}-${shape}`} width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill={colours[shape]} />
    <g fill="none" stroke="#263B49" strokeWidth=".65" opacity=".36">
      {index === 0 && <path d="m-2 2 4-4m-2 10 8-8m-2 10 4-4" />}
      {index === 1 && <><circle cx="2" cy="2" r=".6" /><circle cx="6" cy="6" r=".6" /></>}
      {index === 2 && <path d="M0 2h8M0 6h8" />}
      {index === 3 && <path d="m4 1 3 3-3 3-3-3Z" />}
      {index === 4 && <path d="M2 0v8M6 0v8" />}
      {index === 5 && <path d="M2 4h4M4 2v4" />}
      {index === 6 && <path d="m0 0 8 8m-4-4 4-4m-4 12 8-8" />}
    </g>
  </pattern>)}</defs>;
}
function SwatchCells({ cells, shape, id, size = 10, offsetX = 0, offsetY = 0 }: { cells: readonly Cell[]; shape: Shape; id: string; size?: number; offsetX?: number; offsetY?: number }) {
  return <g>{cells.map(({ x, y }) => <rect key={`${x},${y}`} x={x * size + offsetX + .35} y={y * size + offsetY + .35} width={size - .7} height={size - .7} rx=".35" fill={`url(#${id}-${shape})`} stroke="#263B49" strokeWidth=".6" />)}</g>;
}
export function ShapePreview({ shape, className }: { shape: Shape | null; className?: string }) {
  const id = useId().replaceAll(":", "");
  return <svg className={className ?? styles.preview} viewBox="0 0 48 28" role="img" aria-label={shape ? `${shape} shape` : "Hold is empty"}>
    <Patterns id={id} />
    {shape ? <SwatchCells cells={masks[shape]} shape={shape} id={id} offsetX={(48 - (Math.max(...masks[shape].map((c) => c.x)) + 1) * 10) / 2} offsetY={(28 - (Math.max(...masks[shape].map((c) => c.y)) + 1) * 10) / 2} /> : <path d="M20 14h8" stroke="#5D8195" strokeDasharray="2 2" />}
  </svg>;
}
export function RainWindowArt({ small = false }: { small?: boolean }) {
  const id = useId().replaceAll(":", "");
  const arranged: { shape: Shape; x: number; y: number }[] = [
    { shape: "I", x: 144, y: 106 }, { shape: "O", x: 84, y: 168 }, { shape: "T", x: 224, y: 159 },
    { shape: "J", x: 122, y: 244 }, { shape: "L", x: 254, y: 244 }, { shape: "S", x: 67, y: 323 }, { shape: "Z", x: 198, y: 330 },
  ];
  return <figure className={small ? styles.smallArt : styles.windowArt}>
    <svg viewBox="0 0 420 470" aria-label="Seven patterned glass shapes arranged beneath a simple rain-window arch" role="img">
      <Patterns id={id} />
      <g stroke="#5D8195" strokeWidth="1" opacity=".35" strokeLinecap="round"><path d="M14 118v19m13 58v28M386 123v21M401 227v18M13 309v16M389 350v29M350 45v13M51 49v20M364 82v13" /></g>
      <path d="M44 418V181C44 88 118 27 210 27s166 61 166 154v237H44Z" fill="#E5EBE5" fillOpacity=".52" stroke="#798D94" strokeWidth="1.4" />
      <path d="M56 406V181C56 95 126 39 210 39s154 56 154 142v225H56Z" fill="none" stroke="#A6B4B3" strokeWidth=".7" />
      <g stroke="#A6B4B3" strokeWidth=".7"><path d="M210 40v366M56 221h308" /></g>
      <g stroke="#5D8195" strokeWidth=".7" opacity=".3"><path d="M78 120v13m252-21v10M196 70v9M87 275v10m244-4v14M173 390v7" /></g>
      {arranged.map(({ shape, x, y }) => <SwatchCells key={shape} shape={shape} cells={masks[shape]} id={id} size={22} offsetX={x} offsetY={y} />)}
      <path d="M32 429h356M85 444h250" fill="none" stroke="#798D94" strokeWidth="1.1" />
    </svg><figcaption>SEVEN SHAPES. A LITTLE ROOM TO BREATHE.</figcaption>
  </figure>;
}
export function WindowBoard({ run, quiet = false }: { run: Run; quiet?: boolean }) {
  const id = useId().replaceAll(":", "");
  const ghost = pieceCells(ghostPiece(run)).filter((c) => c.y >= 0);
  const active = pieceCells(run.active).filter((c) => c.y >= 0);
  const skyline = Array.from({ length: 10 }, (_, x) => run.grid.slice(HIDDEN).findIndex((row) => row[x] !== null));
  return <svg className={styles.board} viewBox="0 0 100 200" role="img" aria-label={`Rain window: 10 columns, 20 rows. ${run.active.shape} active at column ${run.active.x + 1}, row ${run.active.y + 1}. ${run.rows} rows cleared. ${run.status === "ended" ? "Window full." : "The dashed outline shows the hard-drop landing."}`} data-board="monsoon" data-active-shape={run.active.shape} data-active-x={run.active.x} data-active-y={run.active.y} data-quiet={quiet || undefined}>
    <Patterns id={id} />
    <rect x=".35" y=".35" width="99.3" height="199.3" fill="#F3F4ED" stroke="#657C86" strokeWidth=".7" />
    <g stroke="#B9C7C6" strokeWidth=".35" opacity=".58">{Array.from({ length: 9 }, (_, i) => <path key={`x${i}`} d={`M${(i + 1) * 10} 0v200`} />)}{Array.from({ length: 19 }, (_, i) => <path key={`y${i}`} d={`M0 ${(i + 1) * 10}h100`} />)}</g>
    {run.grid.slice(HIDDEN).flatMap((row, y) => row.flatMap((shape, x) => shape ? <SwatchCells key={`${x},${y}`} shape={shape} cells={[{ x, y }]} id={id} /> : []))}
    {run.status === "playing" && <g fill="none" stroke="#263B49" strokeWidth=".8" strokeDasharray="1.4 1">{ghost.map(({ x, y }) => <rect key={`${x},${y}`} x={x * 10 + .9} y={y * 10 + .9} width="8.2" height="8.2" />)}</g>}
    <SwatchCells cells={active} shape={run.active.shape} id={id} />
    {run.status === "ended" && <g stroke="#263B49" strokeWidth="1">{skyline.map((y, x) => y >= 0 ? <path key={x} d={`M${x * 10 + 1} ${y * 10 + .8}h8`} /> : null)}</g>}
    {run.lastClear.length > 0 && <g key={run.placed} className={styles.rowWipe} fill="#EEE9DF">{run.lastClear.map((y) => <rect key={y} x="0" y={y * 10} width="100" height="10" />)}</g>}
  </svg>;
}
export function Icon({ name }: { name: "pause" | "play" | "rules" | "exit" | "sound" | "muted" | "music" | "rotate" | "hold" | "hard-drop" | "down" | "left" | "right" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "pause" && <path d="M8 5v14M16 5v14" />}
    {name === "play" && <path d="m8 5 11 7-11 7Z" />}
    {name === "rules" && <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" /><path d="M6 8h3m-3 4h3m6-4h3m-3 4h3" /></>}
    {name === "exit" && <path d="M10 5H5v14h5m4-12 5 5-5 5m-6-5h11" />}
    {(name === "sound" || name === "muted") && <><path d="m10 5-5 4H2v6h3l5 4V5Z" />{name === "sound" ? <path d="M14 8c2 2 2 6 0 8m4-11c4 4 4 10 0 14" /> : <path d="m15 9 6 6m0-6-6 6" />}</>}
    {name === "rotate" && <><path d="M18 7a8 8 0 1 0 2 8M18 3v5h-5" /></>}
    {name === "hold" && <><path d="M4 4h16v16H4Z" /><path d="M8 9v6m8-6v6M8 12h8" /></>}
    {name === "music" && <><path d="M9 18V6l11-3v12M9 9l11-3" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="15" rx="3" ry="2" /></>}
    {name === "hard-drop" && <path d="M12 3v12m-5-5 5 5 5-5M4 20h16" />}
    {name === "down" && <path d="M12 4v16m-6-6 6 6 6-6" />}
    {name === "left" && <path d="M20 12H4m6-6-6 6 6 6" />}
    {name === "right" && <path d="M4 12h16m-6-6 6 6-6 6" />}
  </svg>;
}
