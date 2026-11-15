import type { CSSProperties } from "react";
import type { ShotFeedback } from "@/games/carrom/feedback";
import { Icon } from "./icons";
import { FEEDBACK_MS } from "@/games/carrom/feedback";
import styles from "./table.module.css";

export function ShotCelebration({ feedback, permanent = false, paused = false, onAgain }: { feedback: ShotFeedback; permanent?: boolean; paused?: boolean; onAgain?: () => void }) {
  const royal = feedback.kind === "cover" || feedback.kind === "queen";
  const icon = permanent ? "trophy" : royal ? "crown" : feedback.kind === "foul" ? "close" : feedback.kind === "return" ? "reset" : "spark";
  return <div className={styles.feedbackLayer} data-kind={feedback.kind} data-motif={feedback.motif} data-permanent={permanent} data-paused={paused} style={{ "--feedback-ms": `${FEEDBACK_MS}ms` } as CSSProperties}>
    <div className={styles.feedbackRings} aria-hidden="true"><i /><i /><i /></div>
    <div className={styles.feedbackSparks} aria-hidden="true">{Array.from({ length: permanent ? 24 : 12 }, (_, i) => <i key={i} style={{ "--angle": `${i * (permanent ? 15 : 30)}deg`, "--distance": `${i % 4 * 3}cqw`, "--delay": `${i % 4 * 60}ms` } as CSSProperties} />)}</div>
    <div className={styles.feedbackCopy} role="status" aria-atomic="true">
      <span className={styles.feedbackIcon} aria-hidden="true">{feedback.motif === "jalebi" ? <svg viewBox="0 0 64 64" fill="none"><path className={styles.jalebi} d="M33 32c-5-7-13 2-6 7 11 8 23-7 13-17C25 8 6 27 18 43c17 23 48-3 29-26C25-9-8 21 9 46c12 18 34 17 46 1" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg> : feedback.motif === "chai" ? <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 28h31l-4 21H18Zm31 3h5c11 0 7 13-7 13M12 54h35" /><g className={styles.chaiSteam}><path d="M23 21c-9-7 7-9 0-16M35 21c-9-7 7-9 0-16" /></g></svg> : <Icon name={icon} />}</span>
      {feedback.label && <span className={styles.feedbackLabel}>{feedback.label}</span>}
      <h2>{feedback.title}</h2><p>{feedback.note}</p>
      {onAgain && <button className={styles.againButton} onClick={onAgain}><Icon name="reset" />One more board</button>}
    </div>
  </div>;
}
