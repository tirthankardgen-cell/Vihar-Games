"use client";

import type { LocalMode, Settings } from "@/games/tic-tac-toe/persistence";
import { Arrow, ButtonOutline, DoodleMark } from "./doodles";
import { Steps } from "./notebook";
import styles from "./notebook.module.css";

export function Setup({ mode, settings, onSettings, onStart, onBack }: { mode: LocalMode; settings: Settings; onSettings: (settings: Settings) => void; onStart: () => void; onBack: () => void }) {
  const computer = mode === "computer";
  return <section className={styles.content}>
    <Steps step={2} />
    <h1 className={styles.screenTitle}>{computer ? "Meet your little rival." : "Make room for two."}</h1>
    <p className={styles.screenCopy}>{computer ? "Pick a challenge. Pick your mark." : "One notebook. Two names. A friendly game."}</p>
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); onStart(); }}>
      {computer ? <>
        <fieldset className={styles.fieldset}><legend className={styles.legend}>How clever should the computer be?</legend>
          <div className={styles.choices}>{(["easy", "medium", "hard"] as const).map((difficulty, index) => <label key={difficulty} className={styles.choice}>
            <input type="radio" name="difficulty" value={difficulty} checked={settings.difficulty === difficulty} onChange={() => onSettings({ ...settings, difficulty })} />
            <span className={styles.choiceLabel}><strong>{["Easy", "Medium", "Hard"][index]}</strong><small>{["A gentle start", "A little clever", "Unbeatable"][index]}</small></span>
          </label>)}</div>
        </fieldset>
        <fieldset className={styles.fieldset}><legend className={styles.legend}>Your mark <span className={styles.formHint}>· X goes first</span></legend>
          <div className={styles.choices}>{(["X", "O", "random"] as const).map((mark) => <label key={mark} className={styles.choice}>
            <input type="radio" name="mark" value={mark} aria-label={mark === "random" ? "Random mark" : `${mark} — ${mark === "X" ? "You go first" : "Computer goes first"}`} checked={settings.mark === mark} onChange={() => onSettings({ ...settings, mark })} />
            <span className={styles.choiceLabel}>{mark === "random" ? <strong>Surprise me</strong> : <DoodleMark mark={mark} />}<small>{mark === "random" ? "Either mark" : mark === "X" ? "You go first" : "Computer goes first"}</small></span>
          </label>)}</div>
        </fieldset>
        <label className={styles.fieldLabel} htmlFor="your-name">Your name <span className={styles.formHint}>· optional</span></label>
        <input id="your-name" className={styles.input} maxLength={24} placeholder="You" autoComplete="nickname" value={settings.names[0]} onChange={(event) => onSettings({ ...settings, names: [event.target.value, settings.names[1]] })} />
      </> : <>
        <div className={styles.nameFields}>{([0, 1] as const).map((seat) => <div key={seat}>
          <label className={styles.fieldLabel} htmlFor={`player-${seat}`}>Player {seat + 1} <span className={styles.formHint}>· optional</span></label>
          <input id={`player-${seat}`} className={styles.input} maxLength={24} placeholder={`Player ${seat + 1}`} autoComplete="off" value={settings.names[seat]} onChange={(event) => {
            const names: [string, string] = [...settings.names]; names[seat] = event.target.value; onSettings({ ...settings, names });
          }} />
        </div>)}</div>
        <fieldset className={styles.fieldset}><legend className={styles.legend}>Who draws X first?</legend>
          <div className={styles.choices}>{([0, 1] as const).map((seat) => <label key={seat} className={styles.choice}>
            <input type="radio" name="first-player" value={seat} checked={settings.firstXSeat === seat} onChange={() => onSettings({ ...settings, firstXSeat: seat })} />
            <span className={styles.choiceLabel}><strong>{settings.names[seat].trim() || `Player ${seat + 1}`}</strong><small>Draws X · goes first</small></span>
          </label>)}</div>
        </fieldset>
        <p className={styles.formHint}>After each move, pass the notebook. The next player taps “I&apos;m ready” to take their turn.</p>
      </>}
      <div className={styles.formActions}><button className={styles.textButton} type="button" onClick={onBack}><Arrow back /> Back</button><button className={styles.button} type="submit">Start game <Arrow /><ButtonOutline /></button></div>
    </form>
  </section>;
}
