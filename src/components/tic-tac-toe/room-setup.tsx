"use client";

import { useState } from "react";
import { Arrow, ButtonOutline } from "./doodles";
import { Steps } from "./notebook";
import styles from "./notebook.module.css";

// The room UI is prepared; Firebase integration is deferred at the user's request.
export function RoomSetup({ joining, initialCode, onBack, onLocal }: { joining: boolean; initialCode: string; onBack: () => void; onLocal: () => void }) {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(initialCode);
  const [first, setFirst] = useState("you");
  return <section className={styles.content}>
    <Steps step={2} />
    <h1 className={styles.screenTitle}>{joining ? "Pull up a chair." : "Save a seat for a friend."}</h1>
    <p className={styles.screenCopy}>{joining ? "A name and a little code. That's all." : "Your own little corner of the notebook."}</p>
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <label className={styles.fieldLabel} htmlFor="room-nickname">Your nickname</label>
      <input id="room-nickname" className={styles.input} maxLength={24} autoComplete="nickname" placeholder="What should we call you?" value={nickname} onChange={(event) => setNickname(event.target.value)} />
      {joining ? <div style={{ marginTop: 25 }}>
        <label className={styles.fieldLabel} htmlFor="room-code">Room code</label>
        <input id="room-code" className={`${styles.input} ${styles.roomCode}`} maxLength={6} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABC234" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6))} />
        <p className={styles.formHint}>The six-character code your friend shares with you.</p>
      </div> : <fieldset className={styles.fieldset} style={{ marginTop: 25 }}><legend className={styles.legend}>Who draws X first?</legend>
        <div className={styles.choices}>{["you", "friend"].map((seat) => <label key={seat} className={styles.choice}>
          <input type="radio" name="room-first" value={seat} checked={first === seat} onChange={() => setFirst(seat)} />
          <span className={styles.choiceLabel}><strong>{seat === "you" ? nickname.trim() || "You" : "Your friend"}</strong><small>Draws X · goes first</small></span>
        </label>)}</div>
      </fieldset>}
      <div className={styles.formActions}><button className={styles.textButton} type="button" onClick={onBack}><Arrow back /> Back</button><button className={styles.button} type="submit" disabled aria-describedby="rooms-coming-soon">{joining ? "Join room" : "Create room"}<Arrow /><ButtonOutline /></button></div>
      <div className={styles.onlineNote} id="rooms-coming-soon"><h3>Private rooms are on the way.</h3><p>For now, you can share one notebook on the same device.</p><button className={styles.textButton} type="button" onClick={onLocal}>Play on one device <Arrow /></button></div>
    </form>
  </section>;
}
