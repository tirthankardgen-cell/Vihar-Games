"use client";

import type { useViharPlay } from "@/lib/use-vihar-play";
import styles from "./vihar-play-controls.module.css";

export function ViharPlayControls({ play, inRound }: { play: ReturnType<typeof useViharPlay>; inRound: boolean }) {
  return <div className={styles.controls} aria-label="Play controls">
    {play.embedded && <button type="button" onClick={play.exit}>← Exit to Vihar</button>}
    {inRound && <button type="button" onClick={play.togglePause} aria-pressed={play.manualPause}>{play.manualPause ? "Resume game" : "Pause game"}</button>}
    {play.notice && <span role="status" className={styles.notice}>{play.notice}</span>}
  </div>;
}
