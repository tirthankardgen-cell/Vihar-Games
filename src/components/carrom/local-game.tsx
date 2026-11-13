"use client";
import { useEffect, useRef, useState } from "react";
import { opposite, resign, sideName, validateShot, type Shot } from "@/games/carrom/engine";
import type { Session } from "@/games/carrom/persistence";
import type { Frame } from "@/games/carrom/physics";
import type { ShotReply } from "@/games/carrom/shot.worker";
import { Board, snapPosition } from "./board";
import { Coin } from "./board-art";
import { Dialog } from "./shared";
import { Icon } from "./icons";
import styles from "./carrom.module.css";

const defaultShot: Shot = { position: 0, angle: 0, power: 65 };
export function LocalGame({ session, onChange, onBack, onAgain, saved, paused }: { session: Session; onChange: (s: Session, revision?: number) => boolean; onBack: () => void; onAgain: () => void; saved: boolean; paused: boolean }) {
  const { match } = session;
  const [shot, setShot] = useState<Shot>(defaultShot);
  const [pulling, setPulling] = useState(false);
  const [command, setCommand] = useState<Shot | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [dialog, setDialog] = useState<"options" | "resign" | "new" | "details" | "keyboard" | null>(null);
  const thinking = session.mode === "computer" && match.turn !== session.humanSide && !match.result;
  const busy = Boolean(command || thinking);
  const locked = Boolean(paused || busy || session.handover || match.result || (dialog && dialog !== "keyboard"));
  const live = useRef(session);
  useEffect(() => { live.current = session; }, [session]);

  useEffect(() => {
    if (paused || session.handover || match.result || (!command && !thinking)) return;
    let worker: Worker | null = null, stopped = false, animation = 0;
    const current = session;
    const fail = (message: string) => {
      if (stopped) return;
      setError(message); setCommand(null); setFrame(null); worker?.terminate();
    };
    const timeout = window.setTimeout(() => fail("The shot took too long. Your saved board is safe. Retry the shot."), 15000);
    try {
      worker = new Worker(new URL("../../games/carrom/shot.worker.ts", import.meta.url), { type: "module" });
      worker.onerror = () => fail("The shot worker could not start. Retry, or return to your saved board.");
      worker.onmessage = (event: MessageEvent<ShotReply>) => {
        const reply = event.data;
        if (stopped || reply.id !== current.id || reply.revision !== current.match.revision || live.current.id !== current.id || live.current.match.revision !== reply.revision) return;
        window.clearTimeout(timeout);
        if (reply.error || !reply.match || !reply.simulation || !reply.shot) { fail(reply.error ?? "The shot could not finish. Try again."); return; }
        const nextMatch = reply.match, simulation = reply.simulation;
        setShot(reply.shot); setError("");
        const finish = () => {
          if (stopped) return;
          onChange({ ...current, match: nextMatch, handover: current.mode === "pass-and-play" && !nextMatch.result && nextMatch.turn !== current.match.turn }, current.match.revision);
          setCommand(null); setFrame(null); setShot(defaultShot);
        };
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
      worker.postMessage({ id: current.id, match: current.match, practice: current.mode === "practice", difficulty: current.difficulty, ...(command ? { shot: command } : {}) });
    } catch { queueMicrotask(() => fail("The shot worker could not start. Retry the shot.")); }
    return () => { stopped = true; worker?.terminate(); window.clearTimeout(timeout); cancelAnimationFrame(animation); };
  }, [session, match, command, thinking, paused, retry, onChange]);

  function shoot(input: Shot = shot) {
    if (locked) return;
    try { validateShot(match, input); setError(""); setDialog(null); setCommand(input); } catch (e) { setError(e instanceof Error ? e.message : "Please adjust your shot."); }
  }
  const orientation = session.mode === "pass-and-play" ? match.turn : session.humanSide;
  const topSide = opposite(orientation), bottomSide = orientation;
  const status = paused ? "Game paused" : match.result ? `${session.players[match.result.winner]} wins!` : session.handover ? `Pass to ${session.players[match.turn]}` : error ? "Shot needs attention" : frame ? "Shot in motion…" : thinking ? "Computer is finding an angle…" : command ? "Preparing your shot…" : session.mode === "practice" && match.pieces.length === 0 ? "Board cleared. Take another board." : `${session.players[match.turn]} to play`;
  const strip = (side: "cream" | "ink") => <div className={styles.playerStrip}><span><Coin color={side} /><span>{session.players[side]}<small>{sideName(side).toUpperCase()} · {9 - match.pocketed[side].length} REMAINING{match.debt[side] ? ` · ${match.debt[side]} OWED` : ""}</small></span></span><span className={styles.tag}>{side === match.turn && !match.result ? "Your turn" : `${match.pocketed[side].length} / 9`}</span></div>;
  return <section className={`${styles.boardPreview} ${styles.activeGame}`} aria-labelledby="game-title">
    <div className={styles.boardColumn}>{strip(topSide)}<Board match={match} shot={shot} frame={frame} orientation={orientation} locked={locked} onAim={setShot} onShoot={shoot} onPull={setPulling} />{strip(bottomSide)}</div>
    <aside className={styles.previewControls}>
      <div className={styles.gameStatus}><p className={styles.eyebrow}>{session.mode === "practice" ? "Your quiet corner" : session.mode === "computer" ? `Computer · ${session.difficulty}` : "A board between friends"}</p><h1 id="game-title" tabIndex={-1} role="status">{status}</h1><span className={styles.queenStatus}><Coin color="queen" />{match.queen === "covered" ? `Covered by ${session.players[match.coverSide!]}` : match.queen === "pending" ? "Queen needs cover · next shot" : "Queen uncovered"}</span></div>
      <div className={styles.controlPaper}>
        <div className={styles.dragInstructions}><span className={styles.dragNumber}>01</span><span>Slide the striker along your baseline.</span><span className={styles.dragNumber}>02</span><span>Pull back to aim. A longer pull adds power.</span><span className={styles.dragNumber}>03</span><span>Release to strike. Return to the striker to cancel.</span></div>
        <div className={styles.powerReadout}><span>{pulling ? "Release to strike" : "Pull back to strike"}</span><output>{pulling ? shot.power : 0}%</output><meter min={0} max={100} value={pulling ? shot.power : 0} aria-label="Shot power" /></div>
        {session.handover ? <button className={styles.primary} disabled={paused} onClick={() => onChange({ ...session, handover: false }, match.revision)}>I&apos;m ready · {sideName(match.turn)}<Icon name="arrow" /></button> : match.result || (session.mode === "practice" && match.pieces.length === 0) ? <button className={styles.primary} onClick={onAgain}>Another board<Icon name="arrow" /></button> : error && thinking ? <button className={styles.primary} disabled={paused} onClick={() => { setError(""); setRetry((n) => n + 1); }}>Retry computer shot</button> : <p className={styles.dragHint}>Slide. Pull. Release.<br /><small>The dotted guide shows the striker path and cushion bounces, up to the first coin or pocket.</small></p>}
      </div>
      <div className={styles.shotReport} aria-live="polite" aria-atomic="true">{error ? <p role="alert">{error}</p> : <><p>{match.messages[0]}</p>{match.messages.length > 1 && <button className={styles.textButton} onClick={() => setDialog("details")}>Shot details<Icon name="arrow" /></button>}</>}</div>
      <div className={styles.previewActions}><button className={styles.textButton} onClick={onBack}><Icon name="back" />Choose a mode</button><button className={styles.textButton} onClick={() => setDialog("options")}>Board options<Icon name="arrow" /></button></div>
      <p className={styles.saveNote}>{saved ? "Settled board saved on this device." : "Saving unavailable. Keep this tab open to continue."}</p>
    </aside>
    {dialog && <Dialog title={dialog === "resign" ? "Resign this board?" : dialog === "new" ? "Take another board?" : dialog === "keyboard" ? "Keyboard shot controls" : "Your board"} onClose={() => setDialog(null)}>
      {dialog === "keyboard" ? <div className={styles.keyboardControls}>        <label className={styles.slider}><span>Striker position<output>{shot.position === 0 ? "Center" : `${Math.abs(shot.position)}% ${shot.position < 0 ? "left" : "right"}`}</output></span><input type="range" min={-100} max={100} value={shot.position} disabled={locked} onChange={(e) => setShot({ ...shot, position: snapPosition(Number(e.target.value)) })} aria-valuetext={`${shot.position} percent along your baseline`} /></label>
        <label className={styles.slider}><span>Aim<output>{shot.angle}°</output></span><input type="range" min={-75} max={75} value={shot.angle} disabled={locked} onChange={(e) => setShot({ ...shot, angle: Number(e.target.value) })} aria-valuetext={`${shot.angle} degrees`} /></label>
        <label className={styles.slider}><span>Power<output>{shot.power}%</output></span><input type="range" min={1} max={100} value={shot.power} disabled={locked} onChange={(e) => setShot({ ...shot, power: Number(e.target.value) })} aria-valuetext={`${shot.power} percent`} /></label>
<button className={styles.primary} disabled={locked} onClick={() => shoot()}>Confirm shot<Icon name="arrow" /></button></div> : dialog === "details" ? <>{match.messages.map((message, i) => <p key={i}>{message}</p>)}</> : dialog === "options" ? <><p>{session.mode === "practice" ? "Practice has no penalties or winner. Try any coin." : "Own coins earn another shot. Cover the queen before clearing your final coin."}</p><p>Slide the striker along your baseline, then pull it backward to aim and add power. Release to shoot. Pull back onto the striker to cancel.</p><p>{saved ? "Only settled positions are saved. Reloading a moving shot restores the previous board." : "Device storage is unavailable. Progress is kept in this tab."}</p><div className={styles.dialogActions}><button className={styles.primary} disabled={busy || session.handover || Boolean(match.result)} onClick={() => setDialog("keyboard")}>Keyboard controls</button><button className={styles.primary} disabled={busy} onClick={() => setDialog("new")}>New board</button>{session.mode !== "practice" && !match.result && <button className={styles.textButton} disabled={busy || session.handover} onClick={() => setDialog("resign")}>Resign</button>}<button className={styles.textButton} onClick={() => setDialog(null)}>Back to board</button></div></> : <><p>{dialog === "new" ? "This replaces the current saved board. The opening player alternates." : `${session.players[match.turn]} concedes this board. ${session.players[opposite(match.turn)]} wins.`}</p><div className={styles.dialogActions}><button className={styles.primary} onClick={() => { if (dialog === "new") onAgain(); else onChange({ ...session, match: resign(match), handover: false }, match.revision); setDialog(null); }}>{dialog === "new" ? "Start new board" : "Resign board"}</button><button className={styles.textButton} onClick={() => setDialog(null)}>Keep playing</button></div></>}
    </Dialog>}
  </section>;
}
