"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { defaults, loadSession, loadSettings, newSession, saveSession, SETTINGS_KEY, type Mode, type Session, type Settings } from "@/games/chess/persistence";
import { sideName } from "@/games/chess/engine";
import { ChessNav, Dialog, Mentor } from "./shared";
import { LocalGame } from "./local-game";
import { Piece } from "./pieces";
import styles from "./chess.module.css";
import { useViharPlay } from "@/lib/use-vihar-play";
import { ViharPlayControls } from "../vihar-play-controls";

type Screen = "choose" | "setup" | "game" | "create" | "join";
export default function ChessPlay({ initialRoom }: { initialRoom?: string }) {
  const [screen, setScreen] = useState<Screen>(initialRoom !== undefined ? "join" : "choose");
  const [mode, setMode] = useState<Mode>("computer");
  const [settings, setSettings] = useState<Settings>(defaults);
  const [session, setSession] = useState<Session | null>(null);
  const [previous, setPrevious] = useState<Session | null>(null);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState("");
  const [replace, setReplace] = useState(false);
  const active = useRef<Session | null>(null);
  const inRound = screen === "game" && !!session && !session.match.result;
  const vihar = useViharPlay("chess", inRound, inRound && !session?.handover && !session?.practice);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const loaded = loadSession(window.localStorage);
        setPrevious(loaded.session); setSettings(loadSettings(window.localStorage));
        if (loaded.damaged) setNotice("The saved game could not be restored. You can start a fresh game.");
      } catch { setSaved(false); }
    });
    return () => { cancelled = true; };
  }, []);
  const commit = useCallback((next: Session, expectedRevision?: number) => {
    if (expectedRevision !== undefined && (active.current?.id !== next.id || active.current.match.revision !== expectedRevision)) return false;
    active.current = next; setSession(next); setPrevious(next);
    try { setSaved(saveSession(window.localStorage, next)); } catch { setSaved(false); }
    return true;
  }, []);
  function start() {
    const next = newSession(mode, settings, crypto.randomUUID());
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Storage is optional. */ }
    commit(next); setScreen("game"); setReplace(false); setNotice("");
  }
  function back() { active.current = null; setSession(null); setScreen("choose"); }
  function choose(next: Mode) { setMode(next); setScreen("setup"); }
  function again() {
    if (!session) return;
    const next = newSession(session.mode, { difficulty: session.difficulty, side: session.humanSide, names: [session.players[session.humanSide], session.players[session.humanSide === "w" ? "b" : "w"]] }, crypto.randomUUID());
    commit(next);
  }
  return <main id="main-content" className={styles.page} data-vihar-embedded={vihar.embedded || undefined}><ChessNav embedded={vihar.embedded} controls={<ViharPlayControls play={vihar} inRound={inRound} />} />
    {screen === "choose" && <section className={styles.content}><p className={styles.eyebrow}>Pull up a chair · 01 / Choose your company</p><h1>There&apos;s always time for a game.</h1><p className={styles.intro}>A quiet courtyard. Sixty-four squares. Someone to share them with.</p>
      <div className={styles.modeGrid}>
        <button className={styles.modeCard} onClick={() => choose("computer")}><span className={styles.modePiece}><Piece type="n" color="w" /></span><strong>Play Computer</strong><span>Meet Acharya Dev. Three levels, a little friendly competition.</span><b aria-hidden="true">↗</b></button>
        <button className={styles.modeCard} onClick={() => choose("pass-and-play")}><span className={styles.modePiece}><Piece type="p" color="w" /><Piece type="p" color="b" /></span><strong>Pass &amp; Play</strong><span>Two people, one device. Your turn, then theirs.</span><b aria-hidden="true">↗</b></button>
        <button className={styles.modeCard} onClick={() => setScreen("create")}><span className={styles.tag}>Coming soon</span><strong>Create Room</strong><span>A private seat for a faraway friend.</span><b aria-hidden="true">↗</b></button>
        <button className={styles.modeCard} onClick={() => setScreen("join")}><span className={styles.tag}>Coming soon</span><strong>Join Room</strong><span>Bring a room code. Find your friend.</span><b aria-hidden="true">↗</b></button>
      </div>
      {previous && <div className={styles.resume}><div><strong>Your board is right where you left it.</strong><p>{previous.players.w} &amp; {previous.players.b} · {previous.mode === "computer" ? previous.difficulty : "Pass-and-play"} · {previous.match.result ? "Finished game" : `${previous.match.moves.length} half-moves played`}</p></div><button className={styles.primary} onClick={() => { commit(previous); setScreen("game"); }}>Resume game →</button></div>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <p className={styles.small}>No clock. No account. Just your next move.</p>
    </section>}
    {screen === "setup" && <section className={`${styles.content} ${styles.setup}`}><button className={styles.textButton} onClick={back}>← Choose a different mode</button><p className={styles.eyebrow}>02 / Settle in</p><h1>{mode === "computer" ? "Meet your mentor." : "Make room for a friend."}</h1><p className={styles.intro}>{mode === "computer" ? "Patient, thoughtful, and always up for another game." : "Choose your names and sides. White makes the first move."}</p>
      {mode === "computer" && <Mentor />}
      <form onSubmit={(e) => { e.preventDefault(); if (previous && !previous.match.result) setReplace(true); else start(); }}>
        {mode === "computer" && <fieldset className={styles.fieldset}><legend>A little challenge?</legend><div className={styles.choices}>{(["easy", "medium", "hard"] as const).map((level) => <label key={level} className={styles.choice}><input type="radio" name="difficulty" checked={settings.difficulty === level} onChange={() => setSettings({ ...settings, difficulty: level })} /><strong>{level[0].toUpperCase() + level.slice(1)}</strong><span>{level === "easy" ? "Find your feet" : level === "medium" ? "Think a little ahead" : "Bring your best moves"}</span></label>)}</div></fieldset>}
        <div className={styles.nameFields}><label className={styles.field}>{mode === "computer" ? "Your name (optional)" : "Player 1 (optional)"}<input maxLength={24} autoComplete="off" placeholder={mode === "computer" ? "You" : "Player 1"} value={settings.names[0]} onChange={(e) => setSettings({ ...settings, names: [e.target.value, settings.names[1]] })} /></label>{mode === "pass-and-play" && <label className={styles.field}>Player 2 (optional)<input maxLength={24} autoComplete="off" placeholder="Player 2" value={settings.names[1]} onChange={(e) => setSettings({ ...settings, names: [settings.names[0], e.target.value] })} /></label>}</div>
        <fieldset className={styles.fieldset}><legend>{mode === "computer" ? "Your pieces" : "Player 1's pieces"}</legend><div className={styles.choices}>{(["w", "b", "random"] as const).map((side) => <label className={styles.choice} key={side}><input type="radio" name="side" checked={settings.side === side} onChange={() => setSettings({ ...settings, side })} /><strong>{side === "random" ? "Surprise me" : sideName(side)}</strong><span>{side === "w" ? "Make the first move" : side === "b" ? "Meet the opening" : "Let chance choose"}</span></label>)}</div></fieldset>
        <button className={styles.primary} type="submit">Let&apos;s play →</button><p className={styles.small}>Standard chess · Untimed · Saved on this device</p>
      </form>
    </section>}
    {screen === "game" && session && <LocalGame key={session.id} session={session} onChange={commit} onBack={back} onAgain={again} saved={saved} paused={vihar.paused} />}
    {(screen === "create" || screen === "join") && <RoomSetup joining={screen === "join"} initialRoom={initialRoom ?? ""} onBack={back} onLocal={() => choose("pass-and-play")} />}
    {replace && <Dialog title="Start a fresh game?" onClose={() => setReplace(false)}><p>This replaces your unfinished saved game. Your new side and difficulty apply to the fresh board.</p><div className={styles.actions}><button className={styles.primary} onClick={start}>Start fresh</button><button className={styles.secondary} onClick={() => setReplace(false)}>Keep my saved game</button></div></Dialog>}
  </main>;
}

