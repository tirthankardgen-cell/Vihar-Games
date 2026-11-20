"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { addTime, createRun, formatTime, getPuzzle, hint, labels, lines, paint, pause, presets, puzzleFor, redo, resume, sizes, undo, type Mark, type Run } from "@/games/lantern-logic/engine";
import { defaultSettings, emptyRecords, loadRecords, loadRun, loadSettings, recordResult, RECORDS_KEY, saveValue, SESSION_KEY, SETTINGS_KEY, type Records, type Settings } from "@/games/lantern-logic/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { PlayButton } from "../play-tools";
import { LanternArt } from "./art";
import { LanternBoard, markLabels, type Tool } from "./board";
import { createAudio } from "./audio";
import { RulesBook } from "./rules-book";
import { WorkshopDialog, WorkshopFooter, WorkshopNav } from "./shared";
import styles from "./lantern.module.css";
type Modal = "options" | "settings" | "help" | "records" | "restart" | "new" | null;
const storage = (operation: (s: Storage) => boolean) => { try { return operation(localStorage); } catch { return false; } };
export default function LanternPlay() {
  const [view, setView] = useState<"loading" | "setup" | "puzzle">("loading"), [run, setRun] = useState<Run | null>(null);
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings }), [records, setRecords] = useState<Records>(emptyRecords);
  const [modal, setModal] = useState<Modal>(null), [selected, setSelected] = useState(0), [tool, setTool] = useState<Tool>(1), [zoom, setZoom] = useState(false), [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState(""), [saving, setSaving] = useState(true), [recordPage, setRecordPage] = useState(0);
  const runtime = useRef<{ run: Run | null; records: Records; tick: number }>({ run: null, records: emptyRecords(), tick: 0 });
  const audio = useRef<ReturnType<typeof createAudio> | null>(null);
  const vihar = useViharPlay("lantern-logic", view === "puzzle" && !!run && run.status !== "completed", view === "puzzle" && run?.status === "active" && !modal);
  const persist = useCallback((value: Run) => { if (!storage((s) => saveValue(s, SESSION_KEY, value))) setSaving(false); }, []);
  const publish = useCallback((value: Run) => {
    const previous = runtime.current.run; runtime.current.run = value; runtime.current.tick = performance.now(); setRun(value); persist(value);
    if (value.status === "completed") {
      audio.current?.setPlaying(false);
      if (previous?.status === "active" && previous.attemptId === value.attemptId) { audio.current?.bell(); setNotice("Every square has found its place. Your lantern is ready."); }
      const next = recordResult(runtime.current.records, value, new Date().toISOString()); runtime.current.records = next; setRecords(next);
      if (!storage((s) => saveValue(s, RECORDS_KEY, next))) setSaving(false);
    }
  }, [persist]);
  const transact = useCallback((edit: (value: Run) => Run) => {
    const current = runtime.current; if (!current.run) return;
    const timed = addTime(current.run, Math.max(0, performance.now() - current.tick) / 1000); const next = edit(timed); publish(next); return next;
  }, [publish]);
  const pauseNow = useCallback(() => { audio.current?.stop(); if (runtime.current.run?.status === "active") transact(pause); }, [transact]);
  const resumeNow = () => { if (vihar.paused || document.visibilityState !== "visible" || !document.hasFocus() || modal) return; audio.current?.unlock(); transact(resume); audio.current?.setPlaying(true); setNotice(""); };
  const updateSettings = (next: Settings) => { setSettings(next); audio.current?.configure(next); audio.current?.unlock(); if (!storage((s) => saveValue(s, SETTINGS_KEY, next))) setSaving(false); };
  const begin = (restart = false) => {
    if (vihar.paused) return;
    const p = restart && runtime.current.run ? getPuzzle(runtime.current.run.puzzleId)! : puzzleFor(settings.preset);
    audio.current?.unlock(); publish(createRun(p, crypto.randomUUID())); setView("puzzle"); setModal(null); setSelected(0); setTool(1); setZoom(false); setChecked(false); setNotice(""); audio.current?.setPlaying(true);
  };
  const openModal = (next: Modal) => { pauseNow(); setModal(next); };
  const mark = (indices: number[], value: Mark) => {
    if (vihar.paused || modal || document.visibilityState !== "visible" || !document.hasFocus() || runtime.current.run?.status !== "active") return;
    const previous = runtime.current.run; audio.current?.unlock(); const next = transact((r) => paint(r, indices, value)); setChecked(false); setNotice("");
    if (next && next.cells !== previous.cells && next.status !== "completed") audio.current?.pencil();
  };
  const history = (direction: "undo" | "redo") => { if (!vihar.paused && !modal && runtime.current.run?.status === "active") { const next = transact(direction === "undo" ? undo : redo); setChecked(false); setNotice(direction === "undo" ? "Previous marks restored. Hints and time are unchanged." : "Marks reapplied."); if (next?.status !== "completed") audio.current?.pencil(); } };
  const check = () => {
    if (vihar.paused || runtime.current.run?.status !== "active") return;
    const states = lines(runtime.current.run), rows = states.rows.flatMap((s, i) => s === "contradictory" ? [i + 1] : []), columns = states.columns.flatMap((s, i) => s === "contradictory" ? [i + 1] : []); setChecked(true);
    setNotice(rows.length || columns.length ? `Contradictory completed lines: ${rows.length ? `rows ${rows.join(", ")}` : ""}${rows.length && columns.length ? "; " : ""}${columns.length ? `columns ${columns.join(", ")}` : ""}.` : "No contradictory completed lines. Lines with Unknown cells are not checked.");
  };
  const takeHint = () => { if (vihar.paused || runtime.current.run?.status !== "active") return; const next = transact((r) => hint(r, selected)); setChecked(false); if (next?.status !== "completed") { audio.current?.pencil(); setNotice(`Hint: row ${Math.floor(selected / sizes[next!.preset]) + 1}, column ${selected % sizes[next!.preset] + 1} is ${markLabels[next!.cells[selected]]}. This run is assisted.`); } };
  useEffect(() => {
    let disposed = false; const current = runtime.current;
    audio.current = createAudio(() => setNotice("Audio is unavailable. You can keep solving quietly."));
    queueMicrotask(() => {
      if (disposed) return;
      try { const s = localStorage, loaded = loadRun(s), preferences = loadSettings(s), savedRecords = loadRecords(s); setSettings(preferences); audio.current?.configure(preferences); current.records = savedRecords; setRecords(savedRecords);
        if (loaded.run) { publish(loaded.run); setView("puzzle"); if (loaded.run.status !== "completed") setNotice("Your saved stencil is ready. Resume when you are."); } else setView("setup");
        if (loaded.damaged) setNotice("The saved stencil could not be restored. Choose a size for a fresh puzzle.");
      } catch { setSaving(false); setView("setup"); }
    });
    return () => { disposed = true; audio.current?.dispose(); audio.current = null; const saved = current.run; if (saved) storage((s) => saveValue(s, SESSION_KEY, pause(addTime(saved, Math.max(0, performance.now() - current.tick) / 1000)))); };
  }, [publish]);
  useEffect(() => {
    let saves = 0;
    const tick = setInterval(() => { const c = runtime.current; if (c.run?.status !== "active") return; if (document.visibilityState !== "visible" || !document.hasFocus()) { pauseNow(); return; } const now = performance.now(); c.run = addTime(c.run, (now - c.tick) / 1000); c.tick = now; setRun(c.run); if (++saves % 5 === 0) persist(c.run); }, 1000);
    const visibility = () => { if (document.visibilityState !== "visible") pauseNow(); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("dialog[open]") && runtime.current.run?.status === "active") { e.preventDefault(); e.stopImmediatePropagation(); pauseNow(); } };
    window.addEventListener("blur", pauseNow); window.addEventListener("pagehide", pauseNow); window.addEventListener("keydown", escape, true); document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(tick); window.removeEventListener("blur", pauseNow); window.removeEventListener("pagehide", pauseNow); window.removeEventListener("keydown", escape, true); document.removeEventListener("visibilitychange", visibility); };
  }, [pauseNow, persist]);
  useEffect(() => { if (vihar.paused) queueMicrotask(pauseNow); }, [vihar.paused, pauseNow]);
  useEffect(() => { audio.current?.setPlaying(view === "puzzle" && run?.status === "active" && !modal && !vihar.paused && document.visibilityState === "visible" && document.hasFocus()); }, [view, run?.status, modal, vihar.paused]);
  const active = run?.status === "active" && !vihar.paused && !modal, p = run ? getPuzzle(run.puzzleId)! : null;
  const entry = records.entries[recordPage], completedCount = (assisted: boolean) => records.entries.filter((e) => e.preset === settings.preset && e.assisted === assisted).length;
  return <main id="main-content" className={styles.page} data-vihar-embedded={vihar.embedded || undefined}>
    <WorkshopNav embedded={vihar.embedded}><PlayButton icon="audio" label="Sound and music settings" disabled={view === "loading"} onClick={() => openModal("settings")} />{view === "puzzle" && run?.status !== "completed" && <PlayButton icon={active ? "pause" : "play"} label={active ? "Pause puzzle" : "Resume puzzle"} disabled={!!modal || vihar.paused} onClick={active ? pauseNow : resumeNow} />}<PlayButton icon="menu" label="Workshop options" disabled={view === "loading"} onClick={() => openModal("options")} />{vihar.embedded && <PlayButton icon="back" label="Exit to Vihar" onClick={() => { pauseNow(); vihar.exit(); }} />}</WorkshopNav>
    <div className={styles.playContent}>
      {view === "loading" && <p className={styles.loading} role="status">Opening the workshop…</p>}
      {view === "setup" && <section className={styles.setup} aria-labelledby="setup-title"><header><p className={styles.eyebrow}>PICK A LANTERN. FIND A LITTLE FOCUS.</p><h1 id="setup-title">How much light<br className={styles.mobileBreak} /> shall we make?</h1><p>Three sizes. One quiet ritual. There is no clock to beat.</p></header><div className={styles.shelf} role="group" aria-label="Puzzle size">{presets.map((preset, i) => <button key={preset} className={styles.preset} aria-pressed={settings.preset === preset} onClick={() => updateSettings({ ...settings, preset })}><span className={styles.presetNumber}>0{i + 1}</span><LanternArt variant={preset} /><span className={styles.presetLabel}><strong>{labels[preset]}</strong><small>{sizes[preset]} × {sizes[preset]} · {i === 0 ? "A little beginning" : i === 1 ? "Settle into the craft" : "Take your time"}</small></span><span className={styles.presetCheck} aria-hidden="true">{settings.preset === preset ? "●" : "○"}</span></button>)}</div><div className={styles.setupBottom}><div className={styles.actions}><button className={styles.primary} onClick={() => run && run.status !== "completed" ? openModal("new") : begin()}>Light a new stencil →</button>{run && run.status !== "completed" && <button className={styles.secondary} onClick={() => { setView("puzzle"); }}>Saved puzzle</button>}<button className={styles.textButton} onClick={() => openModal("help")}>How to play ↗</button></div><button className={styles.recordSummary} onClick={() => { setRecordPage(0); openModal("records"); }}>Completed: {completedCount(false)} unassisted · {completedCount(true)} assisted ↗</button></div></section>}
      {view === "puzzle" && run && p && (run.status === "completed" ? <section className={styles.results} aria-labelledby="result-title"><div className={styles.resultArt}><LanternArt finished={run.cells} size={p.size} /></div><div className={styles.resultCopy}><p className={styles.eyebrow}>A PICTURE BROUGHT TO LIGHT</p><h1 id="result-title">{p.title}</h1><p>Every square has found its place.</p><dl className={styles.resultStats}><div><dt>Stencil</dt><dd>{p.size} × {p.size}</dd></div><div><dt>Active time</dt><dd>{formatTime(run.elapsed)}</dd></div><div><dt>Hints</dt><dd>{run.hints}</dd></div></dl><p className={styles.assistance}>{run.assisted ? "Assisted completion" : "Unassisted completion"} · saved on this device</p><div className={styles.actions}><button className={styles.primary} onClick={() => { setView("setup"); setNotice(""); }}>Choose a lantern →</button><button className={styles.secondary} onClick={() => { setRecordPage(0); openModal("records"); }}>Your records</button></div></div></section> : <section className={styles.game} aria-label="Lantern Logic puzzle"><div className={styles.workspace}><header className={styles.progress}><div><p className={styles.eyebrow}>{labels[p.preset].toUpperCase()} · STENCIL {p.id.slice(-2)}</p><h1>A little light, at a time.</h1></div><div className={styles.metrics}><span><strong>{run.cells.filter((c) => c !== 0).length}<small> / {run.cells.length}</small></strong>classified</span><span><strong>{run.hints}</strong>hints</span>{settings.showTime && <span><strong>{formatTime(run.elapsed)}</strong>active time</span>}</div></header>
        {active ? <LanternBoard run={run} selected={selected} onSelect={setSelected} tool={tool} zoom={zoom} checked={checked} onPaint={mark} onUndo={() => history("undo")} onRedo={() => history("redo")} /> : <div className={styles.pauseSheet}><LanternArt /><div><p className={styles.eyebrow}>YOUR PLACE IS KEPT</p><h2>The workshop is resting.</h2><p>Your marks are saved. Take your time.</p><button className={styles.primary} disabled={vihar.paused || !!modal} onClick={resumeNow}>Resume puzzle →</button>{vihar.paused && <p className={styles.pauseNote}>Return to the active Vihar player to resume.</p>}</div></div>}
        <div className={styles.tools} role="group" aria-label="Mark tools">{([1, 2, 0] as const).map((value) => <button key={value} className={styles.tool} aria-pressed={tool === value} disabled={!active} onClick={() => setTool(value)}><span aria-hidden="true" className={value === 1 ? styles.toolLit : ""}>{value === 2 ? "×" : value === 0 ? "⌫" : ""}</span>{value === 0 ? "Erase" : markLabels[value]}</button>)}<button className={styles.tool} aria-label="Select / pan" aria-pressed={tool === "select"} disabled={!active} onClick={() => setTool("select")}>↔ <small>Pan</small></button><div className={styles.toolSpacer} /><button className={styles.tool} aria-label="Undo marks" disabled={!active || !run.undo.length} onClick={() => history("undo")}>↶</button><button className={styles.tool} aria-label="Redo marks" disabled={!active || !run.redo.length} onClick={() => history("redo")}>↷</button></div>
        <div className={styles.coordinates}>Row {Math.floor(selected / p.size) + 1} · Column {selected % p.size + 1} · {markLabels[run.cells[selected]]}<span>Tool: {tool === "select" ? "Select / pan" : tool === 0 ? "Erase" : markLabels[tool]}</span></div></div>
        <aside className={styles.sidePanel}><div className={styles.sideNote}><span className={styles.noteMark} aria-hidden="true">✳</span><p className={styles.eyebrow}>FOLLOW THE NUMBERS</p><h2>Leave a little<br />room between<br />the light.</h2><p>Each number is a run of Lit squares. Separate runs with at least one Empty square.</p></div><div className={styles.assistActions}><button className={styles.secondary} disabled={!active} onClick={check}>Check lines</button><button className={styles.secondary} disabled={!active} onClick={takeHint}>Hint selected cell</button><button className={styles.secondary} disabled={!active} aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? "Fit board" : "Larger cells"}</button><button className={styles.textButton} onClick={() => openModal("help")}>Workshop notes ↗</button></div><p className={styles.keyGuide}>ARROWS · NAVIGATE<br />SPACE · LIT &nbsp; X · EMPTY<br />DELETE · ERASE</p></aside></section>)}
      <p className={styles.notice} role="status" aria-live="polite">{notice || vihar.notice || (!saving ? "Saving is unavailable. Keep this page open to retain your progress." : view === "setup" ? "One original stencil per size · your progress stays on this device." : "")}</p>
    </div><WorkshopFooter />
    {modal && <WorkshopDialog title={modal === "settings" ? "Sounds of the workshop" : modal === "help" ? "Workshop notes" : modal === "records" ? "Your finished lanterns" : modal === "restart" ? "Start this stencil again?" : modal === "new" ? "Make room for a new stencil?" : "Workshop options"} onClose={() => setModal(null)}>
      {modal === "settings" && <div className={styles.settings}><p>Soft pencil marks, one warm bell, and original Paper Lantern music.</p>{(["sound", "music", "showTime"] as const).map((key) => <button key={key} className={styles.secondary} aria-pressed={settings[key]} onClick={() => updateSettings({ ...settings, [key]: !settings[key] })}>{key === "showTime" ? "Active clock" : key === "sound" ? "Sound" : "Music"}<strong>{settings[key] ? "On" : "Off"}</strong></button>)}<p>Mute choices persist. Audio begins after interaction. Closing these notes leaves the puzzle paused.</p></div>}
      {modal === "help" && <RulesBook />}
      {modal === "options" && <div className={styles.optionList}><button className={styles.secondary} onClick={() => { setView("setup"); setModal(null); }}>Choose lantern size</button>{run && run.status !== "completed" && <button className={styles.secondary} onClick={() => setModal("restart")}>Restart this stencil</button>}<button className={styles.secondary} onClick={() => setModal("help")}>Read the rules</button><button className={styles.secondary} onClick={() => { setRecordPage(0); setModal("records"); }}>Completion records</button>{vihar.embedded ? <button className={styles.secondary} onClick={() => { pauseNow(); vihar.exit(); }}>Exit to Vihar</button> : <Link className={styles.secondary} href="/lantern-logic">Back to overview</Link>}</div>}
      {(modal === "restart" || modal === "new") && <div className={styles.confirm}><p>{modal === "restart" ? "This clears the current marks, undo history, hints, and active time. You will solve the same stencil." : "This replaces your unfinished stencil. Choose Keep solving to return to your saved marks."}</p><div className={styles.actions}><button className={styles.secondary} onClick={() => setModal(null)}>Keep solving</button><button className={styles.primary} onClick={() => begin(modal === "restart")}>{modal === "restart" ? "Restart stencil" : "Start new stencil"}</button></div></div>}
      {modal === "records" && <div className={styles.records}>{entry ? <><p className={styles.eyebrow}>{entry.assisted ? "ASSISTED" : "UNASSISTED"} COLLECTION</p><h3>{getPuzzle(entry.puzzleId)!.title}</h3><p>{labels[entry.preset]} · {sizes[entry.preset]} × {sizes[entry.preset]}</p><p>{formatTime(entry.elapsed)} active time · {entry.hints} hints</p><p>{new Date(entry.date).toLocaleDateString()}</p><div className={styles.pagination}><button className={styles.secondary} disabled={!recordPage} onClick={() => setRecordPage(recordPage - 1)}>← Previous</button><span>{recordPage + 1} / {records.entries.length}</span><button className={styles.secondary} disabled={recordPage >= records.entries.length - 1} onClick={() => setRecordPage(recordPage + 1)}>Next →</button></div></> : <p>Your first lantern is waiting. Assisted and unassisted completions are recorded separately.</p>}</div>}
    </WorkshopDialog>}
  </main>;
}
