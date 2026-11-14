"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ViharPlayControls } from "@/components/vihar-play-controls";
import { useViharPlay } from "@/lib/use-vihar-play";
import { defaults, loadSettings, newSession, parseSession, rematch, saveSession, SESSION_KEY, SETTINGS_KEY, type Session, type Settings, type Mode } from "@/games/carrom/persistence";
import { Coin } from "./board-art";
import { CarromNav, CarromFooter, Dialog } from "./shared";
import { Icon } from "./icons";
import { RaviPortrait } from "./opponent";
import { LocalGame } from "./local-game";
import styles from "./carrom.module.css";

type Screen = "choose" | "setup" | "game";
const modeTitles: Record<Mode, string> = { computer: "Good company.\nA worthy rival.", practice: "Find your rhythm.", "pass-and-play": "Better with a friend." };

export default function CarromPlay({ initialRoom }: { initialRoom?: string }) {
  const [screen, setScreen] = useState<Screen>("choose");
  const [mode, setMode] = useState<Mode>("practice");
  const [settings, setSettings] = useState<Settings>(defaults);
  const [session, setSession] = useState<Session | null>(null);
  const [previous, setPrevious] = useState<Session | null>(null);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState(initialRoom === undefined ? "" : "Private rooms are coming soon. Choose a local table below to play today.");
  const [replace, setReplace] = useState(false);
  const live = useRef<Session | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previousScreen = useRef(screen);
  const inRound = screen === "game" && Boolean(session && !session.match.result);
  const play = useViharPlay("carrom", inRound, inRound && !session?.handover && !replace);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSettings(loadSettings(localStorage));
        const raw = localStorage.getItem(SESSION_KEY), old = parseSession(raw);
        setPrevious(old);
        if (raw && !old) setNotice("Your saved board could not be read. Start a fresh board.");
      } catch { setSaved(false); setNotice("Device storage is unavailable. You can still play in this tab."); }
    });
  }, []);

  const commit = useCallback((next: Session, revision?: number) => {
    if (revision !== undefined && (live.current?.id !== next.id || live.current.match.revision !== revision)) return false;
    live.current = next; setSession(next); setPrevious(next);
    try { setSaved(saveSession(localStorage, next)); } catch { setSaved(false); }
    return true;
  }, []);

  const start = () => {
    commit(newSession(mode, settings, crypto.randomUUID()));
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { setSaved(false); }
    setReplace(false); setScreen("game");
  };
  const again = () => { if (session) commit(rematch(session, crypto.randomUUID())); };
  const choose = (next: Mode) => { setMode(next); setScreen("setup"); };

  useEffect(() => {
    if (previousScreen.current !== screen) {
      mainRef.current?.querySelector<HTMLElement>("section")?.scrollTo(0, 0);
      mainRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    }
    previousScreen.current = screen;
  }, [screen]);

  return <main ref={mainRef} id="main-content" className={`${styles.page} ${screen === "game" ? styles.previewPage : ""}`} {...(play.embedded ? { "data-vihar-embedded": true } : {})}>
    <CarromNav embedded={play.embedded} controls={<ViharPlayControls play={play} inRound={inRound} />} />
    {screen === "choose" && <section className={`${styles.content} ${styles.choose}`} aria-labelledby="mode-title">
      <div className={styles.screenHeading}>
        <p className={styles.eyebrow}>01 <span aria-hidden="true">/</span> FIND YOUR KIND OF EVENING</p>
        <h1 id="mode-title" tabIndex={-1}>There’s a seat for everyone.</h1>
        <p>A quiet moment. A friendly rival. A familiar face.</p>
      </div>
      <div className={styles.modeGrid}>
        <button className={`${styles.modeCard} ${styles.computerCard}`} onClick={() => choose("computer")}>
          <span className={styles.cardTop}><span className={styles.cardNumber}>01</span><span className={styles.cardKicker}>A LITTLE FRIENDLY RIVALRY</span></span>
          <span className={styles.cardArt}><RaviPortrait /></span>
          <span className={styles.cardCopy}><strong>A board with Ravi</strong><span>A sharp eye. A warm smile.<br />Your new favourite rival.</span></span>
          <span className={styles.cardFoot}>Play the computer <Icon name="arrow" /></span>
        </button>
        <button className={`${styles.modeCard} ${styles.practiceCard}`} onClick={() => choose("practice")}>
          <span className={styles.cardTop}><span className={styles.cardNumber}>02</span><span className={styles.cardKicker}>JUST YOU & THE BOARD</span></span>
          <span className={styles.cardArt}><Icon name="target" /></span>
          <span className={styles.cardCopy}><strong>Find your flow</strong><span>No scores to chase.<br />Just the joy of a good shot.</span></span>
          <span className={styles.cardFoot}>Solo practice <Icon name="arrow" /></span>
        </button>
        <button className={`${styles.modeCard} ${styles.friendsCard}`} onClick={() => choose("pass-and-play")}>
          <span className={styles.cardTop}><span className={styles.cardNumber}>03</span><span className={styles.cardKicker}>GOOD COMPANY, CLOSE BY</span></span>
          <span className={styles.cardArt}><Icon name="people" /></span>
          <span className={styles.cardCopy}><strong>Bring a friend</strong><span>Two chairs. One screen.<br />A little healthy competition.</span></span>
          <span className={styles.cardFoot}>Pass &amp; play <Icon name="arrow" /></span>
        </button>
        <div className={styles.onlineCard} role="group" aria-label="Private room, coming soon" aria-disabled="true">
          <span className={styles.onlineIcon}><Icon name="room" /></span>
          <div><strong>Private room</strong><p>Different places. The same favourite board.</p></div>
          <span className={styles.comingSoon}><Icon name="lock" />Coming soon</span>
        </div>
      </div>
      {previous && <div className={styles.resume}><span><Icon name="save" /><span>{previous.match.result ? "Your last board" : "Your board is waiting"}<small>{previous.mode === "practice" ? "Solo practice" : `${previous.players.cream} & ${previous.players.ink}`}</small></span></span><button className={styles.textButton} onClick={() => { commit(previous); setScreen("game"); }}>Resume board<Icon name="arrow" /></button></div>}
      {notice && <p role="status" className={styles.screenNote}>{notice}</p>}
      {!notice && !previous && <p className={styles.screenNote}>No sign-up. No hurry. Just one more board.</p>}
    </section>}
    {screen === "setup" && <section className={`${styles.content} ${styles.setup}`} aria-labelledby="setup-title">
      <div className={styles.setupIntro}>
        <button className={styles.textButton} onClick={() => setScreen("choose")}><Icon name="back" />All tables</button>
        <div><p className={styles.eyebrow}>02 / MAKE YOURSELF COMFORTABLE</p><h1 id="setup-title" tabIndex={-1}>{modeTitles[mode]}</h1><p className={styles.intro}>{mode === "computer" ? "Meet Ravi Mehta. A veranda regular with a soft spot for a clever bank shot." : mode === "practice" ? "No opponent. No hurry. Just a board and a little room to try." : "Pick your coins, pull your chairs closer, and share the same board."}</p></div>
        {mode === "computer" ? <div className={styles.setupOpponent}><RaviPortrait /><div><span className={styles.eyebrow}>YOUR FRIENDLY RIVAL</span><strong>Ravi Mehta <span lang="hi">रवि मेहता</span></strong><p>“A good game and good company.<br />What more do we need?”</p><span className={styles.opponentLabel}><span className={styles.presenceDot} />Computer opponent · three levels</span></div></div> : <div className={styles.setupCoins} aria-hidden="true"><Coin color={settings.coins} /><Coin color="queen" /><Coin color={settings.coins === "cream" ? "ink" : "cream"} /><span>NINE EACH. ONE TO SHARE.</span></div>}
      </div>
      <form className={styles.paper} onSubmit={(event) => { event.preventDefault(); if (previous && !previous.match.result) setReplace(true); else start(); }}>
        <div className={styles.paperHeading}><div><span className={styles.eyebrow}>THE LITTLE DETAILS</span><h2>Make it your game.</h2></div><span className={styles.formEmblem}><Icon name={mode === "computer" ? "spark" : mode === "practice" ? "target" : "people"} /></span></div>
        {mode === "computer" && <fieldset className={styles.fieldset}><legend><Icon name="sliders" />Choose your challenge</legend><div className={styles.choices}>{(["easy", "medium", "hard"] as const).map((level, index) => <label key={level} className={styles.choice}>
          <input type="radio" name="difficulty" value={level} checked={settings.difficulty === level} onChange={() => setSettings({ ...settings, difficulty: level })} />
          <span className={styles.levelBars} aria-hidden="true">{[0, 1, 2].map((bar) => <i key={bar} data-active={bar <= index} />)}</span><strong>{level[0].toUpperCase() + level.slice(1)}</strong><small>{["Warm up", "Find your angle", "Bring your best"][index]}</small><span className={styles.choiceCheck}><Icon name="check" /></span>
        </label>)}</div></fieldset>}
        <div className={styles.nameFields}>{(mode === "pass-and-play" ? [0, 1] : [0]).map((i) => <label className={styles.field} key={i}><span><Icon name="user" />{mode === "pass-and-play" ? `Player ${i + 1}` : "Your name"}<small>optional</small></span><input maxLength={24} autoComplete="off" placeholder={mode === "pass-and-play" ? `Player ${i + 1}’s name` : "What shall we call you?"} value={settings.names[i]} onChange={(event) => setSettings({ ...settings, names: i === 0 ? [event.target.value, settings.names[1]] : [settings.names[0], event.target.value] })} /></label>)}</div>
        <fieldset className={styles.fieldset}><legend><Icon name="target" />{mode === "pass-and-play" ? "Player 1’s coins" : "Pick your coins"}</legend><div className={`${styles.choices} ${styles.coinChoices}`}>{(["cream", "ink"] as const).map((color) => <label key={color} className={styles.choice}>
          <input type="radio" name="coins" value={color} checked={settings.coins === color} onChange={() => setSettings({ ...settings, coins: color })} /><Coin color={color} /><span><strong>{color === "cream" ? "Cream" : "Dark"}</strong><small>{color === "cream" ? "The light side" : "The dark side"}</small></span><span className={styles.choiceCheck}><Icon name="check" /></span>
        </label>)}</div></fieldset>
        <div className={styles.formBottom}><button className={styles.primary} type="submit"><Coin color="striker" />Let’s play<Icon name="arrow" /></button><p><Icon name="save" />Your board saves here. Pick up where you left off.</p></div>
      </form>
    </section>}
    {screen === "game" && session && <LocalGame key={session.id} session={session} onChange={commit} onBack={() => setScreen("choose")} onAgain={again} saved={saved} paused={play.paused} />}
    {replace && <Dialog title="Start a fresh board?" onClose={() => setReplace(false)}><p>This replaces your unfinished saved board. Your new settings apply to the fresh board.</p><div className={styles.dialogActions}><button className={styles.primary} onClick={start}>Start fresh</button><button className={styles.textButton} onClick={() => setReplace(false)}>Keep my saved board</button></div></Dialog>}
    <CarromFooter />
  </main>;
}
