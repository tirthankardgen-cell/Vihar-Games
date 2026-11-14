"use client";
import { useState } from "react";
import { Icon } from "./icons";
import styles from "./chess.module.css";
export function RoomSetup({ joining, initialRoom, onBack, onLocal }: { joining: boolean; initialRoom: string; onBack: () => void; onLocal: () => void }) {
  const [code, setCode] = useState(initialRoom);
  return <section className={`${styles.content} ${styles.setup} ${styles.roomSetup}`}>
    <div className={styles.setupIntro}><button className={styles.textButton} onClick={onBack}><Icon name="back" />Choose a different mode</button><div className={styles.introCopy}><p className={styles.eyebrow}>A game across the distance</p><h1>{joining ? "Same board.\nDifferent courtyards." : "Keep a seat\nfor a friend."}</h1><p className={styles.intro}>A private code. A familiar face. Your next game together is on its way.</p></div><div className={styles.roomIllustration} aria-hidden="true"><Icon name={joining ? "join" : "room"} /><span>YOU <i /> A FRIEND</span></div></div>
    <div className={styles.setupForm}><div className={styles.formHeading}><span className={styles.eyebrow}>{joining ? "Join a private room" : "Your private room"}</span><span className={styles.tag}>Coming soon</span></div>
      <label className={styles.field}><span>Your nickname</span><span className={styles.inputWrap}><Icon name="people" /><input maxLength={24} placeholder="What shall we call you?" autoComplete="off" /></span></label>
      {joining ? <label className={styles.field}><span>Six-character room code</span><span className={styles.inputWrap}><Icon name="room" /><input className={styles.code} value={code} maxLength={6} placeholder="ABC234" autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6))} /></span></label> : <label className={styles.field}><span>Your preferred side</span><select defaultValue="random"><option value="random">Let chance choose</option><option value="w">White · Make the first move</option><option value="b">Black · Meet the opening</option></select></label>}
      <div className={styles.roomNotice}><Icon name="room" /><p>Private rooms aren&apos;t open yet.<br /><span>Enjoy a local game while we get things ready.</span></p></div>
      <button className={styles.primary} disabled>{joining ? "Join room" : "Create room"}<Icon name="arrow" /></button><button className={styles.textButton} onClick={onLocal}>Play together on this device<Icon name="arrow" /></button>
    </div>
  </section>;
}
