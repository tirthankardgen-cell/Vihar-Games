"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { defaults, loadSession, loadSettings, newSession, saveSession, SETTINGS_KEY, type Mode, type Session, type Settings } from "@/games/chess/persistence";
import { ChessNav, ChessFooter, Dialog } from "./shared";
import { LocalGame } from "./local-game";
import { Piece } from "./pieces";
import { Setup } from "./setup";
import { RoomSetup } from "./room-setup";
import { Icon } from "./icons";
import styles from "./chess.module.css";
import { useViharPlay } from "@/lib/use-vihar-play";
import { ViharPlayControls } from "../vihar-play-controls";
import { useGameAudio } from "@/lib/use-game-audio";
import { GameAudioControls } from "../game-audio-controls";

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
  const audio = useGameAudio("chess", inRound && !session?.handover, vihar.paused || replace);
  const { cue } = audio;
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
    const before = active.current;
    if (before?.id === next.id) {
      if (!before.match.result && next.match.result) cue(next.match.result.winner === null ? "draw" : "complete");
      else if (next.match.moves.length > before.match.moves.length) {
        const move = next.match.notation.at(-1) ?? "";
        cue(move.includes("x") ? "capture" : move.includes("+") ? "check" : "move");
      } else if (next.match.moves.length < before.match.moves.length) cue("undo");
    }
    active.current = next; setSession(next); setPrevious(next);
    try { setSaved(saveSession(window.localStorage, next)); } catch { setSaved(false); }
    return true;
  }, [cue]);
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
  return <main id="main-content" className={styles.page} data-vihar-embedded={vihar.embedded || undefined}><ChessNav embedded={vihar.embedded} controls={<><GameAudioControls audio={audio} /><ViharPlayControls play={{ ...vihar, exit: () => { audio.stop(); vihar.exit(); } }} inRound={inRound} /></>} />
    {screen === "choose" && <section className={`${styles.content} ${styles.choose}`}>
      <div className={styles.screenHeading}><p className={styles.eyebrow}>01 / Choose your company</p><h1>A good game starts with good company.</h1><p className={styles.intro}>Pull up a chair. We’ll bring the board.</p></div>
      <div className={styles.modeGrid}>
        <button className={`${styles.modeCard} ${styles.computerCard}`} onClick={() => choose("computer")}><span className={styles.modeArt}><Piece type="n" color="w" /><span className={styles.orbit} /></span><span className={styles.cardCopy}><small>A THOUGHTFUL COMPANION</small><strong>Play Computer</strong><span>Three levels. One friendly mentor.</span></span><span className={styles.cardArrow}><Icon name="arrow" /></span></button>
        <button className={`${styles.modeCard} ${styles.friendsCard}`} onClick={() => choose("pass-and-play")}><span className={styles.modeArt}><Piece type="p" color="w" /><Piece type="p" color="b" /></span><span className={styles.cardCopy}><small>BETTER, TOGETHER</small><strong>Pass &amp; Play</strong><span>Two people. One device. Your time.</span></span><span className={styles.cardArrow}><Icon name="arrow" /></span></button>
        <button className={`${styles.modeCard} ${styles.onlineCard}`} onClick={() => setScreen("create")}><Icon name="room" /><span className={styles.cardCopy}><strong>Create Room</strong><span>A private seat for a faraway friend.</span></span><span className={styles.tag}>Soon</span></button>
        <button className={`${styles.modeCard} ${styles.onlineCard}`} onClick={() => setScreen("join")}><Icon name="join" /><span className={styles.cardCopy}><strong>Join Room</strong><span>A room code brings you together.</span></span><span className={styles.tag}>Soon</span></button>
      </div>
      {previous && <div className={styles.resume}><Icon name="undo" /><div><strong>Your board is waiting.</strong><p>{previous.players.w} &amp; {previous.players.b} · {previous.match.result ? "Finished game" : "Continue where you left off"}</p></div><button className={styles.textButton} onClick={() => { commit(previous); setScreen("game"); }}>Resume game<Icon name="arrow" /></button></div>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
    </section>}
    {screen === "setup" && <Setup mode={mode} settings={settings} onSettings={setSettings} onStart={() => { if (previous && !previous.match.result) setReplace(true); else start(); }} onBack={back} />}
    {screen === "game" && session && <LocalGame key={session.id} session={session} onChange={commit} onBack={back} onAgain={again} saved={saved} paused={vihar.paused} />}
    {(screen === "create" || screen === "join") && <RoomSetup joining={screen === "join"} initialRoom={initialRoom ?? ""} onBack={back} onLocal={() => choose("pass-and-play")} />}
    {replace && <Dialog title="Start a fresh game?" onClose={() => setReplace(false)}><p>This replaces your unfinished saved game. Your new side and difficulty apply to the fresh board.</p><div className={styles.actions}><button className={styles.primary} onClick={start}>Start fresh</button><button className={styles.secondary} onClick={() => setReplace(false)}>Keep my saved game</button></div></Dialog>}
    <ChessFooter />
  </main>;
}
