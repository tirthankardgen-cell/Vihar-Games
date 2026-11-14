import type { CSSProperties } from "react";
import styles from "./table.module.css";

/** A readout of the player's pull. Shooting is controlled on the board only. */
export function PowerMeter({ power, pulling }: { power: number; pulling: boolean }) {
  const value = Math.max(0, Math.min(100, Math.round(power)));
  return <div className={styles.powerMeter} role="meter" aria-label="Your shot power" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value} percent`} data-pulling={pulling} data-full={value >= 90} style={{ "--power": `${value}%` } as CSSProperties}>
    <span className={styles.powerTrack} aria-hidden="true"><i /></span><span className={styles.powerValue} aria-hidden="true">{value}<small>%</small></span>
  </div>;
}
