"use client";
import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { claimDraw, claimReason, makeMove, offerDraw, opposite, pieceNames, resign, respondToDraw, resultText, rewind, sideName, type Match, type MoveInput, type Promotion, type Square } from "@/games/chess/engine";
import type { ComputerDecision } from "@/games/chess/computer";
import type { Session } from "@/games/chess/persistence";
import { Board } from "./board";
import { Dialog, Mentor } from "./shared";
import { Piece } from "./pieces";
import styles from "./chess.module.css";

export function LocalGame({ session, onChange, onBack, onAgain, saved, paused = false }: { session: Session; onChange: (session: Session, expectedRevision?: number) => boolean; onBack: () => void; onAgain: () => void; saved: boolean; paused?: boolean }) {
  const { match } = session, board = new Chess(match.fen), turn = board.turn();
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<MoveInput | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [intended, setIntended] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [workerError, setWorkerError] = useState("");
  const [retry, setRetry] = useState(0);
  const thinking = session.mode === "computer" && turn !== session.humanSide && !match.result;
  const locked = Boolean(paused || match.result || session.handover || thinking || promotion);
  const actor = session.mode === "computer" ? session.humanSide : turn;
  const orientation = flipped ? opposite(session.humanSide) : session.humanSide;
  const live = useRef(session);
  useEffect(() => { live.current = session; }, [session]);

  useEffect(() => {
    if (paused || !thinking) return;
    let worker: Worker | null = null, stopped = false;
    const current = session;
    const fail = () => { if (!stopped) setWorkerError("Acharya Dev couldn't finish thinking. Retry, or undo and choose another move."); };
    try {
      worker = new Worker(new URL("../../games/chess/computer.worker.ts", import.meta.url), { type: "module" });
      worker.onerror = fail;
      worker.onmessage = (event: MessageEvent<{ id: string; revision: number; fen: string; decision: ComputerDecision | null; error?: string }>) => {
        if (stopped || current.id !== live.current.id || current.match.revision !== live.current.match.revision) return;
        const reply = event.data;
        if (reply.id !== current.id || reply.revision !== current.match.revision || reply.fen !== current.match.fen) return;
        if (reply.error || !reply.decision) { fail(); return; }
        try {
          const decision = reply.decision, side = opposite(current.humanSide);
          const next = "move" in decision ? makeMove(current.match, decision.move, side)
            : "claim" in decision ? claimDraw(current.match, side)
            : respondToDraw(current.match, side, decision.acceptDraw);
          onChange({ ...current, match: next }, current.match.revision);
          setNotice("acceptDraw" in decision ? decision.acceptDraw ? "Acharya Dev accepts your draw." : "Acharya Dev would like to keep playing." : "");
        } catch { fail(); }
      };
      worker.postMessage({ id: current.id, match: current.match, difficulty: current.difficulty });
    } catch { queueMicrotask(fail); }
    return () => { stopped = true; worker?.terminate(); };
  }, [session, thinking, retry, onChange, paused]);

  function update(next: Match, handover = false) {
    if (onChange({ ...session, match: next, handover }, match.revision)) { setSelected(null); setPromotion(null); setNotice(""); setWorkerError(""); }
  }
  function attempt(action: () => Match, handover = false) {
    try { update(action(), handover); } catch (error) { setNotice(error instanceof Error ? error.message : "Please try that again."); }
  }
  function move(input: MoveInput) {
    try {
      const next = makeMove(match, input, actor);
      update(next, session.mode === "pass-and-play" && !next.result);
    } catch (error) { setNotice(error instanceof Error ? error.message : "That move was not accepted."); }
  }
  function select(square: Square) {
    if (locked) return;
    const piece = board.get(square);
    if (selected === square) { setSelected(null); setNotice(""); return; }
    if (selected) {
      const possibilities = board.moves({ square: selected, verbose: true }).filter((m) => m.to === square);
      if (possibilities.length) {
        const input = { from: selected, to: square };
        if (possibilities.some((m) => m.promotion)) setPromotion(input); else move(input);
        return;
      }
    }
    if (piece?.color === actor) {
      setSelected(square);
      const destinations = [...new Set(board.moves({ square, verbose: true }).map((m) => m.to))];
      setNotice(`${sideName(piece.color)} ${pieceNames[piece.type]} on ${square}. ${destinations.length ? `Legal destinations: ${destinations.join(", ")}.` : "No legal moves."}`);
    } else setNotice("Choose one of your pieces, then a marked destination.");
  }
  function undo() {
    const count = session.mode === "computer" ? turn === session.humanSide ? 2 : 1 : 1;
    onChange({ ...session, match: rewind(match, count), handover: false, practice: true }, match.revision);
    setSelected(null); setNotice("Move taken back. This is a practice game."); setWorkerError("");
  }
  const canUndo = session.mode === "computer" ? match.moves.length >= (turn === session.humanSide ? 2 : 1) : match.moves.length > 0;
  const legalMoves = board.moves({ verbose: true });
  const intendedMove = intended === "" ? undefined : legalMoves[Number(intended)] as MoveInput;
  const eligible = claimReason(match, intendedMove);
  const status = paused ? "Game paused." : match.result ? resultText(match.result) : session.handover ? `Pass to ${session.players[turn]} · ${sideName(turn)}` : thinking ? "Acharya Dev is thinking…" : `${session.players[turn]} to move · ${sideName(turn)}${board.isCheck() ? " is in check!" : ""}`;

  return <section className={styles.gameSection}>
    <div className={styles.gameHeading}><div><p className={styles.eyebrow}>{session.mode === "computer" ? `A game with Acharya Dev · ${session.difficulty}` : "A game between friends"}</p><h1>A little thought. Your next move.</h1></div><span className={styles.tag}>Untimed{session.practice ? " · Practice" : ""}</span></div>
    <div className={styles.gameLayout}>
      <div className={styles.boardColumn}>
        <div className={styles.playerBar}>{session.mode === "computer" && opposite(orientation) !== session.humanSide ? <Mentor compact /> : <strong>{session.players[opposite(orientation)]}</strong>}<span>{sideName(opposite(orientation))}</span></div>
        <div className={styles.boardArea}>
          <Board match={match} orientation={orientation} selected={selected} onSelect={select} locked={locked} />
        </div>
        <div className={styles.playerBar}>{session.mode === "computer" && orientation !== session.humanSide ? <Mentor compact /> : <strong>{session.players[orientation]}</strong>}<span>{sideName(orientation)}</span></div>
        <p className={styles.boardHelp}>Tap a piece, then a marked square. Keyboard: arrows to explore, Enter to select.</p>
      </div>
      <aside className={styles.gameAside} aria-label="Game information">
        <div className={styles.panel}><p className={styles.eyebrow}>{match.result ? "The final position" : "At the board"}</p><h2 className={styles.turn} role="status" aria-live="polite">{status}</h2>
          {!match.result && board.isCheck() && <p>Your king is attacked. Block, capture the attacker, or move the king to safety.</p>}
          {session.handover && <div className={styles.handover}><p>The next move waits for the other player.</p><button className={styles.primary} onClick={() => onChange({ ...session, handover: false }, match.revision)}>I&apos;m {session.players[turn]} — ready</button></div>}
          {match.result && <div className={styles.actions}><button className={styles.primary} onClick={onAgain}>Play again</button><button className={styles.secondary} onClick={onBack}>Choose a mode</button></div>}
          {workerError && <div role="alert"><p>{workerError}</p><button className={styles.secondary} onClick={() => { setWorkerError(""); setRetry((n) => n + 1); }}>Retry computer</button></div>}
          {match.drawOffer && !match.result && <div className={styles.drawNotice}><p>{session.players[match.drawOffer]} offers a draw.{match.drawOffer === actor ? " Complete your move to pass the offer." : " Accept, decline, or play a move."}</p>{match.drawOffer !== actor && !session.handover && <div className={styles.actions}><button className={styles.primary} onClick={() => attempt(() => respondToDraw(match, actor, true))}>Accept draw</button><button className={styles.secondary} onClick={() => attempt(() => respondToDraw(match, actor, false))}>Decline</button></div>}</div>}
          <p className={styles.liveNotice} role="status" aria-live="polite">{notice}</p>
        </div>
        <div className={styles.panel}><div className={styles.panelHeading}><h2>Move book</h2><span>{match.moves.length} half-moves</span></div>
          <div className={styles.moveBook} tabIndex={0} aria-label="Move history">
            {!match.notation.length ? <p className={styles.emptyBook}>Every good game begins with a possibility.<br />White moves first.</p> : <table><thead><tr><th scope="col">#</th><th scope="col">White</th><th scope="col">Black</th></tr></thead><tbody>{Array.from({ length: Math.ceil(match.notation.length / 2) }, (_, i) => <tr key={i}><th scope="row">{i + 1}.</th><td>{match.notation[i * 2]}</td><td>{match.notation[i * 2 + 1] ?? "—"}</td></tr>)}</tbody></table>}
          </div>
          {match.notation.length > 0 && <p className={styles.lastText}>Last move: {match.notation.at(-1)} · {match.moves.at(-1)?.from} → {match.moves.at(-1)?.to}</p>}
        </div>
        <div className={styles.controls} inert={paused}>
          <button className={styles.secondary} onClick={() => { setFlipped(!flipped); setSelected(null); }}>Flip board</button>
          <button className={styles.secondary} disabled={!canUndo || session.handover || Boolean(match.result)} onClick={undo}>Undo {session.mode === "computer" ? "turn" : "move"}</button>
          <button className={styles.secondary} disabled={locked || Boolean(match.drawOffer)} onClick={() => attempt(() => offerDraw(match, actor))}>Offer draw</button>
          <button className={styles.secondary} disabled={locked} onClick={() => { setIntended(""); setClaiming(true); }}>Claim draw</button>
          <button className={styles.secondary} disabled={Boolean(match.result || session.handover)} onClick={() => setConfirmResign(true)}>Resign</button>
          <button className={styles.secondary} onClick={() => { if (saved || match.result) onBack(); else setConfirmLeave(true); }}>{saved ? "Save & leave" : "Leave game"}</button>
        </div>
        <p className={styles.small}>{saved ? "Saved on this device. Come back whenever you like." : "Storage is unavailable. Keep this tab open to continue your game."} {session.mode === "computer" && "Undo takes back your move and the computer's reply."}</p>
      </aside>
    </div>
    {promotion && <Dialog title="Choose your promotion" onClose={() => setPromotion(null)}><p>Your pawn has reached the last rank. Choose its new piece to complete this move.</p><div className={styles.promotion}>{(["q", "r", "b", "n"] as Promotion[]).map((type) => <button key={type} className={styles.secondary} onClick={() => move({ ...promotion, promotion: type })}><Piece type={type} color={actor} /><span>{pieceNames[type]}</span></button>)}</div><button className={styles.textButton} onClick={() => setPromotion(null)}>Cancel move</button></Dialog>}
    {confirmResign && <Dialog title="Resign this game?" onClose={() => setConfirmResign(false)}><p>{session.players[opposite(actor)]} will win by resignation.</p><div className={styles.actions}><button className={styles.primary} onClick={() => { attempt(() => resign(match, actor)); setConfirmResign(false); }}>Yes, resign</button><button className={styles.secondary} onClick={() => setConfirmResign(false)}>Keep playing</button></div></Dialog>}
    {confirmLeave && <Dialog title="Leave this unsaved game?" onClose={() => setConfirmLeave(false)}><p>This browser cannot save your game. You can return to it from the mode screen while this tab stays open, but it will be lost if you refresh or close the tab.</p><div className={styles.actions}><button className={styles.primary} onClick={onBack}>Leave without saving</button><button className={styles.secondary} onClick={() => setConfirmLeave(false)}>Keep playing</button></div></Dialog>}
    {claiming && <Dialog title="Claim a draw" onClose={() => setClaiming(false)}><p>Claim on three occurrences of the same position, or 50 moves by each side without a pawn move or capture. You can also declare a legal intended move that would meet either condition.</p><label className={styles.field}>Position to check<select value={intended} onChange={(e) => setIntended(e.target.value)}><option value="">Current position</option>{legalMoves.map((m, i) => <option key={i} value={i}>After {m.san} ({m.from} → {m.to})</option>)}</select></label><p role="status">{eligible ? `Valid claim: ${eligible === "threefold-repetition" ? "threefold repetition" : "50-move rule"}.` : "This position does not meet a claim condition."}</p><div className={styles.actions}><button disabled={!eligible} className={styles.primary} onClick={() => { attempt(() => claimDraw(match, actor, intendedMove)); setClaiming(false); }}>Confirm draw claim</button><button className={styles.secondary} onClick={() => setClaiming(false)}>Keep playing</button></div></Dialog>}
  </section>;
}
