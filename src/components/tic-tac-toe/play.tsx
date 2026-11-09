"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createMatch, type Seat } from "@/games/tic-tac-toe/engine";
import { defaultSettings, loadSession, loadSettings, saveSession, saveSettings, type LocalMode, type LocalSession, type Settings } from "@/games/tic-tac-toe/persistence";
import { Arrow, DoodleMark } from "./doodles";
import { LocalGame } from "./local-game";
import { NotebookFooter, NotebookNav, Steps } from "./notebook";
import { RoomSetup } from "./room-setup";
import { Setup } from "./setup";
import styles from "./notebook.module.css";
import { useViharPlay } from "@/lib/use-vihar-play";
import { ViharPlayControls } from "../vihar-play-controls";

type Screen = "choose" | "setup" | "game" | "create" | "join";

export default function TicTacToePlay({ initialRoomCode }: { initialRoomCode?: string }) {
  const [screen, setScreen] = useState<Screen>(initialRoomCode !== undefined ? "join" : "choose");
  const [mode, setMode] = useState<LocalMode>("computer");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [previous, setPrevious] = useState<LocalSession | null>(null);
  const [canSave, setCanSave] = useState(true);
  const [notice, setNotice] = useState("");
  const active = useRef<LocalSession | null>(null);
  const inRound = screen === "game" && session?.match.status === "playing";
  const vihar = useViharPlay("tic-tac-toe", inRound, inRound && !session?.handover);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const loaded = loadSession(window.localStorage);
        setPrevious(loaded.session);
        setSettings(loadSettings(window.localStorage));
        if (loaded.damaged) setNotice("That old page couldn't be restored. Let's start a fresh one.");
      } catch { setCanSave(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const commit = useCallback((next: LocalSession, expectedRevision?: number) => {
    if (expectedRevision !== undefined && (!active.current || active.current.id !== next.id || active.current.match.revision !== expectedRevision)) return false;
    active.current = next;
    setSession(next); setPrevious(next);
    try { setCanSave(saveSession(window.localStorage, next)); } catch { setCanSave(false); }
    return true;
  }, []);

  function choose(chosen: LocalMode) { setMode(chosen); setScreen("setup"); setNotice(""); }

  function start() {
    const xSeat: Seat = mode === "pass-and-play" ? settings.firstXSeat : settings.mark === "random" ? Math.random() < .5 ? 0 : 1 : settings.mark === "X" ? 0 : 1;
    const players: [string, string] = mode === "computer"
      ? [settings.names[0].trim() || "You", "Computer"]
      : [settings.names[0].trim() || "Player 1", settings.names[1].trim() || "Player 2"];
    const next: LocalSession = { version: 1, id: crypto.randomUUID(), mode, players, difficulty: settings.difficulty, match: createMatch(xSeat), handover: false };
    try { saveSettings(window.localStorage, settings); } catch { /* Local play works without storage. */ }
    commit(next); setScreen("game");
  }

  function backToChoose() { active.current = null; setSession(null); setScreen("choose"); }

  return <main id="main-content" className={styles.page} data-vihar-embedded={vihar.embedded || undefined}>
    <NotebookNav embedded={vihar.embedded} controls={<ViharPlayControls play={vihar} inRound={inRound} />} />
    {screen === "choose" && <section className={`${styles.content} ${styles.chooseContent}`}>
      <Steps step={1} />
      <h1 className={styles.screenTitle}>Who&apos;s on the other side?</h1>
      <p className={styles.screenCopy}>Pick your company. We&apos;ll bring the notebook.</p>
      <div className={styles.modeGrid}>
        <button type="button" className={styles.modeOption} onClick={() => choose("computer")}>
          <span className={styles.modeIcon}><DoodleMark mark="X" /></span><span className={styles.modeTitle}>Play Computer</span><span className={styles.modeDescription}>A quick game with a clever little rival.</span>
        </button>
        <button type="button" className={styles.modeOption} onClick={() => choose("pass-and-play")}>
          <span className={styles.modeIcon}><DoodleMark mark="X" /><DoodleMark mark="O" /></span><span className={styles.modeTitle}>Pass &amp; Play</span><span className={styles.modeDescription}>Two friends. One device. Your turn, my turn.</span>
        </button>
        <button type="button" className={styles.modeOption} onClick={() => setScreen("create")}>
          <span className={styles.soon}>Coming soon</span><span className={styles.modeIcon}><Arrow /></span><span className={styles.modeTitle}>Create Room</span><span className={styles.modeDescription}>Save a private seat for a faraway friend.</span>
        </button>
        <button type="button" className={styles.modeOption} onClick={() => setScreen("join")}>
          <span className={styles.soon}>Coming soon</span><span className={styles.modeIcon}><Arrow back /></span><span className={styles.modeTitle}>Join Room</span><span className={styles.modeDescription}>Have a room code? Pull up a chair.</span>
        </button>
      </div>
      {previous && <div className={styles.resume}>
        <div><span>Your last page is still here.</span><p>{previous.players.join(" & ")} · Round {previous.match.round}</p></div>
        <button className={styles.textButton} type="button" onClick={() => { commit(previous); setScreen("game"); }}>Resume <Arrow /></button>
      </div>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      <p className={styles.smallNote}>X goes first. Three in a row wins. Simple as that.</p>
    </section>}
    {screen === "setup" && <Setup mode={mode} settings={settings} onSettings={setSettings} onStart={start} onBack={backToChoose} />}
    {screen === "game" && session && <LocalGame session={session} onChange={commit} onBack={backToChoose} saved={canSave} paused={vihar.paused} />}
    {(screen === "create" || screen === "join") && <RoomSetup key={screen} joining={screen === "join"} initialCode={initialRoomCode ?? ""} onBack={backToChoose} onLocal={() => choose("pass-and-play")} />}
    <NotebookFooter />
  </main>;
}
