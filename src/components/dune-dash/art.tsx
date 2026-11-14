import { foxBox, WORLD, type Pose, type Run } from "@/games/dune-dash/engine";
import styles from "./dune-dash.module.css";

export function Fox({ pose = "standing", stride = 0 }: { pose?: Pose; stride?: number }) {
  const low = pose === "ducking", air = pose === "airborne";
  return <svg viewBox={low ? "0 0 46 24" : "0 0 34 46"} fill="none" aria-hidden="true">
    {low ? <>
      <path d="M20 15C8 18 0 14 1 6c5 0 9 1 13 5" fill="#B56843" stroke="#463D32" strokeWidth="1" />
      <path d="M1 6c3 0 5 .4 7 1.2L5 13C2 12 1 9 1 6" fill="#F2E5CB" />
      <path d="M13 13q5-5 16-1l9-7 2 7 5 3-4 4H17Z" fill="#B56843" stroke="#463D32" strokeWidth="1" />
      <path d="m31 11 3-10 4 10M39 12l1-9 3 10" fill="#B56843" stroke="#463D32" strokeWidth="1" />
      <path d="m30 16 12-1-3 4h-9M15 19v4h5M30 19v4h6" fill="#F2E5CB" stroke="#463D32" strokeWidth="1" />
      <circle cx="39" cy="14" r="1" fill="#463D32" /><path d="m44 15 2 1-2 1" fill="#463D32" />
    </> : <>
      <path d="M15 33C4 34 0 26 1 17c8 1 12 7 14 12" fill="#B56843" stroke="#463D32" strokeWidth="1" />
      <path d="M1 17c4 1 6 2 8 4l-5 6C2 24 1 20 1 17" fill="#F2E5CB" />
      <path d="M9 25q6-7 14-2l3 10-7 6-9-4Z" fill="#B56843" stroke="#463D32" strokeWidth="1" />
      <path d="m18 17-1-16 7 11 5-11 2 16 3 5-7 5-10-5Z" fill="#B56843" stroke="#463D32" strokeWidth="1" />
      <path d="m19 6 2 9-2-1M29 6l-2 9 2-1" stroke="#463D32" strokeWidth="1" />
      <path d="m18 19 6 3 9-1-6 5-5-1Z" fill="#F2E5CB" /><circle cx="28" cy="18" r="1" fill="#463D32" /><path d="m32 21 2 1-2 1" fill="#463D32" />
      <path className={air ? undefined : styles.stride} d={air ? "m12 34-2 5 5 2m7-7 4 4h4" : stride % 2 ? "m12 34-3 10h5m7-10 5 10h4" : "m12 34 3 10h4m3-10-3 10h5"} stroke="#463D32" strokeWidth="2" strokeLinecap="round" />
      {!air && <path className={styles.stillLegs} d="m12 34v10h5m5-10v10h5" stroke="#463D32" strokeWidth="2" strokeLinecap="round" />}
      <path d="m20 25-2 9h5l3-8" fill="#F2E5CB" />
    </>}
  </svg>;
}
function Skyline() {
  return <g aria-hidden="true">
    <circle cx="777" cy="107" r="43" fill="#B56843" opacity=".28" />
    <path d="M0 293Q90 261 173 289T353 284T570 288T760 279T960 284V300H0Z" fill="#D9CAAA" />
    <path d="M0 300Q143 278 229 294T454 292T679 294T960 286V300Z" fill="#B8AB77" opacity=".35" />
    <path d="M0 300H960" stroke="#463D32" strokeWidth="1.5" />
    <g stroke="#B8AB77" strokeWidth="1.2" fill="none"><path d="m60 321-4-8m4 8 4-11m-4 11v-7m516 21-4-7m4 7 4-10m-4 10v-6m280 0-5-9m5 9 6-8" /><path d="M205 331h19m526-8h12M91 345h10m294-21h20m266 20h16" /></g>
  </g>;
}
export function RunField({ run, moving, onJump }: { run: Run; moving: boolean; onJump: () => void }) {
  const box = foxBox(run);
  return <svg className={styles.field} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Desert running horizon. Jump stones; duck beneath birds." data-moving={moving} onPointerDown={(event) => { if (event.button === 0) onJump(); }}>
    <Skyline />
    {run.obstacles.map((o) => o.kind === "stone" ? <g key={o.id} transform={`translate(${o.x} ${o.bottom - o.height})`}>
      <path d={o.variant === 0 ? `M0 ${o.height} 2 10 ${o.width * .35} 0 ${o.width - 5} 4 ${o.width} ${o.height}Z` : o.variant === 1 ? `M0 ${o.height} 0 12 7 2 ${o.width * .65} 0 ${o.width} 13 ${o.width} ${o.height}Z` : `M0 ${o.height} 3 ${o.height * .5} ${o.width * .25} 0 ${o.width - 4} 3 ${o.width} ${o.height}Z`} fill="#AE9270" stroke="#463D32" strokeWidth="1.5" />
      <path d={`M4 ${o.height * .7}h${o.width - 10}M8 ${o.height * .4}h${o.width * .5}`} stroke="#F2E5CB" strokeWidth="1.3" />
    </g> : <g key={o.id} transform={`translate(${o.x} ${o.bottom - o.height})`} fill="#463D32">
      <path d="M0 5q16-2 25 10Q35 1 50 0L34 18l-9 5-9-6Z" /><path d="m21 17-11 7 15-4 12 4-7-7" />
    </g>)}
    <svg x={box.left} y={box.top} width={box.right - box.left} height={box.bottom - box.top} viewBox={run.pose === "ducking" ? "0 0 46 24" : "0 0 34 46"}>
      <Fox pose={run.pose} stride={moving ? Math.floor(run.elapsed * 9) : 0} />
    </svg>
  </svg>;
}
export function CoverArt() {
  return <svg className={styles.coverArt} viewBox="0 0 540 530" role="img" aria-label="An original desert fox study, with sandstone, a swift, and a printed horizon.">
    <path d="M24 20h492v482H24Z" stroke="#A89B81" fill="none" />
    <path d="M36 32h24m-24 0v24m468-24h-24m24 0v24M36 490h24m-24 0v-24m468 24h-24m24 0v-24" stroke="#463D32" />
    <circle cx="397" cy="143" r="63" fill="#B56843" opacity=".3" />
    <path d="M37 365Q110 327 196 359T362 350T503 356v25H37Z" fill="#D9CAAA" /><path d="M37 381h466" stroke="#463D32" strokeWidth="1.4" />
    <svg x="183" y="168" width="153" height="207" viewBox="0 0 34 46"><Fox /></svg>
    <path d="m71 380 5-35 13-8 27 8 3 35Z" fill="#AE9270" stroke="#463D32" /><path d="M79 360h29m-24-10h17" stroke="#F2E5CB" />
    <path d="M359 239q23-5 41 13 13-19 38-21l-27 31-12 5-12-6Z" fill="#463D32" />
    <g stroke="#829BA3" fill="none"><path d="M235 184V120h-79M291 293h90v27M107 351v-45H64" /><circle cx="235" cy="184" r="2" /><circle cx="291" cy="293" r="2" /></g>
    <g fill="#463D32" fontFamily="var(--font-hind),sans-serif" fontSize="11" letterSpacing="1.5"><text x="72" y="111">LONG EARS</text><text x="352" y="337">LIGHT FEET</text><text x="63" y="296">SANDSTONE</text><text x="54" y="64">FIELD STUDY / 01</text><text x="53" y="461">VULPES · A SMALL DESERT EXPLORER</text></g>
    <g stroke="#B8AB77"><path d="m144 413-8-17m8 17 7-21m-7 21v-13m287 26-4-11m4 11 6-14" /></g>
  </svg>;
}
export function ControlStudy() {
  return <svg className={styles.controlStudy} viewBox="0 0 440 155" role="img" aria-label="Jump over sandstone with Space, Up or W. Hold Down or S to duck under a swift.">
    <path d="M10 122h420M218 16v115" stroke="#A89B81" strokeDasharray="3 4" />
    <path d="M36 107q26-101 85 0" stroke="#829BA3" fill="none" strokeDasharray="3 4" />
    <svg x="64" y="27" width="34" height="46"><Fox pose="airborne" /></svg>
    <path d="m92 121 2-32 11-8 18 3 6 37Z" fill="#AE9270" stroke="#463D32" />
    <svg x="290" y="98" width="46" height="24"><Fox pose="ducking" /></svg>
    <path d="M300 51q17 0 25 12 10-16 25-17l-17 26-9 4-10-5Z" fill="#463D32" />
    <g fill="#463D32" fontFamily="var(--font-hind),sans-serif" fontSize="11" letterSpacing="1"><text x="35" y="146">JUMP / PRESS ONCE</text><text x="263" y="146">DUCK / HOLD LOW</text></g>
  </svg>;
}
