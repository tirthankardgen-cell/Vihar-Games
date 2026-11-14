import type { Mood, Remark } from "@/games/carrom/opponent";
import { opponentName } from "@/games/carrom/opponent";
import styles from "./carrom.module.css";

export function RaviPortrait({ mood = "welcome" }: { mood?: Mood }) {
  return <svg viewBox="0 0 240 260" className={styles.raviPortrait} data-mood={mood} role="img" aria-label="Ravi Mehta, a smiling carrom player in a teal kurta">
    <path d="M10 260V120a110 110 0 0 1 220 0v140Z" fill="#cba86b" />
    <path d="M24 260V120a96 96 0 0 1 192 0v140" fill="#a5ad8b" stroke="#f4dfad" strokeWidth="1" />
    <path d="M37 260V119a83 83 0 0 1 166 0v141" fill="#657c64" />
    <g fill="none" stroke="#d5c393" strokeWidth="1" opacity=".35"><path d="M30 220h180M30 204h180M51 79h138M57 71h127" /><circle cx="175" cy="99" r="22" /><path d="M175 70v58m-29-29h58m-50-21 42 42m-42 0 42-42" /></g>
    <g className={styles.raviBody}>
      <path d="M23 260v-40c3-32 27-46 68-54h58c43 8 66 24 68 54v40" fill="#234b45" stroke="#183d37" strokeWidth="2" />
      <path d="M47 260v-43m146 43v-43M73 180l18 80m78-80-18 80" fill="none" stroke="#558176" strokeWidth="2" />
      <path d="M96 144v32l24 20 25-20v-35" fill="#b77850" stroke="#644331" strokeWidth="1.5" />
      <path d="m92 167 28 22-13 18-25-30m66-10-28 22 13 18 24-30" fill="#417063" stroke="#75917a" strokeWidth="1" />
      <path d="M120 190v70" stroke="#bcaa7b" strokeWidth="1.5" />
      <g fill="#dfc795"><circle cx="126" cy="218" r="2" /><circle cx="126" cy="242" r="2" /></g>
      <path d="M162 218h24v21h-24" fill="#2e5850" stroke="#76917a" /><path d="m174 217 2-16 5 1-2 15" fill="#d8ba80" />
      <g className={styles.raviHead}>
        <ellipse cx="77" cy="116" rx="10" ry="17" fill="#c68a5d" stroke="#76513b" strokeWidth="1.5" /><ellipse cx="165" cy="116" rx="10" ry="17" fill="#c68a5d" stroke="#76513b" strokeWidth="1.5" />
        <path d="M77 89c0-54 87-57 88 0v40c-1 28-24 46-44 46s-44-19-44-46Z" fill="#ce9468" stroke="#684936" strokeWidth="1.6" />
        <path d="M80 95c8-15 9-28 8-37 20 12 37 12 57 4 2 16 9 26 17 32l5-11c5-31-11-44-27-48-25-9-62 4-66 28-3 12-1 24 6 32Z" fill="#3e3c32" />
        <path d="M79 77c-2-14 6-29 20-33m-11 38c0-13 2-19 8-25m45-17c11 2 20 16 21 31m-6 12-10-23" fill="none" stroke="#a5a392" strokeWidth="3" strokeLinecap="round" />
        <path d="M94 61c14-10 31-11 45-7m-39-7c12-5 24-6 35-3" stroke="#767769" strokeWidth="2" fill="none" />
        <path d="M89 101q10-7 20-2m24 0q11-5 20 2" fill="none" stroke="#453d30" strokeWidth="3.5" strokeLinecap="round" />
        <g className={styles.raviEyes}><path d="M91 112q8-7 16 0m28 0q8-7 16 0" fill="#f6e4c4" stroke="#77543c" strokeWidth="1.3" /><ellipse cx="100" cy="112" rx="3" ry="4" fill="#34382e" /><ellipse cx="142" cy="112" rx="3" ry="4" fill="#34382e" /><circle cx="101" cy="111" r="1" fill="#fff2d6" /><circle cx="143" cy="111" r="1" fill="#fff2d6" /></g>
        <path d="m120 108-5 20q5 5 12 0" fill="none" stroke="#9a6548" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M94 139q9-13 26-6 18-7 28 6-16 7-27 0-12 7-27 0Z" fill="#494336" />
        <path d="m99 137 8-2m31 2-6-2" stroke="#b4aa8d" strokeWidth="1.4" />
        <path className={styles.raviSmile} d="M105 145q16 17 32 0Z" fill="#faf0d6" stroke="#895139" strokeWidth="1.3" />
        <path d="M114 161q7 3 14 0M86 121l5 2m62-2-5 2" fill="none" stroke="#ae7452" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <path d="M30 253q21-14 46-9l32 16H30m180-7q-21-14-46-9l-32 16h78" fill="#c48a60" stroke="#805638" strokeWidth="1.3" />
    </g>
  </svg>;
}

export function Opponent({ remark, difficulty, paused = false }: { remark: Remark; difficulty: string; paused?: boolean }) {
  return <div className={styles.opponentPanel} data-paused={paused}>
    <div className={styles.opponentIdentity}><div className={styles.opponentAvatar}><RaviPortrait mood={remark.mood} /></div><div><strong>{opponentName}</strong><span>Courtyard regular <i>·</i> {difficulty}</span><small><span className={styles.presenceDot} />Computer opponent</small></div><span className={styles.opponentMotif} aria-hidden="true">✦</span></div>
    <p key={remark.text} className={styles.opponentQuote} aria-live="polite">“{remark.text}”</p>
  </div>;
}
