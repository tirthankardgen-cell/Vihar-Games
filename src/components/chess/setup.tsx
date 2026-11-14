"use client";
import type { Mode, Settings } from "@/games/chess/persistence";
import { sideName } from "@/games/chess/engine";
import { Mentor } from "./shared";
import { Piece } from "./pieces";
import { Icon } from "./icons";
import styles from "./chess.module.css";

export function Setup({ mode, settings, onSettings, onStart, onBack }: { mode: Mode; settings: Settings; onSettings: (settings: Settings) => void; onStart: () => void; onBack: () => void }) {
  const computer = mode === "computer";
  return <section className={`${styles.content} ${styles.setup}`}>
    <div className={styles.setupIntro}>
      <button className={styles.textButton} onClick={onBack}><Icon name="back" />Choose a different mode</button>
      <div className={styles.introCopy}><p className={styles.eyebrow}>02 / Settle in</p><h1>{computer ? "Good company.\nA worthy opponent." : "Your friend.\nYour friendly rivalry."}</h1><p className={styles.intro}>{computer ? "A patient mentor. A thoughtful rival. Always up for one more game." : "One board, two curious minds. Make yourselves at home."}</p></div>
      {computer ? <div className={styles.mentorFeature}><Mentor /><p>“Every move is a new possibility.”</p><span>YOUR COURTYARD COMPANION</span></div> : <div className={styles.friendsArt} aria-hidden="true"><Piece type="n" color="w" /><span>&amp;</span><Piece type="n" color="b" /><p>Better together.</p></div>}
    </div>
    <form className={styles.setupForm} onSubmit={(e) => { e.preventDefault(); onStart(); }}>
      <div className={styles.formHeading}><span className={styles.eyebrow}>Make yourself comfortable</span><span className={styles.tag}><Icon name="sun" />Untimed</span></div>
      {computer && <fieldset className={styles.fieldset}><legend>Your challenge <span>01</span></legend><div className={styles.choices}>{(["easy", "medium", "hard"] as const).map((level, index) => <label key={level} className={`${styles.choice} ${styles.levelChoice}`}><input type="radio" name="difficulty" checked={settings.difficulty === level} onChange={() => onSettings({ ...settings, difficulty: level })} /><span className={styles.levelBars} aria-hidden="true">{[0, 1, 2].map((bar) => <i key={bar} data-active={bar <= index} />)}</span><strong>{level[0].toUpperCase() + level.slice(1)}</strong><small>{level === "easy" ? "Find your rhythm" : level === "medium" ? "Think a step ahead" : "A worthy challenge"}</small><span className={styles.choiceCheck}><Icon name="check" /></span></label>)}</div></fieldset>}
      <div className={styles.nameFields}><label className={styles.field}><span>{computer ? "Your name" : "Player 1"} <small>optional</small></span><span className={styles.inputWrap}><Icon name="people" /><input aria-label={computer ? "Your name (optional)" : "Player 1 (optional)"} maxLength={24} autoComplete="off" placeholder={computer ? "What shall we call you?" : "First player's name"} value={settings.names[0]} onChange={(e) => onSettings({ ...settings, names: [e.target.value, settings.names[1]] })} /></span></label>{!computer && <label className={styles.field}><span>Player 2 <small>optional</small></span><span className={styles.inputWrap}><Icon name="people" /><input aria-label="Player 2 (optional)" maxLength={24} autoComplete="off" placeholder="Second player's name" value={settings.names[1]} onChange={(e) => onSettings({ ...settings, names: [settings.names[0], e.target.value] })} /></span></label>}</div>
      <fieldset className={styles.fieldset}><legend>{computer ? "Your pieces" : "Player 1's pieces"}<span>{computer ? "02" : "01"}</span></legend><div className={`${styles.choices} ${styles.sideChoices}`}>{(["w", "b", "random"] as const).map((side) => <label className={styles.choice} key={side}><input type="radio" name="side" checked={settings.side === side} onChange={() => onSettings({ ...settings, side })} /><span className={styles.sideSymbol} aria-hidden="true">{side === "random" ? <Icon name="flip" /> : <Piece type="k" color={side} />}</span><strong>{side === "random" ? "Random" : sideName(side)}</strong><small>{side === "w" ? "You open" : side === "b" ? "You respond" : "Let fate decide"}</small><span className={styles.choiceCheck}><Icon name="check" /></span></label>)}</div></fieldset>
      <div className={styles.formBottom}><p><span className={styles.statusDot} />Saved here. Ready whenever you are.</p><button className={styles.primary} type="submit">Let&apos;s play<Icon name="arrow" /></button></div>
    </form>
  </section>;
}
