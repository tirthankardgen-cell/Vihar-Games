"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { opposite, resign, sideName, validateShot, type Shot, type Side } from "@/games/carrom/engine";
import type { Session } from "@/games/carrom/persistence";
import type { Frame } from "@/games/carrom/physics";
import type { ShotReply } from "@/games/carrom/shot.worker";
import { opponentRemark } from "@/games/carrom/opponent";
import { resultFeedback, shotFeedback, type ShotFeedback } from "@/games/carrom/feedback";
import type { useViharPlay } from "@/lib/use-vihar-play";
import { Board } from "./board";
import { Coin } from "./board-art";
import { CarromNav, Dialog } from "./shared";
import { Icon } from "./icons";
import { RaviPortrait } from "./opponent";
import { PowerMeter } from "./power-meter";
import { ShotCelebration } from "./shot-feedback";
import styles from "./carrom.module.css";
import table from "./table.module.css";

const defaultShot: Shot = { position: 0, angle: 0, power: 0 };
const FEEDBACK_MS = 1900;
type Props = { session: Session; onChange: (s: Session, revision?: number) => boolean; onBack: () => void; onAgain: () => void; saved: boolean; play: ReturnType<typeof useViharPlay> };

export function LocalGame({ session, onChange, onBack, onAgain, saved, play }: Props) {
  const { match } = session, { paused } = play;
  const [shot, setShot] = useState<Shot>(defaultShot);
  const [pulling, setPulling] = useState(false);
  const [command, setCommand] = useState<Shot | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [reportPage, setReportPage] = useState(0);
  const [dialog, setDialog] = useState<"options" | "resign" | "new" | "details" | null>(null);
  const [feedback, setFeedback] = useState<{ message: ShotFeedback; revision: number } | null>(null);
  const feedbackUntil = useRef(0);
  const live = useRef(session);
  const finishCard = resultFeedback(match, session);
  const thinking = session.mode === "computer" && match.turn !== session.humanSide && !finishCard;
  const busy = Boolean(command || thinking);
  const locked = Boolean(paused || busy || session.handover || finishCard || dialog);
  const yourTurn = !thinking && !session.handover && !finishCard;
  useEffect(() => { live.current = session; }, [session]);

  useEffect(() => {
    if (!feedback || paused || dialog) return;
    feedbackUntil.current = performance.now() + FEEDBACK_MS;
    const timer = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [feedback, paused, dialog]);

  useEffect(() => {
    if (paused || dialog || session.handover || match.result || (!command && !thinking)) return;
    let worker: Worker | null = null, stopped = false, animation = 0, playbackTimer = 0;
    const current = session, started = performance.now();
    const fail = (message: string) => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(timeout); window.clearTimeout(playbackTimer); cancelAnimationFrame(animation);
      setError(message); setCommand(null); setFrame(null); worker?.terminate();
    };
    const timeout = window.setTimeout(() => fail("The shot took too long. Your saved board is safe. Try again."), 15000);
    try {
      worker = new Worker(new URL("../../games/carrom/shot.worker.ts", import.meta.url), { type: "module" });
      worker.onerror = () => fail("The shot could not start. Your board is safe. Try again.");
      worker.onmessage = (event: MessageEvent<ShotReply>) => {
        const reply = event.data;
        if (stopped || reply.id !== current.id || reply.revision !== current.match.revision || live.current.id !== current.id || live.current.match.revision !== reply.revision) return;
        window.clearTimeout(timeout);
        if (reply.error || !reply.match || !reply.simulation || !reply.shot) { fail(reply.error ?? "The shot could not finish. Try again."); return; }
        const nextMatch = reply.match, simulation = reply.simulation, acceptedShot = reply.shot;
        const finish = () => {
          if (stopped) return;
          if (onChange({ ...current, match: nextMatch, handover: current.mode === "pass-and-play" && !nextMatch.result && nextMatch.turn !== current.match.turn }, current.match.revision)) {
            const message = shotFeedback(current.match, nextMatch, simulation.outcome, current);
            feedbackUntil.current = message ? performance.now() + FEEDBACK_MS : 0;
            setFeedback(message ? { message, revision: nextMatch.revision } : null);
          }
          setCommand(null); setFrame(null); setShot(defaultShot);
        };
        const animate = () => {
          if (stopped) return;
          setShot(acceptedShot); setError("");
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
          const start = performance.now();
          const draw = (now: number) => {
            if (stopped) return;
            const progress = (now - start) / (simulation.duration * 1000);
            if (progress >= 1) { finish(); return; }
            setFrame(simulation.frames[Math.min(simulation.frames.length - 1, Math.floor(progress * simulation.frames.length))]);
            animation = requestAnimationFrame(draw);
          };
          animation = requestAnimationFrame(draw);
        };
        // Compute in parallel, then let the previous shot's short celebration finish.
        const beat = thinking ? Math.max(0, 650 - (performance.now() - started), feedbackUntil.current - performance.now()) : 0;
        playbackTimer = window.setTimeout(animate, beat);
      };
      worker.postMessage({ id: current.id, match: current.match, practice: current.mode === "practice", difficulty: current.difficulty, ...(command ? { shot: command } : {}) });
    } catch { queueMicrotask(() => fail("The shot could not start. Your board is safe. Try again.")); }
    return () => { stopped = true; worker?.terminate(); window.clearTimeout(timeout); window.clearTimeout(playbackTimer); cancelAnimationFrame(animation); };
  }, [session, match, command, thinking, paused, dialog, retry, onChange]);

  function shoot(input: Shot) {
    if (locked) return;
    try { validateShot(match, input); setError(""); setPulling(false); setFeedback(null); setCommand(input); } catch (e) { setError(e instanceof Error ? e.message : "Please adjust your shot."); }
  }
  function aim(next: Shot) {
    setShot(next); setFeedback(null); feedbackUntil.current = 0;
    if (!thinking) setError("");
  }
  const orientation = session.mode === "pass-and-play" ? match.turn : session.humanSide;
  const status = paused ? "Game paused" : finishCard?.title ?? (session.handover ? `Pass to ${sideName(match.turn)}` : error ? "Shot needs attention" : frame ? "In motion…" : thinking ? "Ravi is thinking…" : command ? "Here we go…" : "Your shot.");
  const remark = opponentRemark(match, session.humanSide, Boolean(thinking), Boolean(frame));
  const player = (side: Side) => {
    const ravi = session.mode === "computer" && side !== session.humanSide;
    const active = side === match.turn && !finishCard;
    const name = session.mode === "practice" ? sideName(side) : ravi ? "Ravi" : session.players[side];
    return <div className={table.player} data-active={active} aria-label={`${session.players[side]}, ${sideName(side)}, ${match.pocketed[side].length} of 9 pocketed${active ? ", at the table" : ""}`}>
      <span className={table.avatar}>{ravi ? <RaviPortrait mood={remark.mood} /> : <Coin color={side} />}</span>
      <span className={table.playerName} title={session.players[side]}>{name}<small>{ravi ? "Computer" : active ? "Your turn" : sideName(side)}</small></span>
      <span className={table.score}>{match.pocketed[side].length}<small>/9</small></span>
    </div>;
  };
  const queenLabel = match.queen === "covered" ? `Queen covered by ${sideName(match.coverSide!)}` : match.queen === "pending" ? "Queen awaiting cover" : "Queen on the board";

  return <>
    <CarromNav compact embedded={play.embedded} controls={<div className={table.gameButtons} aria-label="Game menu">
      {play.embedded && <button className={table.menuButton} aria-label="Exit to Vihar" title="Exit to Vihar" onClick={play.exit}><Icon name="back" /></button>}
      {!finishCard && <button className={table.menuButton} aria-label={play.manualPause ? "Resume game" : "Pause game"} title={play.manualPause ? "Resume game" : "Pause game"} aria-pressed={play.manualPause} onClick={play.togglePause}><Icon name={play.manualPause ? "play" : "pause"} /></button>}
      <button className={table.menuButton} aria-label="Board options" title="Board options" onClick={() => setDialog("options")}><Icon name="more" /></button>
    </div>} />
    <section className={table.arena} data-mode={session.mode} data-human-turn={Boolean(yourTurn)} aria-labelledby="game-title">
      <h1 id="game-title" tabIndex={-1} className={styles.srOnly} aria-live="polite">{status}</h1>
      <div className={table.surface}>
        <div className={table.scoreboard}>
          {player(opposite(orientation))}
          <span className={table.queen} data-state={match.queen} title={queenLabel} aria-label={queenLabel}><Coin color="queen" />{match.queen === "covered" && <Icon name="check" />}</span>
          {player(orientation)}
        </div>
        <Board match={match} shot={shot} frame={frame} orientation={orientation} locked={locked} onAim={aim} onShoot={shoot} onPull={setPulling} />
        {finishCard ? <ShotCelebration feedback={finishCard} permanent onAgain={onAgain} /> : paused ? <div className={table.boardVeil}><Icon name="pause" /><h2>Take your time.</h2><p>Your board will wait.</p></div> : feedback ? <ShotCelebration key={feedback.revision} feedback={feedback.message} paused={Boolean(dialog)} /> : session.handover ? <div className={table.boardVeil}><Icon name="people" /><h2>{sideName(match.turn)}’s turn.</h2><p>{session.players[match.turn]}, take your seat.</p><button className={table.againButton} onClick={() => onChange({ ...session, handover: false }, match.revision)}>I’m ready<Icon name="arrow" /></button></div> : null}
        {error && !paused && <div className={table.tableNotice} role="alert"><p>{error}</p>{thinking && <button onClick={() => { setError(""); setRetry(n => n + 1); }}>Retry Ravi’s shot</button>}</div>}
        <div className={table.belowBoard}>
          {yourTurn && !paused && !dialog ? <PowerMeter power={pulling || command || frame ? shot.power : 0} pulling={pulling} /> : thinking && !frame && !feedback && !paused && !dialog ? <p className={table.raviRemark} title={remark.text}>“{remark.text}”</p> : null}
        </div>
      </div>
      {dialog && <Dialog title={dialog === "resign" ? "Resign this board?" : dialog === "new" ? "A fresh board?" : dialog === "details" ? "Last shot" : "At your table"} onClose={() => setDialog(null)}>
        {dialog === "details" ? <><div aria-live="polite">{match.messages.slice(reportPage * 2, reportPage * 2 + 2).map((message, i) => <p key={`${reportPage}-${i}`}>{message}</p>)}</div>{match.messages.length > 2 && <div className={styles.pagination}><button className={styles.iconButton} aria-label="Previous shot details" disabled={reportPage === 0} onClick={() => setReportPage(reportPage - 1)}><Icon name="back" /></button><span>{reportPage + 1} / {Math.ceil(match.messages.length / 2)}</span><button className={styles.iconButton} aria-label="Next shot details" disabled={(reportPage + 1) * 2 >= match.messages.length} onClick={() => setReportPage(reportPage + 1)}><Icon name="arrow" /></button></div>}</> : dialog === "options" ? <>
          <p>Slide the striker. Pull back to aim and add power. Release to shoot. Return to the striker to cancel.</p>
          <div className={table.optionsList}>
            <Link href="/carrom/how-to-play" target={play.embedded ? "_blank" : undefined} rel={play.embedded ? "noopener noreferrer" : undefined}><Icon name="book" />How to play<Icon name="arrow" /></Link>
            {match.revision > 0 && <button onClick={() => { setReportPage(0); setDialog("details"); }}><Icon name="target" />Last shot<Icon name="arrow" /></button>}
            <button onClick={() => setDialog("new")}><Icon name="reset" />New board<Icon name="arrow" /></button>
            {session.mode !== "practice" && !finishCard && <button disabled={busy || session.handover} onClick={() => setDialog("resign")}><Icon name="hand" />Resign<Icon name="arrow" /></button>}
            <button onClick={onBack}><Icon name="back" />All tables<Icon name="arrow" /></button>
          </div>
          {(!saved || play.notice) && <p role="status">{!saved ? "Saving unavailable. Keep this tab open." : play.notice}</p>}
        </> : <><p>{dialog === "new" ? "Replace this board and alternate who opens?" : "Ravi or your friend takes this board. There’s always the next one."}</p><div className={styles.dialogActions}><button className={styles.primary} onClick={() => { if (dialog === "new") onAgain(); else onChange({ ...session, match: resign(match), handover: false }, match.revision); setDialog(null); }}>{dialog === "new" ? "Start new board" : "Resign board"}</button><button className={styles.textButton} onClick={() => setDialog(null)}>Keep playing</button></div></>}
      </Dialog>}
    </section>
  </>;
}
