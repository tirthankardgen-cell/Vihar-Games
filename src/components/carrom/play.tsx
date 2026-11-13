"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ViharPlayControls } from "@/components/vihar-play-controls";
import { useViharPlay } from "@/lib/use-vihar-play";
import { Coin } from "./board-art";
import { CarromNav, CarromFooter } from "./shared";
import { Icon } from "./icons";
import styles from "./carrom.module.css";

type Screen = "choose" | "setup" | "game" | "create" | "join";
import { defaults, loadSettings, newSession, parseSession, rematch, saveSession, SESSION_KEY, SETTINGS_KEY, type Session, type Settings, type Mode } from "@/games/carrom/persistence";
import { LocalGame } from "./local-game";
import { Dialog } from "./shared";
const modeTitles: Record<Mode, string> = { computer: "A friendly challenge.", practice: "Find your rhythm.", "pass-and-play": "Better with a friend." };

export default function CarromPlay({ initialRoom }: { initialRoom?: string }) {
  const [screen, setScreen] = useState<Screen>(initialRoom === undefined ? "choose" : "join");
  const [mode, setMode] = useState<Mode>("practice");
  const [settings, setSettings] = useState<Settings>(defaults);
  const [code, setCode] = useState(initialRoom ?? "");
  const [session, setSession] = useState<Session | null>(null);
  const [previous, setPrevious] = useState<Session | null>(null);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState("");
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


  useEffect(() => {
    if (previousScreen.current !== screen) mainRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    previousScreen.current = screen;
  }, [screen]);

  const choose = (next: Mode) => { setMode(next); setScreen("setup"); };
  return <main ref={mainRef} id="main-content" className={`${styles.page} ${screen === "game" ? styles.previewPage : ""}`} {...(play.embedded ? { "data-vihar-embedded": true } : {})}>
    <CarromNav embedded={play.embedded} controls={<ViharPlayControls play={play} inRound={inRound} />} />
    {screen === "choose" && <section className={`${styles.content} ${styles.choose}`} aria-labelledby="mode-title">
      <div className={styles.screenHeading}><p className={styles.eyebrow}>01 / Pull up a chair</p><h1 id="mode-title" tabIndex={-1}>There&apos;s a seat for everyone.</h1><p>A quiet moment, a friendly rival, or a familiar face.</p></div>
      <div className={styles.modeGrid}>
        <button className={`${styles.modeCard} ${styles.computerCard}`} onClick={() => choose("computer")}><span className={styles.cardArt}><Coin color="ink" /><Coin color="cream" /></span><span className={styles.cardCopy}><small>A LITTLE FRIENDLY RIVALRY</small><strong>Play the computer</strong><span>Three levels. One familiar board.</span></span><Icon name="arrow" /></button>
        <button className={`${styles.modeCard} ${styles.practiceCard}`} onClick={() => choose("practice")}><span className={styles.cardArt}><Icon name="target" /></span><span className={styles.cardCopy}><small>JUST YOU &amp; THE BOARD</small><strong>Practice</strong><span>Take your time. Find your aim.</span></span><Icon name="arrow" /></button>
        <button className={`${styles.modeCard} ${styles.friendsCard}`} onClick={() => choose("pass-and-play")}><span className={styles.cardArt}><Icon name="people" /></span><span className={styles.cardCopy}><small>GOOD COMPANY, CLOSE BY</small><strong>Pass &amp; play</strong><span>Two friends. One shared screen.</span></span><Icon name="arrow" /></button>
        <div className={`${styles.modeCard} ${styles.onlineCard}`}><span className={styles.cardArt}><Icon name="room" /></span><span className={styles.cardCopy}><small>DIFFERENT COURTYARDS</small><strong>Private room</strong><span>Share a board from afar.</span></span><div className={styles.roomLinks}><button onClick={() => setScreen("create")}>Create room<Icon name="arrow" /></button><button onClick={() => setScreen("join")}>Join room<Icon name="arrow" /></button></div></div>
      </div>
      {previous && <div className={styles.resume}><span>{previous.match.result ? "Your last board" : "Your board is waiting"} | {previous.mode === "practice" ? "Practice" : `${previous.players.cream} & ${previous.players.ink}`}</span><button className={styles.textButton} onClick={() => { commit(previous); setScreen("game"); }}>Resume board<Icon name="arrow" /></button></div>}
      {notice && <p role="status" className={styles.screenNote}>{notice}</p>}
      <p className={styles.screenNote}>Practice, computer and pass &amp; play are ready. Private rooms are coming soon.</p>
    </section>}
    {screen === "setup" && <section className={`${styles.content} ${styles.setup}`} aria-labelledby="setup-title">
      <div className={styles.setupIntro}><button className={styles.textButton} onClick={() => setScreen("choose")}><Icon name="back" />Choose a different mode</button><div><p className={styles.eyebrow}>02 / Make yourself comfortable</p><h1 id="setup-title" tabIndex={-1}>{modeTitles[mode]}</h1><p className={styles.intro}>{mode === "computer" ? "A little aim, a little strategy. Choose the challenge that feels like you." : mode === "practice" ? "No opponent. No hurry. Just a board and a little room to try." : "Pick your colors, pull your chairs closer, and share the same board."}</p></div><div className={styles.setupCoins} aria-hidden="true"><Coin color={settings.coins} /><Coin color="queen" /><Coin color={settings.coins === "cream" ? "ink" : "cream"} /><span>NINE EACH. ONE TO SHARE.</span></div></div>
      <form className={styles.paper} onSubmit={(event) => { event.preventDefault(); if (previous && !previous.match.result) setReplace(true); else start(); }}>
        <div className={styles.paperHeading}><span className={styles.eyebrow}>{mode === "practice" ? "Your quiet corner" : "Settle in for a board"}</span><span className={styles.tag}>Local play</span></div>
        {mode === "computer" && <fieldset className={styles.fieldset}><legend>Your challenge</legend><div className={styles.choices}>{(["easy", "medium", "hard"] as const).map((level, index) => <label key={level} className={styles.choice}><input type="radio" name="difficulty" checked={settings.difficulty === level} onChange={() => setSettings({ ...settings, difficulty: level })} /><span className={styles.levelBars} aria-hidden="true">{[0, 1, 2].map((bar) => <i key={bar} data-active={bar <= index} />)}</span><strong>{level[0].toUpperCase() + level.slice(1)}</strong><small>{["Find your feet", "Find your angle", "Test your aim"][index]}</small><span className={styles.choiceCheck}><Icon name="check" /></span></label>)}</div></fieldset>}
        <div className={styles.nameFields}>{(mode === "pass-and-play" ? [0, 1] : [0]).map((i) => <label className={styles.field} key={i}><span>{mode === "pass-and-play" ? `Player ${i + 1}` : "Your name"}<small>optional</small></span><input maxLength={24} autoComplete="off" placeholder={mode === "pass-and-play" ? `Player ${i + 1}’s name` : "What shall we call you?"} value={settings.names[i]} onChange={(event) => setSettings({ ...settings, names: i === 0 ? [event.target.value, settings.names[1]] : [settings.names[0], event.target.value] })} /></label>)}</div>
        <fieldset className={styles.fieldset}><legend>{mode === "pass-and-play" ? "Player 1’s coins" : "Your coins"}</legend><div className={`${styles.choices} ${styles.coinChoices}`}>{(["cream", "ink"] as const).map((color) => <label key={color} className={styles.choice}><input type="radio" name="coins" checked={settings.coins === color} onChange={() => setSettings({ ...settings, coins: color })} /><Coin color={color} /><strong>{color === "cream" ? "Cream" : "Dark"}</strong><span className={styles.choiceCheck}><Icon name="check" /></span></label>)}</div></fieldset>
        <div className={styles.formBottom}><p>Your settled board saves on this device.<br />No account needed. Make yourself at home.</p><button className={styles.primary} type="submit">Start board<Icon name="arrow" /></button></div>
      </form>
    </section>}
    {(screen === "create" || screen === "join") && <section className={`${styles.content} ${styles.setup}`} aria-labelledby="room-title">
      <div className={styles.setupIntro}><button className={styles.textButton} onClick={() => setScreen("choose")}><Icon name="back" />Choose a different mode</button><div><p className={styles.eyebrow}>A game across the distance</p><h1 id="room-title" tabIndex={-1}>{screen === "join" ? "Same board.\nDifferent courtyards." : "Keep a seat\nfor a friend."}</h1><p className={styles.intro}>A private code. A familiar face.<br />A little togetherness, wherever you are.</p></div><div className={styles.roomArt} aria-hidden="true"><Icon name="room" /><span>YOU <i /> A FRIEND</span></div></div>
      <div className={styles.paper}><div className={styles.paperHeading}><span className={styles.eyebrow}>{screen === "join" ? "Join a private room" : "Your private room"}</span><span className={styles.tag}>Coming soon</span></div><label className={styles.field}><span>Your nickname</span><input maxLength={24} placeholder="What shall we call you?" autoComplete="off" /></label>
        {screen === "join" && <label className={styles.field}><span>Six-character room code</span><input className={styles.code} value={code} maxLength={6} placeholder="ABC234" autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6))} /></label>}
        <div className={styles.roomNotice} id="room-notice"><Icon name="room" /><p>Private rooms aren&apos;t open yet.<br /><span>For now, share a board on this device.</span></p></div><button className={styles.primary} disabled aria-describedby="room-notice">{screen === "join" ? "Join room" : "Create room"}<Icon name="arrow" /></button><button className={styles.textButton} onClick={() => choose("pass-and-play")}>Play on this device<Icon name="arrow" /></button><button className={styles.textButton} onClick={() => setScreen(screen === "join" ? "create" : "join")}>{screen === "join" ? "See the create-room screen" : "Have a room code?"}<Icon name="arrow" /></button>
      </div>
    </section>}
    {screen === "game" && session && <LocalGame key={session.id} session={session} onChange={commit} onBack={() => setScreen("choose")} onAgain={again} saved={saved} paused={play.paused} />}
    {replace && <Dialog title="Start a fresh board?" onClose={() => setReplace(false)}><p>This replaces your unfinished saved board. Your new settings apply to the fresh board.</p><div className={styles.dialogActions}><button className={styles.primary} onClick={start}>Start fresh</button><button className={styles.textButton} onClick={() => setReplace(false)}>Keep my saved board</button></div></Dialog>}
    <CarromFooter />
  </main>;
}