function RoomSetup({ joining, initialRoom, onBack, onLocal }: { joining: boolean; initialRoom: string; onBack: () => void; onLocal: () => void }) {
  const [code, setCode] = useState(initialRoom);
  return <section className={`${styles.content} ${styles.setup}`}><button className={styles.textButton} onClick={onBack}>← Choose a different mode</button><p className={styles.eyebrow}>A game across the distance</p><h1>{joining ? "Find your friend's courtyard." : "Keep a seat for a friend."}</h1><p className={styles.intro}>Private rooms are coming soon. For now, share a device or play Acharya Dev.</p><div className={styles.panel}><span className={styles.tag}>Online play is not available yet</span><label className={styles.field}>Your nickname<input maxLength={24} placeholder="Your name" autoComplete="off" /></label>{joining ? <label className={styles.field}>Six-character room code<input className={styles.code} value={code} maxLength={6} placeholder="ABC234" autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6))} /></label> : <label className={styles.field}>Your preferred side<select defaultValue="random"><option value="random">Random sides</option><option value="w">White</option><option value="b">Black</option></select></label>}<button className={styles.primary} disabled>{joining ? "Join room" : "Create room"} · Coming soon</button><p className={styles.small}>Two human players. A private code. No sign-in required when rooms launch.</p></div><button className={styles.secondary} onClick={onLocal}>Play together on this device →</button></section>;
}
