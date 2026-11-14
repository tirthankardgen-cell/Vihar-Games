"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { act, step, STEP_MS, type Action, type Preset } from "@/games/monsoon-blocks/engine";
import { createInput } from "@/games/monsoon-blocks/input";
import { defaultSettings, emptyRecords, loadRecords, loadSession, loadSettings, newSession, recordResult, saveSession, saveValue, RECORDS_KEY, SETTINGS_KEY, type Session, type Settings, type Records } from "@/games/monsoon-blocks/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { createAudio } from "./audio";
import { Icon, RainWindowArt, ShapePreview, WindowBoard, WindowMark } from "./art";
import { formatTime, MonsoonDialog, MonsoonFooter, MonsoonNav } from "./shared";
import { RulesBook } from "./rules-book";
import styles from "./monsoon.module.css";

type View = "loading" | "setup" | "ready" | "playing" | "paused" | "countdown" | "result";
type Dialog = "rules" | "restart" | null;
const inGame = (view: View) => ["ready", "playing", "paused", "countdown", "result"].includes(view);
const withStorage = (operation: (storage: Storage) => boolean): boolean => { try { return operation(window.localStorage); } catch { return false; } };
const controls: { action: Action; label: string; icon: "left" | "right" | "rotate" | "down" | "hard-drop" | "hold"; key: string }[] = [
  { action: "left", label: "Left", icon: "left", key: "←" }, { action: "rotate", label: "Rotate", icon: "rotate", key: "↑ / X" },
  { action: "right", label: "Right", icon: "right", key: "→" }, { action: "hold", label: "Hold", icon: "hold", key: "C" },
  { action: "soft-drop", label: "Drop", icon: "down", key: "↓" }, { action: "hard-drop", label: "Hard drop", icon: "hard-drop", key: "Space" },
];
const keys: Record<string, Action> = { ArrowLeft: "left", ArrowRight: "right", ArrowDown: "soft-drop", ArrowUp: "rotate", KeyX: "rotate", Space: "hard-drop", KeyC: "hold" };

