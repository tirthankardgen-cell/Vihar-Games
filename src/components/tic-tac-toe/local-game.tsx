"use client";

import { useEffect, useState } from "react";
import { markForSeat, nextRound, otherSeat, playMove, resignMatch, type Seat } from "@/games/tic-tac-toe/engine";
import { computerMove } from "@/games/tic-tac-toe/computer";
import type { LocalSession } from "@/games/tic-tac-toe/persistence";
import { Board } from "./board";
import { Arrow, ButtonOutline, DoodleMark } from "./doodles";
import { Steps } from "./notebook";
import styles from "./notebook.module.css";

type Props = { session: LocalSession; onChange: (session: LocalSession, expectedRevision: number) => boolean; onBack: () => void; saved: boolean; paused?: boolean };

export function LocalGame({ session, onChange, onBack, saved, paused = false }: Props) {
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [error, setError] = useState("");
  const match = session.match;
  const thinking = session.mode === "computer" && match.status === "playing" && match.actor === 1;
  const finished = match.status === "finished";

  useEffect(() => {
    if (paused || session.mode !== "computer" || session.match.status !== "playing" || session.match.actor !== 1) return;
    let cancelled = false;
    let worker: Worker | null = null;
    const snapshot = session;
    const commit = (cell: number | null) => {
      if (cancelled || cell === null) return;
      const updated = { ...snapshot, match: playMove(snapshot.match, 1, cell), handover: false };
      if (onChange(updated, snapshot.match.revision)) setLastMove(cell);
    };
    const fallback = () => queueMicrotask(() => {
      if (!cancelled) commit(computerMove(snapshot.match.board, markForSeat(snapshot.match, 1), snapshot.difficulty));
    });
    try {
      worker = new Worker(new URL("../../games/tic-tac-toe/computer.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = ({ data }: MessageEvent<{ cell: number | null; revision: number; sessionId: string }>) => {
        if (data.revision === snapshot.match.revision && data.sessionId === snapshot.id) commit(data.cell);
      };
      worker.onerror = (event) => { event.preventDefault(); worker?.terminate(); void fallback(); };
      worker.postMessage({ board: snapshot.match.board, mark: markForSeat(snapshot.match, 1), difficulty: snapshot.difficulty, revision: snapshot.match.revision, sessionId: snapshot.id });
    } catch { void fallback(); }
    return () => { cancelled = true; worker?.terminate(); };
  }, [session, onChange, paused]);

  function move(cell: number) {
    if (paused || thinking || session.handover || finished) return;
    try {
      const updated = playMove(match, match.actor, cell);
      if (onChange({ ...session, match: updated, handover: session.mode === "pass-and-play" && updated.status === "playing" }, match.revision)) {
        setLastMove(cell); setError("");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Choose another empty square."); }
  }

  function rematch() {
    if (onChange({ ...session, match: nextRound(match), handover: false }, match.revision)) { setLastMove(null); setError(""); }
  }

  const actorName = session.players[match.actor];
  const winnerName = match.winner === null ? "" : session.players[match.winner];
  const departingName = match.winner === null ? "" : session.players[otherSeat(match.winner)];
  const title = paused ? "Game paused." : finished ? match.reason === "draw" ? "A lovely little draw." : `${winnerName} ${winnerName === "You" ? "win" : "wins"}!` : thinking ? "Computer is thinking…" : `${actorName === "You" ? "Your" : `${actorName}'s`} turn.`;
  const explanation = finished
    ? match.reason === "draw" ? "A full page. Shall we try another?"
      : match.reason === "resignation" ? `${departingName} gave up this round.`
      : match.reason === "forfeit" ? `${departingName} forfeited this round.`
      : "Three in a row. Nicely done."
    : session.handover ? `Pass the notebook to ${actorName}.` : thinking ? "A little thought, then a little ink." : `Draw an ${markForSeat(match, match.actor)} in an empty square.`;

  return <section className={`${styles.content} ${styles.gameContent}`} aria-label="Tic Tac Toe game">
    <Steps step={3} />
    <p className={styles.roundLabel}>Round {match.round} · {session.mode === "computer" ? `${session.difficulty} computer` : "pass & play"}</p>
    <div className={styles.playerRow}>
      {([0, 1] as const).map((seat) => <div key={seat} role="group" aria-label={`${session.players[seat]}, playing ${markForSeat(match, seat)}`} style={seat === 1 ? { gridColumn: 3 } : undefined}
        className={`${styles.player} ${(finished ? match.winner === seat : match.actor === seat) ? markForSeat(match, seat) === "X" ? styles.playerActiveX : styles.playerActiveO : ""}`}>
        <DoodleMark mark={markForSeat(match, seat)} /><span className={styles.playerName} title={session.players[seat]}>{session.players[seat]}</span>
      </div>)}
      <span className={styles.versus} style={{ gridColumn: 2, gridRow: 1 }} aria-hidden="true">vs</span>
    </div>
    <div id="turn-status" className={styles.status} role="status" aria-live="polite" aria-atomic="true">
      <h1 title={title}>{paused ? title : finished && match.reason !== "draw"
        ? <><span className={styles.statusName}>{winnerName}</span> {winnerName === "You" ? "win" : "wins"}!</>
        : !finished && !thinking && actorName !== "You"
          ? <><span className={styles.statusName}>{actorName}</span>&apos;s turn.</>
          : title}</h1>
      <p title={explanation}>{explanation}</p>
    </div>
    <div className={styles.boardSlot}><Board key={`${session.id}:${match.round}`} match={match} locked={paused || thinking || session.handover || finished} lastMove={lastMove} onMove={move} /></div>
    <div className={styles.scoreRow} aria-label="Session score">
      <div aria-label={`${session.players[0]}: ${match.wins[0]} wins`}><span className={styles.scoreNumber}>{match.wins[0]}</span><span className={styles.scoreLabel}>{session.players[0]}</span></div>
      <div aria-label={`${match.draws} draws`}><span className={styles.scoreNumber}>{match.draws}</span><span className={styles.scoreLabel}>Draws</span></div>
      <div aria-label={`${session.players[1]}: ${match.wins[1]} wins`}><span className={styles.scoreNumber}>{match.wins[1]}</span><span className={styles.scoreLabel}>{session.players[1]}</span></div>
    </div>
    <div className={styles.gameActions} inert={paused}>
      {session.handover ? <button className={styles.button} type="button" onClick={() => onChange({ ...session, handover: false }, match.revision)}>I&apos;m ready <Arrow /><ButtonOutline /></button>
        : finished ? <button className={styles.button} type="button" onClick={rematch}>Play Again <Arrow /><ButtonOutline /></button>
        : <button className={styles.textButton} type="button" onClick={() => {
          const seat: Seat = session.mode === "computer" ? 0 : match.actor;
          onChange({ ...session, match: resignMatch(match, seat), handover: false }, match.revision);
        }}>Give up round</button>}
      <button className={styles.textButton} type="button" onClick={onBack}>Change players <Arrow back /></button>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <p className={styles.storageNote}>{saved ? "Your page is saved here, ready when you come back." : "You can keep playing. This browser isn't saving the page."}</p>
  </section>;
}
