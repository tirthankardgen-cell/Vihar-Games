"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { addTime, check, choosePuzzle, conflicts, createRun, difficulties, difficultyDescriptions, difficultyLabels, enter, formatTime, hint, pause, redo, restart, resume, undo, values, type Difficulty, type Run } from "@/games/sudoku/engine";
import { AUDIO_KEY, defaultAudioSettings, loadAudioSettings, emptyRecords, loadDifficulty, loadRecords, loadRun, recordResult, saveValue, RECORDS_KEY, SESSION_KEY, SETTINGS_KEY, type AudioSettings, type Records } from "@/games/sudoku/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { SudokuBoard } from "./board";
import { JournalCover } from "./cover";
import { JournalDialog, JournalFooter, JournalNav } from "./shared";
import { RulesBook } from "./rules-book";
import { createSudokuAudio } from "./audio";
import styles from "./sudoku.module.css";

type View = "loading" | "setup" | "puzzle";
type Modal = "new" | "restart" | "records" | "help" | "audio" | null;
const storage = (operation: (s: Storage) => boolean) => { try { return operation(window.localStorage); } catch { return false; } };
const coordinate = (i: number) => `row ${Math.floor(i / 9) + 1}, column ${i % 9 + 1}`;

export default function SudokuPlay() {
  const [run, setRun] = useState<Run | null>(null), [view, setView] = useState<View>("loading");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy"), [selected, setSelected] = useState(0);
  const [notes, setNotes] = useState(false), [zoomed, setZoomed] = useState(false), [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState(""), [saving, setSaving] = useState(true), [records, setRecords] = useState<Records>(emptyRecords), [recordPage, setRecordPage] = useState(0);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings), [audioNotice, setAudioNotice] = useState("");
  const audio = useRef<ReturnType<typeof createSudokuAudio> | null>(null);
  const runtime = useRef<{ run: Run | null; records: Records; lastTick: number; lastSave: number }>({ run: null, records: emptyRecords(), lastTick: 0, lastSave: 0 });
  const vihar = useViharPlay("sudoku", view === "puzzle" && run?.status !== "completed" && !!run, view === "puzzle" && run?.status === "active");

  const persist = useCallback((value: Run) => { if (!storage((s) => saveValue(s, SESSION_KEY, value))) setSaving(false); }, []);
  const publish = useCallback((value: Run) => {
    const previous = runtime.current.run;
    runtime.current.run = value; runtime.current.lastTick = performance.now();
    setRun(value); persist(value);
    if (value.status === "completed") {
      audio.current?.setPlaying(false);
      if (previous?.status === "active" && previous.attemptId === value.attemptId) audio.current?.cue("complete");
      setZoomed(false);
      const updated = recordResult(runtime.current.records, value, new Date().toISOString());
      runtime.current.records = updated; setRecords(updated);
      if (!storage((s) => saveValue(s, RECORDS_KEY, updated))) setSaving(false);
    }
  }, [persist]);
  const transact = useCallback((edit: (r: Run) => Run) => {
    const current = runtime.current, now = performance.now();
    if (!current.run) return;
    const timed = addTime(current.run, Math.max(0, now - current.lastTick) / 1000);
    const next = edit(timed); publish(next); return next;
  }, [publish]);
  const pauseNow = useCallback(() => { audio.current?.stop(); if (runtime.current.run?.status === "active") transact(pause); }, [transact]);
  const resumeNow = () => {
    if (vihar.paused || document.visibilityState !== "visible" || !document.hasFocus()) return;
    audio.current?.unlock(); transact(resume); audio.current?.setPlaying(true); audio.current?.cue("resume"); setNotice("");
  };
  const begin = () => {
    audio.current?.reset(); audio.current?.unlock();
    const puzzle = choosePuzzle(difficulty, crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296, runtime.current.run?.puzzle.id);
    publish(createRun(puzzle, crypto.randomUUID())); setView("puzzle"); setModal(null); setNotes(false); setZoomed(false);
    setSelected(puzzle.clues.indexOf("0")); setNotice("");
    audio.current?.setPlaying(true); audio.current?.cue("start");
    if (!storage((s) => saveValue(s, SETTINGS_KEY, { version: 1, difficulty }))) setSaving(false);
  };
  const requestNew = () => { if (runtime.current.run && runtime.current.run.status !== "completed") setModal("new"); else begin(); };
  const restartPuzzle = () => {
    if (!runtime.current.run) return;
    audio.current?.reset(); audio.current?.unlock();
    publish(restart(runtime.current.run, crypto.randomUUID()));
    audio.current?.setPlaying(true); audio.current?.cue("start");
    setView("puzzle"); setModal(null); setNotes(false); setNotice("");
  };
  const goToSetup = () => { pauseNow(); setView("setup"); setModal(null); setNotice(""); };
  const digit = (value: number) => {
    if (vihar.paused || document.visibilityState !== "visible" || runtime.current.run?.status !== "active") return;
    const previous = runtime.current.run.cells[selected];
    audio.current?.unlock();
    const next = transact((r) => enter(r, selected, value, notes)); setNotice("");
    if (next && next.cells[selected] !== previous && next.status !== "completed") audio.current?.cue(value === 0 ? "erase" : notes ? "note" : conflicts(next, selected).length ? "conflict" : "entry");
  };
  const takeHint = () => {
    if (vihar.paused || runtime.current.run?.status !== "active") return;
    transact((r) => {
      const result = hint(r, selected);
      if (result.index !== null && result.run.status !== "completed") audio.current?.cue("hint");
      if (result.index !== null) { setSelected(result.index); setNotice(`Hint: ${coordinate(result.index)} is ${result.run.cells[result.index].value}. This run is assisted.`); }
      return result.run;
    });
  };
  const takeCheck = () => {
    if (vihar.paused || runtime.current.run?.status !== "active") return;
    transact((r) => {
      const checked = check(r), n = checked.checked.length;
      audio.current?.cue(n ? "conflict" : "check");
      setNotice(n ? `Check found ${n} incorrect ${n === 1 ? "entry" : "entries"}, marked !. This run is assisted.` : "Check: every entered answer matches the solution. Empty cells still need answers. This run is assisted.");
      return checked;
    });
  };
  const takeUndo = () => { if (!vihar.paused && runtime.current.run?.status === "active" && runtime.current.run.undo.length) { transact(undo); audio.current?.cue("undo"); setNotice("Undo restored the previous entry or notes."); } };
  const takeRedo = () => { if (!vihar.paused && runtime.current.run?.status === "active" && runtime.current.run.redo.length) { const next = transact(redo); if (next?.status !== "completed") audio.current?.cue("redo"); setNotice("Redo restored the next entry or notes."); } };
  const updateAudio = (value: AudioSettings) => {
    setAudioSettings(value); audio.current?.configure(value); audio.current?.unlock();
    if (!storage((s) => saveValue(s, AUDIO_KEY, { version: 1, ...value }))) setSaving(false);
    if (value.sound && !audioSettings.sound) audio.current?.cue("note");
  };

  useEffect(() => {
    let cancelled = false;
    const current = runtime.current;
    audio.current = createSudokuAudio(() => setAudioNotice("Audio is unavailable in this browser. Your puzzle can continue quietly."));
    audio.current.configure(defaultAudioSettings);
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const s = window.localStorage, loaded = loadRun(s), savedRecords = loadRecords(s);
        const preferences = loadAudioSettings(s); setAudioSettings(preferences); audio.current?.configure(preferences);
        current.records = savedRecords; setRecords(savedRecords); setDifficulty(loadDifficulty(s));
        if (loaded.run) {
          publish(loaded.run); setView("puzzle"); setDifficulty(loaded.run.puzzle.difficulty); setSelected(loaded.run.puzzle.clues.indexOf("0"));
          if (loaded.run.status !== "completed") setNotice("Your saved puzzle is ready. Resume when you are.");
        } else setView("setup");
        if (loaded.damaged) setNotice("The saved puzzle could not be restored. Choose a difficulty to start a fresh page.");
      } catch { setSaving(false); setView("setup"); }
    });
    return () => {
      cancelled = true;
      audio.current?.dispose(); audio.current = null;
      if (current.run) {
        const timed = addTime(current.run, Math.max(0, performance.now() - current.lastTick) / 1000);
        storage((s) => saveValue(s, SESSION_KEY, pause(timed)));
      }
    };
  }, [publish]);
  useEffect(() => {
    const tick = window.setInterval(() => {
      const r = runtime.current, now = performance.now();
      if (r.run?.status !== "active") return;
      if (document.visibilityState !== "visible" || !document.hasFocus()) { pauseNow(); return; }
      r.run = addTime(r.run, (now - r.lastTick) / 1000); r.lastTick = now;
      setRun(r.run);
      if (now - r.lastSave >= 5000) { persist(r.run); r.lastSave = now; }
    }, 1000);
    const visibility = () => { if (document.visibilityState !== "visible") pauseNow(); };
    window.addEventListener("blur", pauseNow); window.addEventListener("pagehide", pauseNow); document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(tick); window.removeEventListener("blur", pauseNow); window.removeEventListener("pagehide", pauseNow); document.removeEventListener("visibilitychange", visibility); };
  }, [pauseNow, persist]);
  useEffect(() => { if (vihar.paused) queueMicrotask(pauseNow); }, [vihar.paused, pauseNow]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !modal && runtime.current.run?.status === "active") { e.preventDefault(); e.stopImmediatePropagation(); pauseNow(); }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [modal, pauseNow]);
  useEffect(() => {
    audio.current?.setPlaying(view === "puzzle" && run?.status === "active" && !modal && !vihar.paused && document.visibilityState === "visible" && document.hasFocus());
  }, [view, run?.status, modal, vihar.paused]);

  const active = run?.status === "active" && !vihar.paused;
  const selectedConflicts = run ? conflicts(run, selected) : [];
  const boardValues = run ? values(run) : [];
  const selectedMessage = run ? `${coordinate(selected)}${run.puzzle.clues[selected] !== "0" ? " · fixed clue" : ""}${selectedConflicts.length ? ` · ${boardValues[selected]} repeats in ${selectedConflicts.join(", ")}` : run.checked.includes(selected) ? " · checked incorrect" : ""}` : "";
  const progress = boardValues.filter(Boolean).length;
  const record = records.entries[recordPage];
  const bests = (assisted: boolean) => records.entries.filter((r) => r.difficulty === difficulty && (r.hints + r.checks > 0) === assisted && !r.restarted).sort((a, b) => a.elapsed - b.elapsed)[0];

  return <main id="main-content" className={`${styles.page} ${styles.playPage}`} data-vihar-embedded={vihar.embedded || undefined}>
    <JournalNav embedded={vihar.embedded}><button className={styles.navControl} aria-label="How to play" title="How to play" onClick={() => { pauseNow(); setModal("help"); }}><span aria-hidden="true">?</span><span className={styles.navLabel}>How to play</span></button><button className={styles.navControl} aria-label="Audio settings" title="Sound and music" aria-pressed={(audioSettings.sound || audioSettings.music) && audioSettings.volume > 0} onClick={() => { pauseNow(); setModal("audio"); }}><span aria-hidden="true">♫</span><span className={styles.navLabel}>Audio</span></button>{vihar.embedded ? <button className={styles.navControl} aria-label="Exit to Vihar" title="Exit to Vihar" onClick={() => { pauseNow(); vihar.exit(); }}><span aria-hidden="true">←</span><span className={styles.navLabel}>Exit to Vihar</span></button> : <Link className={styles.navControl} aria-label="All games" title="All games" href="/"><span aria-hidden="true">←</span><span className={styles.navLabel}>All games</span></Link>}</JournalNav>
    {view === "loading" ? <section className={styles.loading} role="status">Opening your journal…</section> : view === "setup" ? <section className={styles.setup} aria-labelledby="setup-title">
      <div className={styles.setupCopy}><p className={styles.eyebrow}>A FRESH PAGE, A FAMILIAR RITUAL</p><h1 id="setup-title">Find your<br /><span>kind of quiet.</span></h1><p className={styles.setupDescription}>Choose the challenge that feels right.<br />There is no clock to beat.</p>
        <div className={styles.difficulties} role="group" aria-label="Puzzle difficulty">{difficulties.map((d) => <button key={d} className={`${styles.difficulty} ${d === difficulty ? styles.difficultySelected : ""}`} aria-pressed={d === difficulty} onClick={() => { setDifficulty(d); }}><span>{difficultyLabels[d]}<small>{difficultyDescriptions[d]}</small></span><span aria-hidden="true">{d === difficulty ? "✓" : "○"}</span></button>)}</div>
        <div className={styles.setupActions}><button className={styles.primary} onClick={requestNew}>Start a new puzzle →</button>{run && run.status !== "completed" && <button className={styles.secondary} onClick={() => { setDifficulty(run.puzzle.difficulty); setView("puzzle"); }}>Saved puzzle</button>}</div>
        <div className={styles.personalBests}><span>Unassisted best <strong>{bests(false) ? formatTime(bests(false)!.elapsed) : "—"}</strong></span><span>Assisted best <strong>{bests(true) ? formatTime(bests(true)!.elapsed) : "—"}</strong></span><button className={styles.textButton} onClick={() => { setRecordPage(0); setModal("records"); }}>Your records ↗</button></div>
        {(notice || !saving) && <p className={styles.setupNotice} role="status">{notice}{!saving && " Saving is unavailable. You can keep playing in this session."}</p>}
      </div><JournalCover />
    </section> : run && <section className={styles.game} aria-label="Sudoku play">
      <header className={styles.gameHeading}><div><p className={styles.eyebrow}>{difficultyLabels[run.puzzle.difficulty]} · {run.restarted ? "RESTARTED ATTEMPT" : "YOUR JOURNAL"}</p><h1>One square at a time.</h1></div><div className={styles.gameMeta}><span aria-label={`Active time ${formatTime(run.elapsed)}`} className={styles.timer}>{formatTime(run.elapsed)}</span><span className={styles.assistance}>{run.hints} hints · {run.checks} checks</span></div><div className={styles.gameHeadingActions}><button className={styles.secondary} onClick={goToSetup}>New puzzle</button><button className={styles.secondary} onClick={() => { pauseNow(); setModal("restart"); }}>Restart</button></div></header>
      <div className={styles.workspace}><div className={styles.boardRegion}><div className={`${styles.boardViewport} ${zoomed ? styles.panning : ""}`}>
        {run.status === "paused" || vihar.paused ? <div className={styles.pausePanel}><p className={styles.eyebrow}>YOUR PLACE IS KEPT</p><h2>A quiet moment.</h2><p>The grid and timer are paused.</p><button className={styles.primary} disabled={vihar.paused} onClick={resumeNow}>{vihar.paused ? "Waiting for Vihar…" : "Resume puzzle →"}</button></div> : <SudokuBoard run={run} selected={selected} onSelect={setSelected} onDigit={digit} onNotes={() => { if (active) setNotes((n) => !n); }} onUndo={takeUndo} onRedo={takeRedo} zoomed={zoomed} />}
      </div><div className={styles.boardCaption}><span>GRAPHITE · CLUES <i /> BLUE · YOUR INK</span><span>{progress} / 81</span></div></div>
        <aside className={styles.controls} aria-label="Puzzle controls">
          {run.status === "completed" ? <div className={styles.result} role="status"><p className={styles.eyebrow}>A PAGE WELL SPENT</p><h2>Every number<br />found its place.</h2><p>{difficultyLabels[run.puzzle.difficulty]} · {formatTime(run.elapsed)}</p><p>{run.hints + run.checks ? "Assisted" : "Unassisted"}{run.restarted ? " · Restarted" : ""}<br />{run.hints} hints · {run.checks} checks</p><div className={styles.resultActions}><button className={styles.primary} onClick={begin}>Another {difficultyLabels[run.puzzle.difficulty].toLowerCase()} puzzle →</button><button className={styles.secondary} onClick={goToSetup}>Choose difficulty</button><button className={styles.secondary} onClick={() => setModal("restart")}>Restart this puzzle</button><button className={styles.textButton} onClick={() => { setRecordPage(0); setModal("records"); }}>Your records ↗</button></div></div> : <>
            <div className={styles.controlHeading}><span className={styles.eyebrow}>YOUR {notes ? "PENCIL" : "BLUE INK"}</span><span>{notes ? "Notes mode" : "Entry mode"}</span></div>
            <div className={styles.keypad} role="group" aria-label={notes ? "Pencil note digits" : "Answer digits"}>{Array.from({ length: 9 }, (_, n) => <button key={n} className={styles.digitButton} disabled={!active} onClick={() => digit(n + 1)} aria-label={`${notes ? "Toggle note" : "Enter"} ${n + 1}`}>{n + 1}</button>)}</div>
            <div className={styles.tools}><button className={`${styles.tool} ${notes ? styles.notesActive : ""}`} disabled={!active} aria-pressed={notes} onClick={() => setNotes(!notes)}><span aria-hidden="true">✎</span>Notes: {notes ? "on" : "off"}</button><button className={styles.tool} disabled={!active} onClick={() => digit(0)}><span aria-hidden="true">⌫</span>Erase</button><button className={styles.tool} disabled={!active || !run.undo.length} onClick={takeUndo}><span aria-hidden="true">↶</span>Undo</button><button className={styles.tool} disabled={!active || !run.redo.length} onClick={takeRedo}><span aria-hidden="true">↷</span>Redo</button><button className={styles.tool} disabled={!active} onClick={takeCheck}><span aria-hidden="true">✓</span>Check</button><button className={styles.tool} disabled={!active} onClick={takeHint}><span aria-hidden="true">?</span>Hint</button><button className={styles.tool} disabled={vihar.paused} onClick={() => run.status === "paused" ? resumeNow() : pauseNow()}><span aria-hidden="true">{run.status === "paused" ? "▷" : "Ⅱ"}</span>{run.status === "paused" ? "Resume" : "Pause"}</button><button className={styles.tool} aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}><span aria-hidden="true">⌕</span>{zoomed ? "Fit grid" : "Larger grid"}</button></div>
            <p className={styles.keyboardNote}>1–9 to write · N for notes<br />Arrows to move · Delete to erase<br />Ctrl/⌘ Z to undo · Esc to pause</p>
          </>}
        </aside>
      </div><div className={styles.feedback} role="status" aria-live="polite">{!saving ? "Saving unavailable. You can keep playing this session." : notice || (run.status === "paused" ? "Paused · Resume when you are ready." : selectedMessage)}{zoomed && <span>Pan the grid or use arrow keys.</span>}</div>
    </section>}
    <JournalFooter />
    {modal === "audio" && <JournalDialog title="A quieter soundtrack" onClose={() => setModal(null)}><p>Original soft bells and a slow, gentle melody. Music plays while you solve and pauses with your puzzle.</p><div className={styles.audioOptions}><button className={styles.secondary} aria-pressed={audioSettings.sound} onClick={() => updateAudio({ ...audioSettings, sound: !audioSettings.sound })}>Sound: {audioSettings.sound ? "on" : "off"}</button><button className={styles.secondary} aria-pressed={audioSettings.music} onClick={() => updateAudio({ ...audioSettings, music: !audioSettings.music })}>Music: {audioSettings.music ? "on" : "off"}</button><label htmlFor="sudoku-volume">Volume <output>{Math.round(audioSettings.volume * 100)}%</output><input id="sudoku-volume" type="range" min="0" max="100" step="5" value={Math.round(audioSettings.volume * 100)} onChange={(e) => updateAudio({ ...audioSettings, volume: Number(e.target.value) / 100 })} /></label></div>{audioNotice && <p role="status">{audioNotice}</p>}<div className={styles.dialogActions}><button className={styles.secondary} onClick={() => updateAudio({ ...audioSettings, sound: false, music: false })}>Mute all</button><button className={styles.primary} onClick={() => setModal(null)}>Done</button></div></JournalDialog>}
    {(modal === "new" || modal === "restart") && <JournalDialog title={modal === "restart" ? "Start this page again?" : "Turn a new page?"} onClose={() => setModal(null)}><p>{modal === "restart" ? "This resets your entries, notes, time, and help counts. Your new attempt will be labelled Restarted." : `Starting a new ${difficultyLabels[difficulty].toLowerCase()} puzzle will replace your unfinished saved puzzle.`}</p><div className={styles.dialogActions}><button className={styles.secondary} onClick={() => setModal(null)}>Keep this puzzle</button><button className={styles.primary} onClick={() => modal === "restart" ? restartPuzzle() : begin()}>{modal === "restart" ? "Restart puzzle" : "Start new puzzle"}</button></div></JournalDialog>}
    {modal === "help" && <JournalDialog title="A few notes" onClose={() => setModal(null)}><RulesBook /></JournalDialog>}
    {modal === "records" && <JournalDialog title="Your puzzle journal" onClose={() => setModal(null)}>{record ? <article className={styles.recordEntry}><p className={styles.eyebrow}>{new Date(record.date).toLocaleDateString()} · {record.puzzleId}</p><h3>{difficultyLabels[record.difficulty]} · {formatTime(record.elapsed)}</h3><p>{record.hints + record.checks ? "Assisted" : "Unassisted"}{record.restarted ? " · Restarted attempt" : " · First attempt"}</p><p>{record.hints} hints · {record.checks} checks</p></article> : <p>Your completed puzzles will appear here. Records stay on this device.</p>}<div className={styles.dialogActions}><button className={styles.secondary} disabled={!recordPage} onClick={() => setRecordPage(recordPage - 1)}>← Previous</button><span>{record ? recordPage + 1 : 0} / {records.entries.length}</span><button className={styles.secondary} disabled={recordPage >= records.entries.length - 1} onClick={() => setRecordPage(recordPage + 1)}>Next →</button></div></JournalDialog>}
  </main>;
}
