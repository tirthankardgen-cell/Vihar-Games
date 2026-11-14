import type { CSSProperties } from "react";
import styles from "./carrom.module.css";

export function PowerMeter({ power, pulling, moving, disabled, onChange }: { power: number; pulling: boolean; moving: boolean; disabled: boolean; onChange: (power: number) => void }) {
  const value = Math.round(power);
  const feel = value === 0 ? "At rest" : value < 35 ? "Gentle touch" : value < 70 ? "Steady strike" : value < 90 ? "Strong shot" : "Full force";
  return <div className={styles.powerMeter} data-charging={pulling} data-force={value >= 90 ? "full" : "normal"} style={{ "--power": `${value}%` } as CSSProperties}>
    <div className={styles.powerHeading}><div><span className={styles.eyebrow}>SHOT POWER</span><strong>{moving ? "Shot in motion" : pulling ? "Release to strike" : feel}</strong></div><output aria-hidden="true">{value}<small>%</small></output></div>
    <label className={styles.powerTrack}><span className={styles.srOnly}>Shot power</span><span className={styles.powerFill} aria-hidden="true" /><span className={styles.powerTicks} aria-hidden="true" /><input type="range" min={0} max={100} step={1} value={value} disabled={disabled} aria-valuetext={`${value} percent, ${feel}`} onChange={(event) => onChange(Number(event.target.value))} /></label>
    <div className={styles.powerScale} aria-hidden="true"><span>0 <i>SOFT</i></span><span>50</span><span><i>STRONG</i> 100</span></div>
  </div>;
}
