"use client";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Chess } from "chess.js";
import { pieceNames, sideName, type Color, type Match, type Square } from "@/games/chess/engine";
import { Piece } from "./pieces";
import styles from "./chess.module.css";

export function Board({ match, orientation, selected, onSelect, locked = false }: { match: Match; orientation: Color; selected: Square | null; onSelect: (square: Square) => void; locked?: boolean }) {
  const board = new Chess(match.fen), last = match.moves.at(-1);
  const legal = selected && !locked ? board.moves({ square: selected, verbose: true }) : [];
  const files = orientation === "w" ? "abcdefgh" : "hgfedcba";
  const ranks = orientation === "w" ? "87654321" : "12345678";
  const squares = [...ranks].flatMap((rank) => [...files].map((file) => `${file}${rank}` as Square));
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [focus, setFocus] = useState<Square>("e2");
  function key(event: KeyboardEvent, i: number) {
    const destinations: Record<string, number> = { ArrowLeft: Math.max(0, i - 1), ArrowRight: Math.min(63, i + 1), ArrowUp: Math.max(0, i - 8), ArrowDown: Math.min(63, i + 8), Home: i - i % 8, End: i - i % 8 + 7 };
    if (event.key in destinations) { event.preventDefault(); const n = destinations[event.key]; setFocus(squares[n]); buttons.current[n]?.focus(); }
  }
  return <div className={styles.boardFrame}>
    <div className={styles.rankLabels} aria-hidden="true">{[...ranks].map((r) => <span key={r}>{r}</span>)}</div>
    <div className={styles.board} role="grid" aria-label={`Chess board, ${sideName(orientation)} at the bottom. Arrow keys navigate; Enter selects a piece or destination.`} aria-disabled={locked}>
      {[...ranks].map((rank, row) => <div role="row" className={styles.boardRow} key={rank}>
        {[...files].map((file, column) => {
          const square = `${file}${rank}` as Square, piece = board.get(square), index = row * 8 + column;
          const destination = legal.find((move) => move.to === square);
          const check = piece?.type === "k" && piece.color === board.turn() && board.isCheck();
          const lastSquare = last?.from === square || last?.to === square;
          let animateFrom = last?.to === square ? last.from : null;
          if (last && board.get(last.to)?.type === "k" && Math.abs(last.from.charCodeAt(0) - last.to.charCodeAt(0)) === 2 && piece?.type === "r" && square[1] === last.to[1]) {
            if (last.to[0] === "g" && file === "f") animateFrom = `h${rank}` as Square;
            if (last.to[0] === "c" && file === "d") animateFrom = `a${rank}` as Square;
          }
          const animation: CSSProperties = animateFrom ? { "--move-x": `${(files.indexOf(animateFrom[0]) - column) * 100}%`, "--move-y": `${(ranks.indexOf(animateFrom[1]) - row) * 100}%` } as CSSProperties : {};
          return <button key={square} type="button" role="gridcell" ref={(el) => { buttons.current[index] = el; }} tabIndex={focus === square ? 0 : -1} aria-selected={selected === square} aria-disabled={locked}
            aria-label={`${square}, ${piece ? `${sideName(piece.color)} ${pieceNames[piece.type]}` : "empty"}${destination ? destination.captured ? ", legal capture" : ", legal destination" : ""}${check ? ", in check" : ""}${lastSquare ? ", last move" : ""}`}
            onKeyDown={(event) => key(event, index)} onFocus={() => setFocus(square)} onClick={() => { if (!locked) onSelect(square); }}
            className={`${styles.square} ${(file.charCodeAt(0) + Number(rank)) % 2 === 0 ? styles.dark : styles.light} ${selected === square ? styles.selected : ""} ${lastSquare ? styles.lastMove : ""} ${check ? styles.check : ""}`}>
            {piece && <span key={`${match.moves.length}-${square}`} className={`${styles.piece} ${animateFrom ? styles.movedPiece : ""}`} style={animation}><Piece type={piece.type} color={piece.color} /></span>}
            {destination && <span className={destination.captured ? styles.captureTarget : styles.moveDot} aria-hidden="true" />}
            {check && <span className={styles.checkMark} aria-hidden="true">!</span>}
          </button>;
        })}
      </div>)}
    </div>
    <div className={styles.fileLabels} aria-hidden="true">{[...files].map((f) => <span key={f}>{f}</span>)}</div>
  </div>;
}
