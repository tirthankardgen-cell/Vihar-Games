import type { CSSProperties } from "react";
import type { ShotFeedback } from "@/games/carrom/feedback";
import { Icon } from "./icons";
import styles from "./table.module.css";

export function ShotCelebration({ feedback, permanent = false, paused = false, onAgain }: { feedback: ShotFeedback; permanent?: boolean; paused?: boolean; onAgain?: () => void }) {
  const royal = feedback.kind === "cover" || feedback.kind === "queen";
  const icon = permanent ? "trophy" : royal ? "crown" : feedback.kind === "foul" ? "close" : feedback.kind === "return" ? "reset" : "spark";
  return <div className={styles.feedbackLayer} data-kind={feedback.kind} data-permanent={permanent} data-paused={paused}>
    <div className={styles.feedbackRings} aria-hidden="true"><i /><i /><i /></div>
    <div className={styles.feedbackSparks} aria-hidden="true">{Array.from({ length: permanent ? 24 : 12 }, (_, i) => <i key={i} style={{ "--angle": `${i * (permanent ? 15 : 30)}deg`, "--distance": `${i % 4 * 3}cqw`, "--delay": `${i % 4 * 60}ms` } as CSSProperties} />)}</div>
    <div className={styles.feedbackCopy} role="status" aria-atomic="true">
      <span className={styles.feedbackIcon}><Icon name={icon} /></span>
      <h2>{feedback.title}</h2><p>{feedback.note}</p>
      {onAgain && <button className={styles.againButton} onClick={onAgain}><Icon name="reset" />One more board</button>}
    </div>
  </div>;
}
