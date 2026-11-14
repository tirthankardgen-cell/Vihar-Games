import type { Run } from "@/games/silk-trail/engine";
import styles from "./silk.module.css";

export function Leaf({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18C1 11 6 3 20 3c0 14-8 21-15 15Z" fill="#A8BA97" stroke="#304B3B" strokeWidth="1.5" /><path d="m3 21 13-13M7 17l-1-6m5 2 6 1m-3-4V6" stroke="#A45E47" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
export function TrailMark() {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M8 28h15c13 0 13-16 0-16H12" stroke="#304B3B" strokeWidth="8" strokeLinecap="round" /><path d="M11 12h14M10 28h13" stroke="#A8BA97" strokeWidth="1" strokeDasharray="2 3" /><circle cx="10" cy="10" r="1" fill="#F5EFDC" /><circle cx="10" cy="14" r="1" fill="#F5EFDC" /></svg>;
}
export function GardenArt() {
  return <figure className={styles.gardenArt}><svg viewBox="0 0 500 500" role="img" aria-label="An illustrated green garden snake curls around a mulberry leaf on a stitched silk panel">
    <defs><pattern id="silk-art-weave" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0h8M0 0v8" stroke="#304B3B" strokeOpacity=".035" /></pattern><pattern id="silk-art-edge" width="14" height="14" patternUnits="userSpaceOnUse"><path d="m2 7 5-5 5 5-5 5Z" fill="none" stroke="#A45E47" strokeWidth=".8" /></pattern></defs>
    <rect x="24" y="24" width="452" height="452" rx="4" fill="#E9E5CF" /><rect x="31" y="31" width="438" height="438" fill="url(#silk-art-edge)" /><rect x="46" y="46" width="408" height="408" fill="#F5EFDC" stroke="#A8BA97" /><rect x="46" y="46" width="408" height="408" fill="url(#silk-art-weave)" />
    <path d="M142 354h155c95 0 95-119 0-119h-91c-99 0-99-117 0-117h95" fill="none" stroke="#304B3B" strokeWidth="39" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M142 354h155c95 0 95-119 0-119h-91c-99 0-99-117 0-117h78" fill="none" stroke="#A8BA97" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
    <ellipse cx="307" cy="118" rx="31" ry="24" fill="#304B3B" /><circle cx="315" cy="107" r="4" fill="#F5EFDC" /><circle cx="315" cy="129" r="4" fill="#F5EFDC" /><circle cx="316" cy="107" r="2" fill="#304B3B" /><circle cx="316" cy="129" r="2" fill="#304B3B" /><path d="M335 118h11m-1 0 6-4m-6 4 6 4" stroke="#A45E47" strokeWidth="2" fill="none" />
    <g transform="translate(238 277) rotate(-15)"><path d="M0 35C-8 12 9-7 47-5c1 35-19 60-47 40Z" fill="#A8BA97" stroke="#304B3B" strokeWidth="2" /><path d="m-5 46 39-37M7 31 4 13m12 8 20 3m-12-12V0" fill="none" stroke="#A45E47" strokeWidth="2" /></g>
    <g fill="none" stroke="#A8BA97" strokeWidth="1.2"><path d="M72 79c9-8 17-5 16 7-12 2-19 0-16-7Zm0 0-7-7M403 397c-10 8-18 5-17-7 12-2 20 0 17 7Zm0 0 7 7" /></g>
  </svg><figcaption>FIG. 01 · FOLLOW A LITTLE GREEN THREAD</figcaption></figure>;
}
const rotation = { right: 0, down: 90, left: 180, up: 270 };
export function GardenBoard({ run, quiet }: { run: Run; quiet: boolean }) {
  return <svg className={styles.board} viewBox="0 0 400 400" role="img" aria-label={`20 by 20 garden. ${run.score} leaves, length ${run.body.length}. Head column ${run.body[0].x + 1}, row ${run.body[0].y + 1}, facing ${run.direction}.${run.leaf ? ` Leaf column ${run.leaf.x + 1}, row ${run.leaf.y + 1}.` : " Garden complete."}`} data-quiet={quiet || undefined}>
    <defs><pattern id="silk-board-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" fill="none" stroke="#304B3B" strokeOpacity=".1" strokeWidth=".7" /></pattern></defs>
    <rect width="400" height="400" fill="#F5EFDC" /><rect width="400" height="400" fill="url(#silk-board-grid)" />
    {run.leaf && <g transform={`translate(${run.leaf.x * 20 + 2} ${run.leaf.y * 20 + 2})`}><path d="M3 12C0 6 5 1 15 1c0 10-5 17-12 11Z" fill="#A8BA97" stroke="#304B3B" strokeWidth="1.2" /><path d="m1 15 11-10M5 11V6m3 2 5 1" fill="none" stroke="#A45E47" strokeWidth="1.2" /></g>}
    <polyline points={run.body.map((cell) => `${cell.x * 20 + 10},${cell.y * 20 + 10}`).join(" ")} fill="none" stroke="#304B3B" strokeWidth="14" strokeLinejoin="round" />
    {run.body.slice(1).map((cell, i) => <g key={`${cell.x},${cell.y}`}><rect x={cell.x * 20 + 1} y={cell.y * 20 + 1} width="18" height="18" rx="5" fill={i % 3 === 2 ? "#3B5842" : "#304B3B"} /><path d={`M${cell.x * 20 + 8} ${cell.y * 20 + 10}h4`} stroke="#A8BA97" strokeWidth="1.5" strokeLinecap="round" /></g>)}
    <g transform={`translate(${run.body[0].x * 20 + 10} ${run.body[0].y * 20 + 10}) rotate(${rotation[run.direction]})`}><rect x="-9" y="-9" width="18" height="18" rx="6" fill="#304B3B" /><circle cx="4" cy="-4" r="2" fill="#F5EFDC" /><circle cx="4" cy="4" r="2" fill="#F5EFDC" /><path d="M8 0h2" stroke="#A45E47" strokeWidth="1.5" /></g>
  </svg>;
}
