"use client";

import { useEffect, useId, useRef, useState } from "react";
import { WORLD, gateOpening, speedAt, getVisibleGates, type Run } from "@/games/paperwing/engine";
import styles from "./paperwing.module.css";

export function Swallow({ folded = false }: { folded?: boolean }) {
  return <g>
    <path d={folded ? "M-7 2-22-24 6-10 30-23 15 5 1 9Z" : "M-8 2-38-19 3-9 41-13 16 5 2 10Z"} fill="#F8F1E4" stroke="#2C445C" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M-8 2 3-9 16 5 2 10Z" fill="#2C445C" /><path d="m3-9 4 12-5 7" fill="none" stroke="#7195A2" strokeWidth="1" />
    <path d="M-8 2-27 24-13 19-10 29 2 10Z" fill="#BCD4DE" stroke="#2C445C" strokeWidth="1.4" /><path d="m15 0 11 2-10 3" fill="#B96054" />
    <circle cx="13" cy="-1" r="1.7" fill="#F8F1E4" /><circle cx="0" cy="4" r="2.1" fill="#B39357" />
  </g>;
}
export function BirdMark() {
  return <svg viewBox="-45 -35 90 75" fill="none" aria-hidden="true"><Swallow /></svg>;
}
export function Postmark({ small = false }: { small?: boolean }) {
  return <svg className={small ? styles.smallPostmark : styles.postmark} viewBox="0 0 200 200" fill="none" aria-hidden="true">
    <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="1.4" /><circle cx="100" cy="100" r="69" stroke="currentColor" strokeWidth=".8" />
    <path d="M12 88q20-8 40 0t40 0M108 116q20-8 40 0t40 0" stroke="currentColor" strokeWidth="1.2" />
    <path d="m100 68 6 20 21 7-21 6-6 21-6-21-21-6 21-7Z" stroke="currentColor" strokeWidth="1.2" />
    <text x="100" y="52" textAnchor="middle" fill="currentColor" fontSize="9" letterSpacing="4">VIHAR AIRMAIL</text><text x="100" y="146" textAnchor="middle" fill="currentColor" fontSize="9" letterSpacing="2">A LITTLE MORE SKY</text>
  </svg>;
}
export function CoverArt() {
  return <svg className={styles.coverArt} viewBox="0 0 560 620" fill="none" role="img" aria-label="An original folded paper swallow flying above a pale airmail postcard">
    <rect x="50" y="40" width="450" height="540" rx="5" fill="#F8F1E4" stroke="#2C445C" strokeWidth="1.5" />
    <path d="M63 54h424v512H63Z" stroke="#B96054" strokeWidth="1.5" strokeDasharray="15 17" />
    <path d="M75 62h402v496H75Z" stroke="#2C445C" strokeWidth="1" strokeDasharray="15 17" strokeDashoffset="17" />
    <rect x="89" y="80" width="374" height="340" fill="#D8E7EB" />
    <path d="M91 315q50-34 92-6 23-70 79-35 35-61 87-5 54-33 113 9v140H91Z" fill="#E8EFF0" />
    <path d="M111 209h102m130-67h91m-223 201h155" stroke="#A2BBC3" strokeWidth="1" />
    <path d="M119 359c-10-68 44-95 116-82s145-20 177-64" stroke="#B39357" strokeWidth="1.5" strokeDasharray="4 7" />
    <g transform="translate(284 229) rotate(-12) scale(2.4)"><Swallow /></g>
    <path d="M109 457h187m-187 22h126m-126 22h149" stroke="#2C445C" strokeWidth="1" opacity=".5" />
    <rect x="366" y="446" width="69" height="79" fill="#BCD4DE" stroke="#2C445C" strokeWidth="1" strokeDasharray="3 3" /><g transform="translate(401 479) scale(.65)"><Swallow folded /></g>
    <text x="401" y="515" textAnchor="middle" fill="#2C445C" fontSize="8" letterSpacing="2">AIR POST</text>
  </svg>;
}
export function FlightField({ run, moving, onFlap }: { run: Run; moving: boolean; onFlap: () => void }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null), [width, setWidth] = useState<number>(WORLD.width);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width: pixels, height } = entry.contentRect;
      if (pixels > 0 && height > 0) setWidth(pixels / height * (WORLD.bottom - WORLD.top));
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <svg ref={ref} className={styles.flightField} viewBox={`0 ${WORLD.top} ${width} ${WORLD.bottom - WORLD.top}`} preserveAspectRatio="xMidYMid meet" role="img" tabIndex={0}
    aria-label={`Flight area. ${run.score} gates passed. Tap or press Space, Up, or W to flap.`} data-moving={moving} data-bird-y={run.y.toFixed(3)} data-velocity={run.velocity.toFixed(3)} data-elapsed={run.elapsed.toFixed(3)} data-speed={speedAt(run.mode, run.elapsed).toFixed(3)}
    onPointerDown={(event) => { if (event.button !== 0 || !event.isPrimary) return; event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); onFlap(); }}>
    <defs>
      <clipPath id={`${id}-flight`}><rect x="0" y="40" width={width} height="640" /></clipPath>
      <pattern id={`${id}-post`} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="28" height="28" fill="#F8F1E4" /><rect width="9" height="28" fill="#B96054" /><rect x="14" width="9" height="28" fill="#2C445C" /></pattern>
      <pattern id={`${id}-shutter`} width="64" height="18" patternUnits="userSpaceOnUse"><rect width="64" height="18" fill="#B8CDD2" /><path d="M8 6h48M8 9h48" stroke="#2C445C" strokeWidth=".7" opacity=".45" /></pattern>
    </defs>
    <rect x="0" y="40" width={width} height="640" fill="#D8E7EB" />
    <g clipPath={`url(#${id}-flight)`}>
      <path className={styles.cloud} d="M-20 209h182q-5-17-26-16-2-33-32-30-22-17-40 11-27-4-29 18-34-7-55 17Z" fill="#EAF1F2" />
      <g transform={`translate(${width * .68} 110)`}><path className={styles.cloud} d="M0 238h195q-10-16-33-16-1-37-36-33-25-21-45 9-26-6-32 18-26-4-49 22Z" fill="#EAF1F2" /></g>
      {getVisibleGates(run, width).map((gate) => {
        const opening = gateOpening(gate, run.mode, run.elapsed);
        return <g key={gate.id} data-gate-id={gate.id} data-centre={opening.centre} data-gap={opening.gap} data-kind={opening.kind} data-seal-y={opening.kind === "seal" ? opening.sealY : undefined} transform={`translate(${gate.x} 0)`}>
        {[[40, opening.centre - opening.gap / 2 - 40], [opening.centre + opening.gap / 2, 680 - opening.centre - opening.gap / 2]].map(([y, height], i) => <g key={i}>
          <rect x="0" y={y} width="64" height={height} fill={opening.kind === "shutter" ? `url(#${id}-shutter)` : "#F8F1E4"} stroke="#2C445C" strokeWidth="1.6" />
          <rect x="2" y={y} width="7" height={height} fill={`url(#${id}-post)`} /><rect x="55" y={y} width="7" height={height} fill={`url(#${id}-post)`} />
          <path d={`M12 ${i ? y + 2 : y + height - 2}h40`} stroke={opening.kind === "shutter" ? "#B39357" : "#B96054"} strokeWidth="3" />
        </g>)}
        {opening.kind === "shutter" && <path d={`m26 ${opening.centre - 12} 6-6 6 6m-12 24 6 6 6-6`} stroke="#B39357" strokeWidth="1.6" fill="none" opacity=".65" />}
        {opening.kind === "seal" && <g data-seal="true" transform={`translate(32 ${opening.sealY})`}>
          <circle r={opening.sealRadius} fill="#B96054" stroke="#2C445C" strokeWidth="1.6" /><circle r="16" fill="none" stroke="#F8F1E4" strokeWidth="1" />
          <path d="m-10-5 11-2 10 4-12 5Zm9-2v9m-9-7 10 14 1-7" fill="none" stroke="#F8F1E4" strokeWidth="1.2" strokeLinejoin="round" />
        </g>}
      </g>;
      })}
      <g className={styles.bird} transform={`translate(120 ${run.y}) rotate(${Math.max(-12, Math.min(18, run.velocity / 20))})`}><Swallow folded={run.velocity < 0} /></g>
    </g>
    <path d={`M0 ${WORLD.top}h${width}M0 ${WORLD.bottom}h${width}`} stroke="#2C445C" strokeWidth="1.5" />
  </svg>;
}