export default function MonsoonPlay() {
  const [view, setView] = useState<View>("loading"), [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings), [records, setRecords] = useState<Records>(emptyRecords);
  const [saving, setSaving] = useState(true), [notice, setNotice] = useState(""), [feedback, setFeedback] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null), [countdown, setCountdown] = useState(3), [newBest, setNewBest] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<Preset>("standard");
  const runtime = useRef<{ view: View; session: Session | null; settings: Settings; records: Records; lastSave: number }>({ view: "loading", session: null, settings: defaultSettings, records: emptyRecords(), lastSave: 0 });
  const input = useRef(createInput()), captures = useRef(new Map<number, HTMLButtonElement>());
  const audio = useRef<ReturnType<typeof createAudio> | null>(null);
  const isRound = ["playing", "paused", "countdown"].includes(view) && session?.run.status === "playing";
  const vihar = useViharPlay("monsoon-blocks", isRound, view === "playing");

  const clearInput = useCallback(() => {
    input.current.clear();
    for (const [id, button] of captures.current) { if (button.hasPointerCapture(id)) button.releasePointerCapture(id); }
    captures.current.clear();
  }, []);
  const persist = useCallback((value: Session) => { setSaving(withStorage((storage) => saveSession(storage, value))); }, []);
  const publish = useCallback((value: Session, next: View) => {
    const r = runtime.current, before = r.session?.run;
    r.session = value; r.view = next; setSession(value); setView(next);
    if (before && value.run.placed > before.placed) {
      if (value.run.lastClear.length) { audio.current?.clear(); setFeedback(`${value.run.lastClear.length} ${value.run.lastClear.length === 1 ? "row" : "rows"} cleared · Level ${value.run.level}`); }
      else audio.current?.placement();
    }
    if (next === "result" && before?.status !== "ended") {
      clearInput(); audio.current?.stop(); setNewBest(value.run.score > r.records[value.run.preset].score);
      const bests = recordResult(r.records, value.run); r.records = bests; setRecords(bests);
      const ok = withStorage((storage) => saveValue(storage, RECORDS_KEY, bests)); persist(value); if (!ok) setSaving(false);
      setFeedback(`Window full. ${value.run.score} points and ${value.run.rows} rows cleared.`);
    }
  }, [clearInput, persist]);
  const pause = useCallback(() => {
    clearInput(); audio.current?.stop(); const r = runtime.current;
    if (r.session && (r.view === "playing" || r.view === "countdown")) { publish(r.session, "paused"); persist(r.session); }
  }, [clearInput, persist, publish]);
  const menu = useCallback(() => {
    pause(); clearInput(); const r = runtime.current; if (r.session) persist(r.session);
    r.view = "setup"; setView("setup"); setFeedback("");
  }, [pause, clearInput, persist]);
  const updateSettings = useCallback((value: Settings) => {
    runtime.current.settings = value; setSettings(value); audio.current?.enable(value.sound);
    audio.current?.enableMusic(value.music); audio.current?.unlock();
    if (!withStorage((storage) => saveValue(storage, SETTINGS_KEY, value))) setSaving(false);
  }, []);
  const prepare = useCallback((preset: Preset) => {
    clearInput(); audio.current?.stop(); audio.current?.reset();
    const fresh = newSession(preset, crypto.getRandomValues(new Uint32Array(1))[0], crypto.randomUUID());
    runtime.current.lastSave = 0; setFeedback(""); setNewBest(false); setDialog(null);
    updateSettings({ ...runtime.current.settings, preset }); publish(fresh, "ready"); persist(fresh);
  }, [clearInput, persist, publish, updateSettings]);
  const requestStart = useCallback((preset: Preset) => {
    setPendingPreset(preset);
    if (runtime.current.session?.run.status === "playing") { pause(); setDialog("restart"); }
    else prepare(preset);
  }, [pause, prepare]);
  const resume = useCallback(() => {
    const r = runtime.current;
    if (!["paused", "ready", "setup"].includes(r.view) || !r.session || r.session.run.status !== "playing" || vihar.paused || document.visibilityState !== "visible" || !document.hasFocus()) return;
    clearInput(); audio.current?.unlock(); setCountdown(3); publish(r.session, "countdown");
  }, [clearInput, publish, vihar.paused]);
  const perform = useCallback((action: Action) => {
    const r = runtime.current;
    if (r.view !== "playing" || !r.session || vihar.paused || document.visibilityState !== "visible" || !document.hasFocus()) return;
    const run = act(r.session.run, action); if (run === r.session.run) return;
    if (action === "hold") setFeedback(`${run.hold} held. ${run.active.shape} is active.`);
    const updated = { ...r.session, run }; publish(updated, run.status === "ended" ? "result" : "playing"); persist(updated);
  }, [persist, publish, vihar.paused]);
  const openRules = useCallback(() => { pause(); setDialog("rules"); }, [pause]);
  const exit = () => { pause(); clearInput(); audio.current?.stop(); vihar.exit(); };

  useEffect(() => {
    let cancelled = false; const currentRuntime = runtime.current;
    audio.current = createAudio(() => setNotice("Sound is unavailable. You can keep playing quietly."));
    audio.current.enable(defaultSettings.sound); audio.current.enableMusic(defaultSettings.music);
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const storage = window.localStorage, loaded = loadSession(storage), preferences = loadSettings(storage), bests = loadRecords(storage);
        const recovered = loaded.session?.run.status === "ended" ? recordResult(bests, loaded.session.run) : bests;
        runtime.current.settings = preferences; runtime.current.records = recovered; runtime.current.session = loaded.session;
        setSettings(preferences); setRecords(recovered); audio.current?.enable(preferences.sound); audio.current?.enableMusic(preferences.music);
        if (recovered !== bests && !saveValue(storage, RECORDS_KEY, recovered)) setSaving(false);
        if (loaded.session?.run.status === "playing") { publish(loaded.session, "paused"); runtime.current.lastSave = loaded.session.run.elapsedMs; }
        else { runtime.current.view = "setup"; setSession(loaded.session); setView("setup"); }
        if (loaded.damaged) setNotice("The saved window could not be restored. You can start a fresh one.");
        if (loaded.unavailable) setSaving(false);
      } catch { setSaving(false); runtime.current.view = "setup"; setView("setup"); }
    });
    return () => {
      cancelled = true; clearInput();
      if (currentRuntime.session) withStorage((storage) => saveSession(storage, currentRuntime.session!));
      audio.current?.dispose(); audio.current = null;
    };
  }, [clearInput, publish]);
  useEffect(() => {
    const blur = () => { pause(); clearInput(); };
    const visibility = () => { if (document.visibilityState !== "visible") blur(); };
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.ctrlKey || event.metaKey || event.altKey || target instanceof Element && target.closest('dialog,input,textarea,select,[contenteditable="true"]')) return;
      const phase = runtime.current.view;
      if (event.code === "Escape" && inGame(phase) && phase !== "result") {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) { if (phase === "paused") resume(); else pause(); } return;
      }
      const action = keys[event.code];
      if (!action || phase !== "playing" || event.code === "Space" && target instanceof Element && target.closest("button,a")) return;
      event.preventDefault(); if (event.repeat || vihar.paused) return;
      for (const accepted of input.current.press(`key:${event.code}`, action)) perform(accepted);
    };
    const keyup = (event: KeyboardEvent) => { input.current.release(`key:${event.code}`); };
    window.addEventListener("keydown", keydown, true); window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur); window.addEventListener("pagehide", blur); document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keydown, true); window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur); window.removeEventListener("pagehide", blur); document.removeEventListener("visibilitychange", visibility);
    };
  }, [clearInput, pause, perform, resume, vihar.paused]);
  useEffect(() => { if (vihar.paused) queueMicrotask(pause); }, [vihar.paused, pause]);
  useEffect(() => { if (view === "playing" && !vihar.paused) audio.current?.start(); else audio.current?.stop(); }, [view, vihar.paused]);
  useEffect(() => {
    if (view !== "playing" && view !== "countdown") return;
    let frame = 0, last = performance.now(), remaining = 3000, stopped = false;
    const tick = (now: number) => {
      const r = runtime.current;
      if (stopped || !r.session || !["playing", "countdown"].includes(r.view)) return;
      const ms = Math.max(0, now - last); last = now;
      if (vihar.paused || document.visibilityState !== "visible" || !document.hasFocus() || ms > 250) { pause(); return; }
      if (r.view === "countdown") {
        remaining -= Math.min(ms, 100); setCountdown(Math.max(1, Math.ceil(remaining / 1000)));
        if (remaining <= 0) { clearInput(); publish(r.session, "playing"); return; }
      } else {
        let accumulator = r.session.remainder + Math.min(ms, 100), run = r.session.run;
        const beforePlaced = run.placed;
        while (accumulator >= STEP_MS && run.status === "playing") {
          for (const action of input.current.advance(STEP_MS)) { run = act(run, action); if (run.status === "ended") break; }
          run = step(run); accumulator -= STEP_MS;
        }
        const updated = { ...r.session, run, remainder: run.status === "ended" ? 0 : Math.max(0, accumulator) };
        publish(updated, run.status === "ended" ? "result" : "playing"); if (run.status === "ended") return;
        if (run.elapsedMs - r.lastSave >= 1000 || run.placed !== beforePlaced) { r.lastSave = run.elapsedMs; persist(updated); }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => { stopped = true; cancelAnimationFrame(frame); };
  }, [view, clearInput, pause, persist, publish, vihar.paused]);

  const pointerDown = (event: PointerEvent<HTMLButtonElement>, action: Action) => {
    if (event.button !== 0 || runtime.current.view !== "playing" || vihar.paused) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); captures.current.set(event.pointerId, event.currentTarget);
    for (const accepted of input.current.press(`pointer:${event.pointerId}`, action)) perform(accepted);
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    input.current.release(`pointer:${event.pointerId}`); captures.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const run = session?.run, best = run ? Math.max(records[run.preset].score, run.score) : 0;
  const storageMessage = saving ? "Saved on this device" : "Storage unavailable · keep this page open to retain progress";
  return <main id="main-content" className={styles.page} data-monsoon-view={view} data-vihar-embedded={vihar.embedded || undefined}>
    <MonsoonNav embedded={vihar.embedded} onMenu={view === "loading" ? undefined : menu}>
      {inGame(view) && view !== "result" && <button className={styles.iconButton} onClick={view === "playing" || view === "countdown" ? pause : resume} aria-label={view === "playing" || view === "countdown" ? "Pause game" : "Resume game"} title={view === "playing" || view === "countdown" ? "Pause · Esc" : "Resume with countdown"}><Icon name={view === "playing" || view === "countdown" ? "pause" : "play"} /></button>}
      <button className={styles.iconButton} onClick={openRules} aria-label="How to play" title="How to play"><Icon name="rules" /></button>
      {vihar.embedded ? <button className={styles.iconButton} onClick={exit} aria-label="Exit to Vihar" title="Exit to Vihar"><Icon name="exit" /></button> : <Link className={styles.iconButton} href="/" onClick={pause} aria-label="All games" title="All games"><Icon name="exit" /></Link>}
    </MonsoonNav>
    {view === "loading" && <section className={styles.loading} role="status"><WindowMark /><p>Opening the rain window…</p></section>}
    {view === "setup" && <section className={styles.setup} aria-labelledby="setup-title"><div className={styles.setupCopy}>
      <header><p className={styles.eyebrow}><span className={styles.rainDot} /> YOUR WINDOW, YOUR RHYTHM</p><h1 id="setup-title" className={styles.screenTitle}>Settle into the rain.</h1><p className={styles.screenDescription}>Seven shapes. Complete rows. A little space to think.</p></header>
      <div className={styles.modeGrid} aria-label="Choose a gravity preset">{(["standard", "practice"] as const).map((preset) => <button key={preset} className={styles.modeCard} aria-pressed={settings.preset === preset} onClick={() => updateSettings({ ...settings, preset })}><span className={styles.eyebrow}>{preset === "standard" ? "THE CLASSIC RHYTHM" : "A LITTLE MORE TIME"}</span><strong>{preset === "standard" ? "Standard" : "Practice"}</strong><span>{preset === "standard" ? "Steady drops, growing quicker." : "Half the speed. Same small challenge."}</span><span>Local best · {records[preset].score.toLocaleString()}</span></button>)}</div>
      <div className={styles.setupNote}><div><strong>A simple clockwise turn</strong><p>Up or X rotates. Try the nearest horizontal fit. The square stays the same.</p></div><div><strong>Make a little room</strong><p>1 / 2 / 3 / 4 rows = 100 / 300 / 500 / 800 × level. Ten rows lift the level.</p></div></div>
      <div className={styles.settings}><div className={styles.audioChoices}><label className={styles.soundToggle} title="Muted glass taps and a soft row-clear chord"><input type="checkbox" aria-label="Glass sound effects" checked={settings.sound} onChange={(e) => updateSettings({ ...settings, sound: e.target.checked })} /> Glass sounds</label><label className={styles.soundToggle} title="Cloudlight · an original quiet glass melody"><input type="checkbox" aria-label="Background music" checked={settings.music} onChange={(e) => updateSettings({ ...settings, music: e.target.checked })} /> Music</label></div><button className={styles.textButton} onClick={openRules}>Read the rules ↗</button></div>
      <div className={styles.setupActions}><button className={styles.primary} onClick={() => requestStart(settings.preset)}>Open the window <span aria-hidden="true">→</span></button>{run?.status === "playing" && <button className={styles.secondary} onClick={resume}>Resume {run.preset}</button>}</div>
      <p className={styles.storageNotice} role="status">{notice || vihar.notice || storageMessage}</p>
    </div><RainWindowArt small /></section>}
    {inGame(view) && run && <section className={styles.game} aria-label="Rain-window game">
      <div className={styles.gameTop}><div className={styles.gameTitle}><p className={styles.eyebrow}>{run.preset === "practice" ? "PRACTICE · SLOWER RAIN" : "STANDARD · STEADY RAIN"}</p><h1>Monsoon Blocks</h1></div><dl className={styles.metrics}><div><dt>Score</dt><dd data-stat="score">{run.score.toLocaleString()}</dd></div><div><dt>Rows</dt><dd data-stat="rows">{run.rows}</dd></div><div><dt>Level</dt><dd data-stat="level">{run.level}</dd></div></dl></div>
      <div className={styles.workspace} data-state={view}>
        <aside className={styles.trays} aria-label="Held and upcoming shapes"><div className={styles.tray}><div className={styles.trayHeading}><span>HOLD</span><kbd>C</kbd></div><ShapePreview shape={run.hold} /><p className={styles.trayHint}>{run.canHold ? "Save a shape for later" : "Available after the lock"}</p></div><div className={styles.tray}><div className={styles.trayHeading}><span>COMING NEXT</span><span>3</span></div><div className={styles.nextShapes}>{run.next.map((shape, index) => <div className={styles.nextShape} key={index}><span>{index + 1}</span><ShapePreview shape={shape} /></div>)}</div></div><div className={styles.recordNote}><span>{run.preset === "practice" ? "Practice best" : "Your local best"}</span><strong>{best.toLocaleString()}</strong><span>On this device</span></div></aside>
        <div className={styles.boardColumn}><div className={styles.boardFrame}><WindowBoard run={run} quiet={view !== "playing"} /></div><p className={styles.boardCaption}>10 × 20 · A LITTLE ROOM FOR THE RAIN</p></div>
        <aside className={styles.controlPanel} aria-label="Movement controls"><p className={styles.controlTitle}>One shape at a time.</p><div className={styles.touchControls}>{controls.map(({ action, label, icon, key }) => <button key={action} className={styles.control} data-action={action} disabled={view !== "playing" || vihar.paused || action === "hold" && !run.canHold} aria-label={label} title={`${label} · ${key}`} onPointerDown={(e) => pointerDown(e, action)} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp} onContextMenu={(e) => e.preventDefault()} onClick={(e) => { if (e.detail === 0) perform(action); }}><Icon name={icon} /><span>{label}</span></button>)}
          <button className={styles.control} disabled={view !== "playing" || vihar.paused} aria-label="Sound effects" aria-pressed={settings.sound} onClick={() => updateSettings({ ...settings, sound: !settings.sound })}><Icon name={settings.sound ? "sound" : "muted"} /><span>Sound {settings.sound ? "on" : "off"}</span></button>
          <button className={styles.control} disabled={view !== "playing" || vihar.paused} aria-label="Background music" aria-pressed={settings.music} onClick={() => updateSettings({ ...settings, music: !settings.music })}><Icon name="music" /><span>Music {settings.music ? "on" : "off"}</span></button>
        </div><div className={styles.keyGuide}><p><span>Move / drop</span><kbd>← → / ↓</kbd></p><p><span>Rotate</span><kbd>↑ or X</kbd></p><p><span>Hard drop</span><kbd>Space</kbd></p><p><span>Hold / pause</span><kbd>C / Esc</kbd></p></div><p className={styles.playHint}>The dashed glass outline shows exactly where a hard drop will land.</p></aside>
        {view !== "playing" && <div className={styles.overlay}>
          {view === "countdown" ? <div className={`${styles.statePanel} ${styles.countdown}`} aria-live="polite"><p className={styles.eyebrow}>A MOMENT BEFORE THE RAIN</p><strong>{countdown}</strong><p>Find your rhythm.</p></div> : view === "result" ? <div className={`${styles.statePanel} ${styles.result}`} role="region" aria-label="Game results"><p className={styles.eyebrow}>{run.preset === "practice" ? "PRACTICE · YOUR RESULT SLIP" : "YOUR RESULT SLIP"}</p><h2>Window full.</h2><div className={styles.resultScore}>{run.score.toLocaleString()}</div><p>{newBest ? "A new personal best. Nicely arranged." : "A small pause. A fresh window awaits."}</p><dl className={styles.resultStats}><div><dt>Rows</dt><dd>{run.rows}</dd></div><div><dt>Highest level</dt><dd>{run.level}</dd></div><div><dt>Active time</dt><dd>{formatTime(run.elapsedMs)}</dd></div><div><dt>Local best</dt><dd>{records[run.preset].score.toLocaleString()}</dd></div></dl><div className={styles.stateActions}><button className={styles.primary} onClick={() => prepare(run.preset)}>Play again →</button><button className={styles.secondary} onClick={menu}>Choose a rhythm</button></div></div> : <div className={styles.statePanel} role="region" aria-label={view === "ready" ? "Ready to play" : "Game paused"}><span className={styles.brandMark}><WindowMark /></span><p className={styles.eyebrow}>{view === "ready" ? "YOUR WINDOW IS READY" : "A MOMENT OF STILLNESS"}</p><h2>{view === "ready" ? "Let the rain begin." : "Rain on hold."}</h2><p>{view === "ready" ? "Use arrows to place the glass, Up to turn, Space to settle, and C to hold. Touch controls work too." : "Your shapes, score, and timers are right where you left them."}</p><div className={styles.stateActions}><button className={styles.primary} onClick={resume} disabled={vihar.paused}>{view === "ready" ? "Start playing →" : "Resume · 3, 2, 1"}</button><button className={styles.secondary} onClick={openRules}>How to play</button><button className={styles.secondary} onClick={() => requestStart(run.preset)}>New window</button><button className={styles.textButton} onClick={menu}>Save & choose a rhythm</button></div></div>}
        </div>}
      </div>
      <div className={styles.gameFeedback}><span role="status" aria-live="polite">{notice || vihar.notice || feedback || (view === "playing" ? "Place the glass. Make a little room." : "Timers stay still until you start.")}</span><span>{formatTime(run.elapsedMs)} · Best {best.toLocaleString()} · {saving ? "Saved" : "Unsaved"}</span></div>
    </section>}
    <MonsoonFooter />
    {dialog === "rules" && <MonsoonDialog title="How to play" onClose={() => setDialog(null)}><RulesBook /></MonsoonDialog>}
    {dialog === "restart" && <MonsoonDialog title="Open a fresh window?" onClose={() => setDialog(null)}><p>Your current window will be replaced. Start a new {pendingPreset === "practice" ? "Practice" : "Standard"} run with a fresh bag and score?</p><div className={styles.dialogActions}><button className={styles.secondary} onClick={() => setDialog(null)}>Keep this window</button><button className={styles.primary} onClick={() => prepare(pendingPreset)}>Start fresh</button></div></MonsoonDialog>}
  </main>;
}
