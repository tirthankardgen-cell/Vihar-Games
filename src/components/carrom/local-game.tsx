"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { opposite, resign, sideName, validateShot, type Shot, type Side } from "@/games/carrom/engine";
import type { Session } from "@/games/carrom/persistence";
import type { Frame } from "@/games/carrom/physics";
import type { ShotReply } from "@/games/carrom/shot.worker";
import { opponentRemark } from "@/games/carrom/opponent";
import { Board, snapPosition } from "./board";
import { Coin } from "./board-art";
import { Dialog } from "./shared";
import { Icon } from "./icons";
import { Opponent } from "./opponent";
import { PowerMeter } from "./power-meter";
import styles from "./carrom.module.css";

const defaultShot: Shot = { position: 0, angle: 0, power: 50 };
export function LocalGame({ session, onChange, onBack, onAgain, saved, paused }: { session: Session; onChange: (s: Session, revision?: number) => boolean; onBack: () => void; onAgain: () => void; saved: boolean; paused: boolean }) {
  const { match } = session;
  const controlsId = useId();
  const [shot, setShot] = useState<Shot>(defaultShot);
  const [pulling, setPulling] = useState(false);
  const [command, setCommand] = useState<Shot | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [reportPage, setReportPage] = useState(0);
  const [dialog, setDialog] = useState<"options" | "resign" | "new" | "details" | "keyboard" | null>(null);
  const thinking = session.mode === "computer" && match.turn !== session.humanSide && !match.result;
  const busy = Boolean(command || thinking);
  const practiceComplete = session.mode === "practice" && match.pieces.length === 0;
  const locked = Boolean(paused || busy || session.handover || match.result || practiceComplete || (dialog && dialog !== "keyboard"));
  const live = useRef(session);
  useEffect(() => { live.current = session; }, [session]);

  useEffect(() => {
    if (paused || session.handover || match.result || (!command && !thinking)) return;
    let worker: Worker | null = null, stopped = false, animation = 0, playbackTimer = 0;
    const current = session, started = performance.now();
    const fail = (message: string) => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(timeout); window.clearTimeout(playbackTimer); cancelAnimationFrame(animation);
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
        const nextMatch = reply.match, simulation = reply.simulation, acceptedShot = reply.shot;
        const finish = () => {
          if (stopped) return;
          onChange({ ...current, match: nextMatch, handover: current.mode === "pass-and-play" && !nextMatch.result && nextMatch.turn !== current.match.turn }, current.match.revision);
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
        // A short, cancellable thinking beat makes Ravi's turn readable without blocking the UI.
        playbackTimer = window.setTimeout(animate, thinking ? Math.max(0, 650 - (performance.now() - started)) : 0);
      };
      worker.postMessage({ id: current.id, match: current.match, practice: current.mode === "practice", difficulty: current.difficulty, ...(command ? { shot: command } : {}) });
    } catch { queueMicrotask(() => fail("The shot worker could not start. Retry the shot.")); }
    return () => { stopped = true; worker?.terminate(); window.clearTimeout(timeout); window.clearTimeout(playbackTimer); cancelAnimationFrame(animation); };
  }, [session, match, command, thinking, paused, retry, onChange]);

  function shoot(input: Shot = shot) {
    if (locked) return;
    try { validateShot(match, input); setError(""); setPulling(false); setDialog(null); setCommand(input); } catch (e) { setError(e instanceof Error ? e.message : "Please adjust your shot."); }
  }
  const orientation = session.mode === "pass-and-play" ? match.turn : session.humanSide;
  const topSide = opposite(orientation), bottomSide = orientation;
  const winner = match.result && (session.mode === "computer" ? match.result.winner === session.humanSide ? "You win!" : "Ravi wins!" : `${sideName(match.result.winner)} wins!`);
  const status = paused ? "Game paused" : winner || (session.handover ? `Pass to ${sideName(match.turn)}` : error ? "Shot needs attention" : frame ? "In motion…" : thinking ? "Ravi is thinking…" : command ? "Here we go…" : practiceComplete ? "Every coin, pocketed." : "Your shot.");
  const remark = paused ? { text: "No hurry. Your chair will be right here when you're ready.", mood: "welcome" as const } : opponentRemark(match, session.humanSide, Boolean(thinking), Boolean(frame));
  const strip = (side: Side) => <div className={styles.playerStrip} data-active={side === match.turn && !match.result}>
    <span><Coin color={side} /><span title={session.mode === "practice" ? undefined : session.players[side]}>{session.mode === "practice" ? `${sideName(side)} coins` : session.players[side]}<small>{sideName(side).toUpperCase()} · {9 - match.pocketed[side].length} REMAINING{match.debt[side] ? ` · ${match.debt[side]} OWED` : ""}</small></span></span>
    <span className={styles.coinProgress} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} data-pocketed={i < match.pocketed[side].length} />)}</span>
    <span className={styles.tag}>{side === match.turn && !match.result && session.mode !== "practice" ? session.mode === "computer" && side !== session.humanSide ? "Ravi’s turn" : session.mode === "pass-and-play" ? "At the table" : "Your turn" : `${match.pocketed[side].length} / 9`}</span>
  </div>;

  return <section className={`${styles.boardPreview} ${styles.activeGame}`} data-mode={session.mode} data-handover={session.handover} aria-labelledby="game-title">
    <div className={styles.boardColumn}>{strip(topSide)}<Board match={match} shot={shot} frame={frame} orientation={orientation} locked={locked} onAim={setShot} onShoot={shoot} onPull={setPulling} />{strip(bottomSide)}</div>
    <aside className={styles.previewControls}>
      <div className={styles.gameStatus}><p className={styles.eyebrow}>{session.mode === "practice" ? "A little time for yourself" : session.mode === "computer" ? "GOOD COMPANY. A WORTHY RIVAL." : "A board between friends"}</p><h1 id="game-title" tabIndex={-1} aria-live="polite">{status}</h1><span className={styles.queenStatus}><Coin color="queen" /><span>{match.queen === "covered" ? `Covered by ${session.mode === "practice" ? "you" : sideName(match.coverSide!)}` : match.queen === "pending" ? "Cover the queen · your next shot" : "The queen is on the board"}</span></span></div>
      {session.mode === "computer" && <Opponent remark={remark} difficulty={session.difficulty} paused={paused} />}
      {match.result || practiceComplete ? <div className={styles.resultCard}>
        <div className={styles.resultConfetti} aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--x": `${(i * 37) % 100}%`, "--delay": `${(i % 6) * 90}ms` } as CSSProperties} />)}</div>
        <Icon name="trophy" /><p className={styles.eyebrow}>ONE FOR THE MEMORY BOOK</p><h2>{practiceComplete ? "A clean sweep." : match.result?.winner === session.humanSide && session.mode === "computer" ? "Beautifully played!" : "What a lovely game."}</h2><p>{practiceComplete ? "All 19 coins. One very steady hand." : match.result?.reason === "resignation" ? "Board won by resignation. A fresh start is waiting." : "The queen is covered. The winning set is clear."}</p><button className={styles.primary} onClick={onAgain}>One more board<Icon name="arrow" /></button>
      </div> : <div className={styles.controlPaper}>
        <div className={styles.aimHint}><Icon name="hand" /><span><strong>Slide. Pull. Release.</strong>Move the striker, pull back to aim, then let go.</span></div>
        <PowerMeter power={shot.power} pulling={pulling} moving={Boolean(frame)} disabled={locked} onChange={(power) => setShot({ ...shot, power })} />
        {session.handover ? <button className={styles.primary} disabled={paused} onClick={() => onChange({ ...session, handover: false }, match.revision)}>I’m ready · {sideName(match.turn)}<Icon name="arrow" /></button> : error && thinking ? <button className={styles.primary} disabled={paused} onClick={() => { setError(""); setRetry((n) => n + 1); }}>Retry Ravi’s shot<Icon name="reset" /></button> : <div className={styles.shotButtons}><button className={styles.primary} disabled={locked || shot.power === 0} onClick={() => shoot()}><Coin color="striker" />{pulling ? "Release to strike" : `Strike · ${shot.power}%`}</button><button className={styles.textButton} disabled={locked} onClick={() => setDialog("keyboard")}><Icon name="sliders" />Adjust aim</button></div>}
      </div>}
      <div className={styles.shotReport} aria-live="polite" aria-atomic="true">{error ? <p role="alert">{error}</p> : <><p>{match.revision === 0 ? "Slide to position. Pull back, then release." : match.messages[0]}</p>{match.revision > 0 && (match.messages.length > 1 || match.messages[0]?.length > 85) && <button className={styles.textButton} onClick={() => { setReportPage(0); setDialog("details"); }}>Shot details<Icon name="arrow" /></button>}</>}</div>
      <div className={styles.previewActions}><button className={styles.textButton} onClick={onBack}><Icon name="back" />All tables</button><button className={styles.textButton} onClick={() => setDialog("options")}><Icon name="sliders" />Board options</button></div>
      <p className={styles.saveNote} data-saved={saved}>{saved ? "Your settled board is saved. Stay for one more?" : "Saving unavailable. Keep this tab open to continue."}</p>
    </aside>
    {dialog && <Dialog title={dialog === "resign" ? "Resign this board?" : dialog === "new" ? "Take another board?" : dialog === "keyboard" ? "Fine-tune your shot" : dialog === "details" ? "Shot details" : "Your board"} onClose={() => setDialog(null)}>
      {dialog === "keyboard" ? <div className={styles.keyboardControls}>
        <label className={styles.slider} htmlFor={`${controlsId}-position`}><span>Striker position<output aria-hidden="true">{shot.position === 0 ? "Center" : `${Math.abs(shot.position)}% ${shot.position < 0 ? "left" : "right"}`}</output></span><input id={`${controlsId}-position`} type="range" min={-100} max={100} value={shot.position} disabled={locked} onChange={(e) => setShot({ ...shot, position: snapPosition(Number(e.target.value)) })} aria-valuetext={`${shot.position} percent along your baseline`} /></label>
        <label className={styles.slider} htmlFor={`${controlsId}-angle`}><span>Aim<output aria-hidden="true">{shot.angle}°</output></span><input id={`${controlsId}-angle`} type="range" min={-75} max={75} value={shot.angle} disabled={locked} onChange={(e) => setShot({ ...shot, angle: Number(e.target.value) })} aria-valuetext={`${shot.angle} degrees`} /></label>
        <PowerMeter power={shot.power} pulling={false} moving={false} disabled={locked} onChange={(power) => setShot({ ...shot, power })} />
        <button className={styles.primary} disabled={locked || shot.power === 0} onClick={() => shoot()}>Confirm shot<Icon name="arrow" /></button>
      </div> : dialog === "details" ? <><div aria-live="polite">{match.messages.slice(reportPage * 2, reportPage * 2 + 2).map((message, i) => <p key={`${reportPage}-${i}`}>{message}</p>)}</div>{match.messages.length > 2 && <div className={styles.pagination}><button className={styles.iconButton} aria-label="Previous shot details" disabled={reportPage === 0} onClick={() => setReportPage(reportPage - 1)}><Icon name="back" /></button><span>{reportPage + 1} / {Math.ceil(match.messages.length / 2)}</span><button className={styles.iconButton} aria-label="Next shot details" disabled={(reportPage + 1) * 2 >= match.messages.length} onClick={() => setReportPage(reportPage + 1)}><Icon name="arrow" /></button></div>}</> : dialog === "options" ? <>
        <p>{session.mode === "practice" ? "Practice has no penalties or winner. Try any coin." : "Own coins earn another shot. Cover the queen before clearing your final coin."}</p><p>Slide, pull back, release. Pull back onto the striker to cancel. Keyboard controls let you set an exact angle.</p><p>{saved ? "Your settled board saves on this device." : "Saving is unavailable. Keep this tab open."}</p>
        <div className={styles.dialogActions}><button className={styles.primary} disabled={busy || session.handover || Boolean(match.result) || practiceComplete} onClick={() => setDialog("keyboard")}>Keyboard controls</button><button className={styles.primary} disabled={busy} onClick={() => setDialog("new")}>New board</button>{session.mode !== "practice" && !match.result && <button className={styles.textButton} disabled={busy || session.handover} onClick={() => setDialog("resign")}>Resign</button>}<button className={styles.textButton} onClick={() => setDialog(null)}>Back to board</button></div>
      </> : <><p>{dialog === "new" ? "This replaces the current saved board. The opening player alternates." : `${session.players[match.turn]} concedes this board. ${session.players[opposite(match.turn)]} wins.`}</p><div className={styles.dialogActions}><button className={styles.primary} onClick={() => { if (dialog === "new") onAgain(); else onChange({ ...session, match: resign(match), handover: false }, match.revision); setDialog(null); }}>{dialog === "new" ? "Start new board" : "Resign board"}</button><button className={styles.textButton} onClick={() => setDialog(null)}>Keep playing</button></div></>}
    </Dialog>}
  </section>;
}
