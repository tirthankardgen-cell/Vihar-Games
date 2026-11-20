"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adjacent, hint, move, newRun, PUZZLES, puzzleById, redo, solved, undo, type Run, type Size } from "@/games/mosaic-shift/engine";
import { addRecord, loadRecords, loadSession, RECORDS_KEY, recordKey, saveSession, SESSION_KEY, SETTINGS_KEY, type Records } from "@/games/mosaic-shift/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { useGameAudio } from "@/lib/use-game-audio";
import { GameAudioControls } from "@/components/game-audio-controls";
import { Pattern, MakerMark } from "./art";
import { MosaicPreview, StudioFooter, StudioNav } from "./shared";
import { RulesBook } from "./rules-book";
import styles from "./mosaic.module.css";
type View = "loading" | "setup" | "playing" | "paused" | "result";
type Modal = "reference" | "restart" | "replace" | "options" | "rules" | null;
const formatTime = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const names: Record<Size, string> = { 3: "Miniature", 4: "Studio", 5: "Wall panel" };
export default function MosaicPlay() {
  const router = useRouter();
  const [view, setView] = useState<View>("loading"), [run, setRun] = useState<Run | null>(null);
  const [selected, setSelected] = useState(PUZZLES[0].id), [records, setRecords] = useState<Records>({});
  const [notice, setNotice] = useState(""), [feedback, setFeedback] = useState("Slide a neighbouring tile into the empty space.");
  const [hintTile, setHintTile] = useState<number | null>(null), [zoom, setZoom] = useState(false), [focused, setFocused] = useState(0);
  const [modal, setModal] = useState<Modal>(null), [motion, setMotion] = useState<{ tile: number; x: string; y: string } | null>(null);
  const runtime = useRef<{ run: Run | null; view: View; records: Records; last: number }>({ run: null, view: "loading", records: {}, last: 0 });
  const buttons = useRef(new Map<number, HTMLButtonElement>()), dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLElement | null>(null);
  const vihar = useViharPlay("mosaic-shift", !!run && view !== "setup" && view !== "loading", view === "playing");
  const audio = useGameAudio("mosaic-shift", view === "playing", vihar.paused);
  const persist = useCallback((value: Run) => {
    try { localStorage.setItem(SESSION_KEY, saveSession(value)); } catch { setNotice("Progress cannot be saved in this browser. You can still play."); }
  }, []);
  const publish = useCallback((value: Run, nextView: View) => {
    runtime.current.run = value; runtime.current.view = nextView; setRun(value); setView(nextView); persist(value);
  }, [persist]);
  const syncTime = useCallback(() => {
    const r = runtime.current; if (r.view !== "playing" || !r.run) return;
    const now = performance.now(), delta = Math.max(0, now - r.last); r.last = now;
    if (document.visibilityState === "visible" && document.hasFocus() && delta <= 1000) r.run = { ...r.run, elapsedMs: r.run.elapsedMs + delta };
  }, []);
  const pause = useCallback(() => {
    if (runtime.current.view !== "playing" || !runtime.current.run) return;
    syncTime(); publish(runtime.current.run, "paused");
  }, [publish, syncTime]);
  useEffect(() => {
    let disposed = false;
    const current = runtime.current;
    queueMicrotask(() => {
      if (disposed) return;
      let saved: Run | null = null, best: Records = {};
      try {
        const raw = localStorage.getItem(SESSION_KEY); saved = loadSession(raw); best = loadRecords(localStorage.getItem(RECORDS_KEY));
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null"); if (puzzleById(settings?.puzzleId)) setSelected(settings.puzzleId);
        if (raw && !saved) setNotice("The saved mosaic is damaged or outdated. Choose a fresh study.");
      } catch { setNotice("Local storage is unavailable. You can still play a fresh study."); }
      runtime.current.records = best; setRecords(best);
      if (saved) { publish(saved, solved(saved.tiles) ? "result" : "paused"); setSelected(saved.puzzleId); setFeedback("Your mosaic is saved. Resume when you are ready."); }
      else { runtime.current.view = "setup"; setView("setup"); }
    });
    return () => { disposed = true; if (current.run) persist(current.run); current.view = "paused"; };
  }, [persist, publish]);
  useEffect(() => {
    const blur = () => pause(), visibility = () => { if (document.visibilityState !== "visible") pause(); };
    window.addEventListener("blur", blur); window.addEventListener("pagehide", blur); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("blur", blur); window.removeEventListener("pagehide", blur); document.removeEventListener("visibilitychange", visibility); };
  }, [pause]);
  useEffect(() => { if (vihar.paused) queueMicrotask(pause); }, [vihar.paused, pause]);
  useEffect(() => {
    if (view !== "playing") return;
    runtime.current.last = performance.now();
    const timer = setInterval(() => {
      if (vihar.paused || !document.hasFocus() || document.visibilityState !== "visible" || performance.now() - runtime.current.last > 1000) { pause(); return; }
      syncTime(); if (runtime.current.run && runtime.current.view === "playing") { setRun(runtime.current.run); persist(runtime.current.run); }
    }, 250);
    return () => clearInterval(timer);
  }, [view, vihar.paused, pause, syncTime, persist]);
  useEffect(() => { if (!motion) return; const timer = setTimeout(() => setMotion(null), 130); return () => clearTimeout(timer); }, [motion]);
  useEffect(() => {
    if (!modal) return;
    trigger.current = document.activeElement as HTMLElement; const element = dialog.current; element?.showModal();
    return () => { element?.close(); trigger.current?.focus(); };
  }, [modal]);
  useEffect(() => {
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dialog.current?.open) { e.stopPropagation(); return; }
      if ((e.target as HTMLElement)?.closest('[aria-label="Sound and music"]')) return;
      if (runtime.current.view === "playing") { e.preventDefault(); e.stopPropagation(); pause(); }
    };
    document.addEventListener("keydown", key, true); return () => document.removeEventListener("keydown", key, true);
  }, [pause]);
  const choose = (id: string) => { setSelected(id); try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ puzzleId: id })); } catch { setNotice("Your study choice cannot be saved. It still works for this visit."); } };
  const start = (id = selected) => {
    const p = puzzleById(id); if (!p) return;
    setModal(null); setMotion(null); setHintTile(null); setFocused(0); setZoom(false); setFeedback("Slide a neighbouring tile into the empty space.");
    runtime.current.last = performance.now(); publish(newRun(p), "playing"); audio.cue("start");
  };
  const resume = () => {
    if (vihar.paused || !document.hasFocus() || document.visibilityState !== "visible") { setFeedback("The host has paused the studio. Resume when it is visible again."); return; }
    if (runtime.current.run) { runtime.current.last = performance.now(); publish(runtime.current.run, "playing"); }
  };
  const open = (value: Modal) => { pause(); setModal(value); };
  const exit = () => { pause(); audio.stop(); if (vihar.embedded) vihar.exit(); else router.push("/mosaic-shift"); };
  const recordResult = (value: Run) => {
    const best = addRecord(runtime.current.records, value); runtime.current.records = best; setRecords(best);
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(best)); } catch { setNotice("Your result could not be saved. It is shown here for this visit."); }
  };
  const accept = (tile: number) => {
    if (runtime.current.view !== "playing" || vihar.paused || modal || !runtime.current.run) return;
    syncTime(); const old = runtime.current.run, next = move(old, tile);
    if (next === old) { setFeedback(tile ? "That tile needs to be beside the empty cell." : "This is the empty cell. Choose a neighbouring tile."); return; }
    const from = old.tiles.indexOf(tile), to = next.tiles.indexOf(tile);
    setMotion({ tile, x: `calc(${from % old.size - to % old.size} * (100% + 5px))`, y: `calc(${Math.floor(from / old.size) - Math.floor(to / old.size)} * (100% + 5px))` });
    const complete = solved(next.tiles);
    setHintTile(null); setFocused(to); setFeedback(complete ? `Mosaic restored in ${next.moves} moves, ${formatTime(next.elapsedMs)} active time. ${next.assisted ? "Assisted" : "Unassisted"} study.` : `Tile ${tile} slid into row ${Math.floor(to / next.size) + 1}, column ${to % next.size + 1}.`);
    publish(next, complete ? "result" : "playing"); audio.cue(complete ? "complete" : "move");
    if (complete) recordResult(next);
  };
  const historyAction = (direction: "undo" | "redo") => {
    if (runtime.current.view !== "playing" || vihar.paused || !runtime.current.run) return;
    syncTime(); const old = runtime.current.run, next = direction === "undo" ? undo(old) : redo(old);
    if (next !== old) {
      const complete = solved(next.tiles);
      setMotion(null); setHintTile(null); publish(next, complete ? "result" : "playing"); audio.cue(complete ? "complete" : "undo");
      setFeedback(complete ? `Mosaic restored in ${next.moves} moves. ${next.assisted ? "Assisted" : "Unassisted"} study.` : `${direction === "undo" ? "Undo" : "Redo"} restored the arrangement. Moves and active time are retained.`);
      if (complete) recordResult(next);
    }
  };
  const showHint = () => {
    if (runtime.current.view !== "playing" || vihar.paused || !runtime.current.run) return;
    syncTime(); const suggestion = hint(runtime.current.run);
    if (suggestion.tile === null) { setFeedback("A verified hint could not be found. Your mosaic is unchanged."); return; }
    publish(suggestion.run, "playing"); setHintTile(suggestion.tile); setFeedback(`Hint: slide tile ${suggestion.tile}. This run is now assisted.`);
    buttons.current.get(suggestion.tile)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  };
  const navigate = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!run || view !== "playing") return;
    const row = Math.floor(index / run.size), col = index % run.size;
    const next = e.key === "ArrowLeft" ? row * run.size + Math.max(0, col - 1) : e.key === "ArrowRight" ? row * run.size + Math.min(run.size - 1, col + 1) : e.key === "ArrowUp" ? Math.max(0, row - 1) * run.size + col : e.key === "ArrowDown" ? Math.min(run.size - 1, row + 1) * run.size + col : null;
    if (next !== null) { e.preventDefault(); setFocused(next); buttons.current.get(run.tiles[next])?.focus(); }
    if ((e.key === "Enter" || e.key === " ") && e.repeat) e.preventDefault();
  };
  const p = puzzleById(selected) ?? PUZZLES[0], currentPuzzle = run ? puzzleById(run.puzzleId)! : p;
  const inGame = !!run && !["setup", "loading"].includes(view), active = view === "playing";
  const best = run ? records[recordKey(run)] : undefined;
  return <main id="main-content" className={`${styles.page} ${inGame ? styles.playPage : ""}`} data-mosaic-view={view} data-vihar-embedded={vihar.embedded || undefined}>
    <StudioNav embedded={vihar.embedded} onExit={() => { pause(); audio.stop(); }}>
      {inGame && view !== "result" && <button className={styles.iconButton} aria-label={active ? "Pause game" : "Resume game"} onClick={active ? pause : resume}>{active ? "Ⅱ" : "▷"}</button>}
      <GameAudioControls audio={audio} />
      <button className={styles.iconButton} aria-label="Game options" onClick={() => open("options")}>⋯</button>
      {vihar.embedded && <button className={styles.iconButton} aria-label="Exit to Vihar" onClick={exit}>↗</button>}
    </StudioNav>
    {view === "loading" && <section className={styles.loading} role="status">Opening the ceramic studio…</section>}
    {view === "setup" && <section className={styles.setup} aria-labelledby="setup-title"><div className={styles.setupCopy}>
      <header><p className={styles.eyebrow}>THE NUMBERED COLLECTION</p><h1 id="setup-title">Choose your canvas.</h1><p className={styles.description}>Three sizes. Three patterns. A little space to make sense of it all.</p></header>
      <div className={styles.presets} aria-label="Board size">{([3, 4, 5] as const).map(size => <button key={size} className={styles.preset} aria-pressed={p.size === size} onClick={() => choose(PUZZLES.find(puzzle => puzzle.size === size)!.id)}><span className={styles.presetArt}><Pattern size={size} /></span><strong>{names[size]}</strong><small>{size} × {size} · {size * size - 1} tiles</small></button>)}</div>
      <label className={styles.compactSize}>Board size<select aria-label="Board size" value={p.size} onChange={e => { const puzzle = PUZZLES.find(item => item.size === Number(e.target.value)); if (puzzle) choose(puzzle.id); }}>{([3, 4, 5] as const).map(size => <option key={size} value={size}>{names[size]} · {size} × {size}</option>)}</select></label>
      <label>Pattern study<select aria-label="Pattern study" value={selected} onChange={e => choose(e.target.value)}>{PUZZLES.filter(puzzle => puzzle.size === p.size).map(puzzle => <option key={puzzle.id} value={puzzle.id}>{puzzle.name}</option>)}</select></label>
      <p className={styles.eyebrow}>{records[`${p.id}:${p.version}:unassisted`] ? `PERSONAL BEST · ${records[`${p.id}:${p.version}:unassisted`].moves} MOVES` : "NO TIME LIMIT · PROGRESS SAVED ON THIS DEVICE"}</p>
      <div className={styles.actions}><button className={styles.primary} onClick={() => { if (run && !solved(run.tiles)) open("replace"); else start(); }}>Begin this study →</button><button className={styles.textButton} onClick={() => open("rules")}>How to play ↗</button></div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
    </div><aside className={styles.setupAside}><div className={styles.previewArea}><MosaicPreview size={p.size} complete /></div><p>{p.name}<br />The finished pattern, waiting for you.</p></aside></section>}
    {inGame && run && <section className={styles.game} aria-label="Mosaic puzzle">
      <header className={styles.gameTop}><div><p className={styles.eyebrow}>{names[run.size]} · {run.size} × {run.size}</p><h1>{currentPuzzle.name}</h1></div><dl className={styles.metrics}><div><dt>MOVES</dt><dd>{run.moves}</dd></div><div><dt>ACTIVE TIME</dt><dd>{formatTime(run.elapsedMs)}</dd></div></dl></header>
      <div className={styles.workspace}>
        <div className={styles.boardArea} aria-label="Mosaic board area"><div className={styles.board} data-zoom={zoom || undefined} data-size={run.size} style={{ gridTemplateColumns: `repeat(${run.size},1fr)`, gridTemplateRows: `repeat(${run.size},1fr)` }} role="group" aria-label={`${run.size} by ${run.size} numbered mosaic. Arrow keys focus cells; Enter or Space slides a tile.`}>
          {run.tiles.map((tile, index) => { const legal = !!tile && adjacent(index, run.empty, run.size); return <button key={tile} ref={el => { if (el) buttons.current.set(tile, el); else buttons.current.delete(tile); }} className={tile ? styles.tile : styles.empty} style={{ gridColumn: index % run.size + 1, gridRow: Math.floor(index / run.size) + 1, "--slide-x": motion?.tile === tile ? motion.x : "0", "--slide-y": motion?.tile === tile ? motion.y : "0" } as CSSProperties} data-legal={legal || undefined} data-hint={hintTile === tile || undefined} data-moving={motion?.tile === tile || undefined} disabled={!active} tabIndex={index === focused ? 0 : -1} aria-label={`${tile ? `Tile ${tile}` : "Empty cell"}, row ${Math.floor(index / run.size) + 1}, column ${index % run.size + 1}, ${legal ? "can slide" : "cannot slide"}${hintTile === tile ? ", suggested tile" : ""}`} onFocus={() => setFocused(index)} onKeyDown={e => navigate(e, index)} onClick={() => accept(tile)}>{tile ? <><Pattern size={run.size} viewBox={`${(tile - 1) % run.size * 300 / run.size} ${Math.floor((tile - 1) / run.size) * 300 / run.size} ${300 / run.size} ${300 / run.size}`} /><span>{tile}</span></> : <span>EMPTY</span>}</button>; })}
        </div></div>
        <aside className={styles.referenceCard} inert={!active}><p className={styles.eyebrow}>THE STUDIO NOTES</p><h2>One empty space.<br />Endless possibility.</h2><p>Put the numbers in order.<br />Leave the last corner empty.</p><button className={styles.secondary} onClick={() => open("reference")}>View reference ↗</button><p>Arrow keys to focus.<br />Enter or Space to slide.</p><p>{best ? `Your ${run.assisted ? "assisted" : "unassisted"} best: ${best.moves} moves.` : "A personal best starts with a first study."}</p><button className={styles.textButton} aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? "Fit board" : "Zoom board"} ↗</button></aside>
        {view === "paused" && <div className={styles.overlay}><section className={styles.statePanel} aria-labelledby="pause-title"><p className={styles.eyebrow}>LET THE CLAY REST</p><h2 id="pause-title">A moment of stillness.</h2><p>Your tiles, moves, and active time are saved.<br />The pattern will wait.</p><div className={styles.actions}><button className={styles.primary} onClick={resume}>Resume study →</button><button className={styles.secondary} onClick={() => { runtime.current.view = "setup"; setView("setup"); }}>Choose study</button></div>{notice && <p className={styles.notice}>{notice}</p>}</section></div>}
        {view === "result" && <div className={styles.overlay}><section className={styles.statePanel} aria-labelledby="result-title"><div className={styles.maker}><MakerMark /></div><p className={styles.eyebrow}>THE MAKER’S STAMP · {run.assisted ? "ASSISTED STUDY" : "UNASSISTED STUDY"}</p><h2 id="result-title">Everything in its place.</h2><p>{currentPuzzle.name} · {names[run.size]} · {run.size} × {run.size}</p><dl className={styles.resultStats}><div><dt>Moves</dt><dd>{run.moves}</dd></div><div><dt>Active time</dt><dd>{formatTime(run.elapsedMs)}</dd></div><div><dt>Hints</dt><dd>{run.hints}</dd></div></dl><p>{best ? `Personal best in this ${run.assisted ? "assisted" : "unassisted"} study: ${best.moves} moves · ${formatTime(best.elapsedMs)}.` : "Your finished study, made one slide at a time."}</p><div className={styles.actions}><button className={styles.primary} onClick={() => start(run.puzzleId)}>Study again →</button><button className={styles.secondary} onClick={() => { runtime.current.view = "setup"; setView("setup"); }}>New pattern</button></div>{notice && <p className={styles.notice}>{notice}</p>}</section></div>}
      </div>
      <div className={styles.toolbar} aria-label="Puzzle controls" inert={!active}><button disabled={!active || run.cursor === 0} onClick={() => historyAction("undo")}>↶ Undo</button><button disabled={!active || run.cursor === run.history.length} onClick={() => historyAction("redo")}>↷ Redo</button><button disabled={!active} onClick={showHint}>✧ Hint</button><button onClick={() => open("reference")}>▦ Reference</button><button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? "− Fit" : "+ Zoom"}</button><button onClick={() => open("restart")}>↻ Restart</button></div>
      <div className={styles.feedback}><p role="status" aria-live="polite" title={notice || feedback}>{notice || feedback}</p><span>{run.assisted ? `ASSISTED · ${run.hints} HINTS` : "UNASSISTED"}</span></div>
    </section>}
    <StudioFooter />
    {modal && <dialog ref={dialog} className={styles.dialog} onCancel={() => setModal(null)} aria-labelledby="dialog-title"><div className={styles.dialogHeading}><h2 id="dialog-title">{modal === "reference" ? "The finished mosaic" : modal === "restart" ? "Begin the same study again?" : modal === "replace" ? "Begin a fresh study?" : modal === "rules" ? "Notes from the studio" : "Your studio"}</h2><button className={styles.iconButton} aria-label="Close dialog" onClick={() => setModal(null)}>×</button></div>
      {modal === "reference" && <><div className={styles.previewArea}><MosaicPreview size={run?.size ?? p.size} complete /></div><p>Numbers in order. Empty at the bottom right.<br />Reference does not mark assistance.</p></>}
      {modal === "restart" && <><p>The same authored mosaic returns with zero moves, hints, and active time. Your personal records stay on this device.</p><div className={styles.actions}><button className={styles.secondary} onClick={() => setModal(null)}>Keep this study</button><button className={styles.primary} onClick={() => start(run?.puzzleId ?? selected)}>Restart study →</button></div></>}
      {modal === "replace" && <><p>This replaces your unfinished mosaic with {p.name}. Your personal records stay on this device.</p><div className={styles.actions}><button className={styles.secondary} onClick={() => setModal(null)}>Keep saved mosaic</button><button className={styles.primary} onClick={() => start()}>Begin fresh study →</button></div></>}
      {modal === "rules" && <RulesBook />}
      {modal === "options" && <div className={styles.menu}><button className={styles.secondary} onClick={() => { setModal(null); runtime.current.view = "setup"; setView("setup"); }}>Choose a study</button>{run && !solved(run.tiles) && <button className={styles.secondary} onClick={() => { setModal(null); publish(run, "paused"); }}>Return to saved study</button>}<button className={styles.secondary} onClick={() => setModal("rules")}>How to play</button><Link className={styles.secondary} href="/mosaic-shift" onClick={() => { pause(); audio.stop(); }}>Studio overview ↗</Link><button className={styles.secondary} onClick={exit}>{vihar.embedded ? "Exit to Vihar" : "Leave the studio"} ↗</button></div>}
    </dialog>}
  </main>;
}
