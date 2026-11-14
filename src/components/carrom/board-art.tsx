import styles from "./carrom.module.css";
import { boardEdge, boardFarEdge, pockets, pocketRadius } from "@/games/carrom/geometry";

export function Coin({ color = "cream" }: { color?: "cream" | "ink" | "queen" | "striker" }) {
  const fill = { cream: "#fff1ce", ink: "#293d35", queen: "#a83538", striker: "#dfb36d" }[color];
  return <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill={fill} stroke={color === "ink" ? "#dfb36d" : "#293d35"} strokeWidth="1.5" /><circle cx="24" cy="24" r="16" fill="none" stroke={color === "ink" ? "#a69b78" : "#8e744e"} strokeWidth="1" />{color === "queen" ? <path d="m24 13 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff1ce" /> : color === "striker" ? <><path d="m24 12 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="none" stroke="#293d35" /><circle cx="24" cy="24" r="3" fill="#293d35" /></> : <circle cx="24" cy="24" r="2" fill={color === "ink" ? "#dfb36d" : "#8e744e"} />}</svg>;
}

// Shared flat board geometry, also used below the live Canvas 2D renderer.
export function BoardArt({ position = 0, angle = 0, power = 50, aiming = false, showPieces = true }: { position?: number; angle?: number; power?: number; aiming?: boolean; showPieces?: boolean }) {
  const strikerX = 300 + position * 1.4;
  const radians = angle * Math.PI / 180;
  const length = 70 + power * 1.25;
  const coins = [
    ...Array.from({ length: 6 }, (_, i) => ({ x: 300 + 23 * Math.sin(i * Math.PI / 3), y: 300 + 23 * Math.cos(i * Math.PI / 3), cream: i % 2 === 0 })),
    ...Array.from({ length: 12 }, (_, i) => ({ x: 300 + 46 * Math.sin(i * Math.PI / 6), y: 300 + 46 * Math.cos(i * Math.PI / 6), cream: i % 2 === 1 })),
  ];
  return <svg className={styles.boardArt} viewBox="0 0 600 600" role="img" aria-hidden={!showPieces} aria-label="Flat carrom board with four pockets, nine cream coins, nine dark coins, a red queen, and a patterned striker">
    <rect x="2" y="2" width="596" height="596" rx="11" fill="#804528" stroke="#b97845" strokeWidth="3" />
    <rect x="8" y="8" width="584" height="584" rx="7" fill="none" stroke="#ba7742" strokeWidth="1.5" />
    <rect x="23" y="23" width="554" height="554" rx="25" fill="#533a29" stroke="#c28650" strokeWidth="2" />
    <rect x={boardEdge} y={boardEdge} width={boardFarEdge - boardEdge} height={boardFarEdge - boardEdge} rx={pocketRadius} fill="#eac795" />
    <g fill="none" stroke="#a06c40" strokeWidth=".6" opacity=".12">{Array.from({ length: 65 }, (_, i) => <path key={i} d={`M55 ${40 + i * 8}q100 -4 240 0t250 0`} />)}</g>
    <g fill="none" stroke="#ecbd79" strokeWidth=".6" opacity=".26">{[0, 90, 180, 270].map((r) => <g key={r} transform={`rotate(${r} 300 300)`}><path d="M20 13Q200 6 580 15M40 18Q300 25 560 18M100 10Q200 15 420 10" /><path d="m4 4 25 25m542 0 25-25" stroke="#3f2c20" /></g>)}</g>
    {[0, 90, 180, 270].map((rotation) => <g key={rotation} transform={`rotate(${rotation} 300 300)`} fill="none" stroke="#5b4935" strokeWidth="1.8">
      <path d="M160 470h280M160 494h280" strokeWidth="1.3" />
      {[160, 440].map((x) => <g key={x}><circle cx={x} cy="482" r="12" fill="#eac795" strokeWidth="1.2" /><circle cx={x} cy="482" r="8.5" fill="#a83538" stroke="none" /></g>)}
      <path d="m92 508 129-129m-7 2 7-2-2 7M181 405a27 27 0 1 0 25-29" strokeWidth="1.1" />
      <path d="m92 508 2-8 6 6Z" fill="#5b4935" stroke="none" />
    </g>)}
    <g stroke="#5b4935" fill="none"><circle cx="300" cy="300" r="61" strokeWidth="1.2" /><circle cx="300" cy="300" r="57" strokeWidth=".65" />{Array.from({ length: 8 }, (_, i) => <g key={i} transform={`rotate(${i * 45} 300 300)`}><path d="m300 241 9 43-9 16-9-16Z" fill={i % 2 ? "#385543" : "#a83538"} strokeWidth=".6" /><path d="M300 241v59l-9-16Z" fill="#eac795" strokeWidth=".5" /></g>)}<circle cx="300" cy="300" r="10" fill="#a83538" strokeWidth=".8" /></g>
    <text x="300" y="110" textAnchor="middle" fill="#76543a" fontFamily="Georgia, serif" fontSize="7" letterSpacing="3">VIHAR</text>
    {pockets.map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r={pocketRadius} fill="#302d28" /><circle cx={x} cy={y} r={pocketRadius - 2} fill="none" stroke="#65584a" strokeWidth="1" /><path d={`M${x - 12} ${y + 6}q12 6 24 0m-21 5q9 5 18 0`} stroke="#998774" strokeWidth=".7" opacity=".26" fill="none" /></g>)}
    {showPieces && <g>
    {coins.map((coin, i) => <g key={i}><circle cx={coin.x} cy={coin.y} r="10.6" fill={coin.cream ? "#fff5df" : "#293d35"} stroke="#6d6146" strokeWidth="1.3" /><circle cx={coin.x} cy={coin.y} r="7.5" fill="none" stroke={coin.cream ? "#c6ad7e" : "#929277"} strokeWidth=".7" /></g>)}
    <circle cx="300" cy="300" r="10.6" fill="#a83538" stroke="#733f2f" strokeWidth="1.3" /><path d="m300 293 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#f5e6c5" />
    {aiming && <g stroke="#2b4a42" fill="none"><path d={`M${strikerX} 482l${Math.sin(radians) * length} ${-Math.cos(radians) * length}`} strokeWidth="2" strokeDasharray="5 5" /><circle cx={strikerX} cy="482" r="22" strokeWidth="1.2" strokeDasharray="3 4" /></g>}
    <g transform={`translate(${strikerX} 482)`}><circle r="16" fill="#dfb36d" stroke="#293d35" strokeWidth="1.7" /><circle r="12" fill="none" stroke="#7c603b" /><path d="m0-9 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="none" stroke="#293d35" /><circle r="2" fill="#293d35" /></g>
    </g>}
  </svg>;
}
