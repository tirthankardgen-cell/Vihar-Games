"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { advance, clearTurns, RATES, turn, type Direction, type Preset } from "@/games/silk-trail/engine";
import { defaultSettings, emptyRecords, loadRecords, loadSession, loadSettings, newSession, recordResult, saveSession, saveValue, RECORDS_KEY, SETTINGS_KEY, type Session, type Settings, type Records } from "@/games/silk-trail/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { GardenArt, GardenBoard, Leaf, TrailMark } from "./art";
import { createAudio } from "./audio";
import { formatTime, SilkDialog, SilkFooter, SilkNav } from "./shared";
import { RulesBook } from "./rules-book";
import styles from "./silk.module.css";
type View = "loading" | "setup" | "ready" | "countdown" | "playing" | "paused" | "result";
const isGame = (view: View) => !["loading", "setup"].includes(view);
const withStorage = (operation: (storage: Storage) => boolean) => { try { return operation(window.localStorage); } catch { return false; } };
const directions: { direction: Direction; label: string; symbol: string }[] = [{ direction: "up", label: "Up", symbol: "↑" }, { direction: "left", label: "Left", symbol: "←" }, { direction: "right", label: "Right", symbol: "→" }, { direction: "down", label: "Down", symbol: "↓" }];
const keys: Record<string, Direction> = { ArrowUp: "up", KeyW: "up", ArrowRight: "right", KeyD: "right", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left" };
const endings = { wall: "The garden’s edge.", body: "A crossing in your trail.", complete: "Garden complete." };

export default function SilkPlay() {
  const [view, setView] = useState<View>("loading"), [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings), [records, setRecords] = useState<Records>(emptyRecords);
  const [notice, setNotice] = useState(""), [saving, setSaving] = useState(true), [feedback, setFeedback] = useState("");
  const [dialog, setDialog] = useState<"rules" | "restart" | null>(null), [pendingPreset, setPendingPreset] = useState<Preset>("flow"), [countdown, setCountdown] = useState(3);
  const runtime = useRef<{ view: View; session: Session | null; settings: Settings; records: Records; lastSave: number }>({ view: "loading", session: null, settings: defaultSettings, records: emptyRecords(), lastSave: 0 });
  const audio = useRef<ReturnType<typeof createAudio> | null>(null);
  const stateFocus = useRef<HTMLDivElement | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; element: HTMLDivElement } | null>(null);
  const vihar = useViharPlay("silk-trail", ["playing", "paused", "countdown"].includes(view) && session?.run.status === "playing", view === "playing");
  const clearInput = useCallback(() => {
    const r = runtime.current; if (r.session) r.session = { ...r.session, run: clearTurns(r.session.run) };
    const g = gesture.current; gesture.current = null;
    if (g?.element.hasPointerCapture(g.id)) g.element.releasePointerCapture(g.id);
  }, []);
  const persist = useCallback((s: Session) => { setSaving(withStorage((storage) => saveSession(storage, s))); }, []);
  const publish = useCallback((s: Session, next: View) => {
    const r = runtime.current, before = r.session?.run; r.session = s; r.view = next; setSession(s); setView(next);
    if (before && s.run.score > before.score) { audio.current?.leaf(); setFeedback(`Leaf gathered · ${s.run.score} leaves · length ${s.run.body.length}`); }
    if (next === "result" && before?.status !== "ended") {
      clearInput(); audio.current?.stop(); r.records = recordResult(r.records, s.run); setRecords(r.records);
      persist(s); if (!withStorage((storage) => saveValue(storage, RECORDS_KEY, r.records))) setSaving(false);
      setFeedback(`${endings[s.run.reason!]} ${s.run.score} leaves. Final length ${s.run.body.length}.`);
    }
  }, [clearInput, persist]);
  const pause = useCallback(() => {
    clearInput(); audio.current?.stop(); const r = runtime.current;
    if (r.session && ["playing", "countdown"].includes(r.view)) { publish(r.session, "paused"); persist(r.session); }
  }, [clearInput, persist, publish]);
  const menu = useCallback(() => {
    pause(); clearInput(); const r = runtime.current; if (r.session) persist(r.session);
    r.view = "setup"; setView("setup"); setSession(r.session); setFeedback("");
  }, [clearInput, pause, persist]);
  const updateSettings = useCallback((s: Settings) => {
    runtime.current.settings = s; setSettings(s); audio.current?.enable(s.sound); audio.current?.enableMusic(s.music); audio.current?.unlock();
    if (!withStorage((storage) => saveValue(storage, SETTINGS_KEY, s))) setSaving(false);
  }, []);
  const prepare = useCallback((preset: Preset) => {
    clearInput(); audio.current?.stop(); audio.current?.reset();
    const s = newSession(preset, crypto.getRandomValues(new Uint32Array(1))[0], crypto.randomUUID());
    runtime.current.lastSave = 0; updateSettings({ ...runtime.current.settings, preset }); setDialog(null); setFeedback(""); publish(s, "ready"); persist(s);
  }, [clearInput, persist, publish, updateSettings]);
  const requestStart = (preset: Preset) => { setPendingPreset(preset); if (runtime.current.session?.run.status === "playing") { pause(); setDialog("restart"); } else prepare(preset); };
  const resume = useCallback(() => {
    const r = runtime.current;
    if (!r.session || !["ready", "paused", "setup"].includes(r.view) || r.session.run.status !== "playing" || vihar.paused || document.visibilityState !== "visible" || !document.hasFocus()) return;
    clearInput(); audio.current?.unlock(); setCountdown(3); publish(r.session, "countdown");
  }, [clearInput, publish, vihar.paused]);
  const perform = useCallback((direction: Direction) => {
    const r = runtime.current;
    if (r.view !== "playing" || !r.session || vihar.paused || document.visibilityState !== "visible" || !document.hasFocus()) return;
    const run = turn(r.session.run, direction); if (run !== r.session.run) { r.session = { ...r.session, run }; }
  }, [vihar.paused]);
  const openRules = () => { pause(); setDialog("rules"); };
  const exit = () => { pause(); clearInput(); audio.current?.stop(); vihar.exit(); };

  useEffect(() => {
    let cancelled = false; const r = runtime.current;
    audio.current = createAudio(() => setNotice("Audio is unavailable. Your garden is still ready to play."));
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const storage = window.localStorage, loaded = loadSession(storage), preferences = loadSettings(storage), bests = loadRecords(storage);
        r.settings = preferences; r.records = loaded.session?.run.status === "ended" ? recordResult(bests, loaded.session.run) : bests;
        setSettings(preferences); setRecords(r.records); audio.current?.enable(preferences.sound); audio.current?.enableMusic(preferences.music);
        if (r.records !== bests && !saveValue(storage, RECORDS_KEY, r.records)) setSaving(false);
        if (loaded.session) { r.session = loaded.session; r.lastSave = loaded.session.run.elapsedMs; }
        if (loaded.session?.run.status === "playing") publish(loaded.session, "paused");
        else { r.view = "setup"; setView("setup"); setSession(r.session); }
        if (loaded.damaged) setNotice("The saved trail could not be restored. Start a fresh garden.");
        if (loaded.unavailable) setSaving(false);
      } catch { setSaving(false); r.view = "setup"; setView("setup"); }
    });
    return () => { cancelled = true; clearInput(); if (r.session) withStorage((storage) => saveSession(storage, r.session!)); audio.current?.dispose(); audio.current = null; };
  }, [clearInput, publish]);
  useEffect(() => {
    const visibility = () => { if (document.visibilityState !== "visible") pause(); };
    const keydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.target instanceof Element && e.target.closest('dialog,input,select,textarea,[contenteditable="true"]')) return;
      const r = runtime.current;
      if ((e.code === "Space" || e.code === "Escape") && ["playing", "countdown"].includes(r.view)) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) pause(); return; }
      if (keys[e.code] && r.view === "playing") { e.preventDefault(); if (!e.repeat) perform(keys[e.code]); }
    };
    window.addEventListener("keydown", keydown, true); window.addEventListener("blur", pause); window.addEventListener("pagehide", pause); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("keydown", keydown, true); window.removeEventListener("blur", pause); window.removeEventListener("pagehide", pause); document.removeEventListener("visibilitychange", visibility); };
  }, [pause, perform]);
  useEffect(() => { if (vihar.paused) queueMicrotask(pause); }, [vihar.paused, pause]);
  useEffect(() => { if (["ready", "paused", "result"].includes(view)) stateFocus.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); }, [view]);
  useEffect(() => {
    if (view === "playing" && !vihar.paused) audio.current?.start();
    else { audio.current?.stop(); if (view === "result") audio.current?.end(); }
  }, [view, vihar.paused]);
  useEffect(() => {
    if (view !== "playing" && view !== "countdown") return;
    let frame = 0, last = performance.now(), remaining = 3000, stopped = false;
    const tick = (now: number) => {
      const r = runtime.current; if (stopped || !r.session || !["playing", "countdown"].includes(r.view)) return;
      const ms = Math.max(0, now - last); last = now;
      if (vihar.paused || !document.hasFocus() || document.visibilityState !== "visible" || ms > 250) { pause(); return; }
      if (r.view === "countdown") {
        remaining -= ms; setCountdown(Math.max(1, Math.ceil(remaining / 1000)));
        if (remaining <= 0) { clearInput(); publish(r.session, "playing"); return; }
      } else {
        const updated = { ...r.session, ...advance(r.session.run, r.session.remainder, ms) };
        publish(updated, updated.run.status === "ended" ? "result" : "playing"); if (updated.run.status === "ended") return;
        if (updated.run.elapsedMs - r.lastSave >= 500) { r.lastSave = updated.run.elapsedMs; persist(updated); }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => { stopped = true; cancelAnimationFrame(frame); };
  }, [view, clearInput, pause, publish, persist, vihar.paused]);

  const swipeStart = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || runtime.current.view !== "playing" || gesture.current) return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, element: e.currentTarget }; e.currentTarget.setPointerCapture(e.pointerId);
  };
  const swipeEnd = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current; if (!g || g.id !== e.pointerId) return; gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (e.type !== "pointerup") return;
    const x = e.clientX - g.x, y = e.clientY - g.y;
    if (Math.max(Math.abs(x), Math.abs(y)) < 24 || Math.max(Math.abs(x), Math.abs(y)) < 1.5 * Math.min(Math.abs(x), Math.abs(y))) return;
    perform(Math.abs(x) > Math.abs(y) ? x > 0 ? "right" : "left" : y > 0 ? "down" : "up");
  };
  const run = session?.run, active = view === "playing" || view === "countdown";
  const audioChoices = <div className={styles.audioChoices}><button className={styles.toggle} aria-label="Sound effects" aria-pressed={settings.sound} onClick={() => updateSettings({ ...settings, sound: !settings.sound })}>Sound <span>{settings.sound ? "on" : "off"}</span></button><button className={styles.toggle} aria-label="Background music" aria-pressed={settings.music} onClick={() => updateSettings({ ...settings, music: !settings.music })}>Music <span>{settings.music ? "on" : "off"}</span></button></div>;
  return <main id="main-content" className={styles.page} data-silk-view={view} data-vihar-embedded={vihar.embedded || undefined}>
    <SilkNav onMenu={view === "loading" ? undefined : menu} embedded={vihar.embedded}>
      {isGame(view) && view !== "result" && <button className={styles.iconButton} onClick={active ? pause : resume} aria-label={active ? "Pause game" : "Resume game"}>{active ? "Ⅱ" : "▷"}</button>}
      <button className={styles.iconButton} onClick={openRules} aria-label="How to play">?</button>
      {vihar.embedded ? <button className={styles.iconButton} onClick={exit} aria-label="Exit to Vihar">↗</button> : <Link className={styles.iconButton} href="/" onClick={pause} aria-label="All games">↗</Link>}
    </SilkNav>
    {view === "loading" && <section className={styles.loading} role="status"><TrailMark /><p>Unfolding the garden…</p></section>}
    {view === "setup" && <section className={styles.setup} aria-labelledby="setup-title"><div className={styles.setupCopy}>
      <header><p className={styles.eyebrow}>A RHYTHM OF YOUR OWN</p><h1 id="setup-title">Room to grow.</h1><p className={styles.description}>Choose a pace. Follow the leaves. Leave room to turn.</p></header>
      <div className={styles.presets} aria-label="Movement presets">{(["calm", "flow", "swift"] as const).map((preset, i) => <button key={preset} className={styles.preset} aria-pressed={settings.preset === preset} onClick={() => updateSettings({ ...settings, preset })}><span className={styles.swatch} data-preset={preset}><Leaf /></span><span><strong>{preset}</strong><small>{RATES[preset]} cells / second · {i === 0 ? "Take your time" : i === 1 ? "Find your flow" : "A quicker thread"}</small></span><span className={styles.best}>Best {records[preset]}</span></button>)}</div>
      <label className={styles.compactPreset}>Movement preset<select value={settings.preset} onChange={(e) => updateSettings({ ...settings, preset: e.target.value as Preset })}>{(["calm", "flow", "swift"] as const).map((preset) => <option key={preset} value={preset}>{preset.toUpperCase()} · {RATES[preset]} cells/sec · Best {records[preset]}</option>)}</select></label>
      <div className={styles.setupSettings}>{audioChoices}<button className={styles.textButton} onClick={openRules}>Read the rules ↗</button></div>
      <div className={styles.actions}><button className={styles.primary} onClick={() => requestStart(settings.preset)}>Enter the garden →</button>{run?.status === "playing" && <button className={styles.secondary} onClick={resume}>Resume {run.preset}</button>}</div>
      <p className={styles.notice} role="status">{notice || vihar.notice || (saving ? "Your trail stays on this device." : "Storage unavailable · keep this page open to retain progress.")}</p>
    </div><GardenArt /></section>}
    {isGame(view) && run && <section className={styles.game} aria-label="Silk Garden game"><div className={styles.gameTop}><div><p className={styles.eyebrow}>{run.preset.toUpperCase()} · {RATES[run.preset]} CELLS / SECOND</p><h1>Silk Trail</h1></div><dl className={styles.metrics}><div><dt>Leaves</dt><dd data-stat="score">{run.score}</dd></div><div><dt>Length</dt><dd data-stat="length">{run.body.length}</dd></div><div><dt>Best</dt><dd>{records[run.preset]}</dd></div></dl></div>
      <div className={styles.workspace} data-large={settings.large || undefined}>
        <div className={styles.boardArea}><div className={styles.boardFrame}><div className={styles.swipeSurface} onPointerDown={swipeStart} onPointerUp={swipeEnd} onPointerCancel={swipeEnd} onLostPointerCapture={swipeEnd}><GardenBoard run={run} quiet={view !== "playing"} /></div></div></div>
        <aside className={styles.controls} aria-label="Garden controls" inert={view !== "playing"}><div className={styles.controlCopy}><Leaf /><h2>A little room<br />for the next turn.</h2><p>Arrows or WASD.<br />Swipe the garden, or use the pad below.</p></div><div className={styles.pad} aria-label="Direction pad">{directions.map(({ direction, label, symbol }) => <button key={direction} data-direction={direction} aria-label={label} disabled={view !== "playing" || vihar.paused} onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); perform(direction); } }} onClick={(e) => { if (e.detail === 0) perform(direction); }}><span aria-hidden="true">{symbol}</span><small>{label}</small></button>)}</div><div className={styles.controlSettings}>{audioChoices}<button className={styles.toggle} aria-label="Larger garden" aria-pressed={settings.large} onClick={() => updateSettings({ ...settings, large: !settings.large })}>{settings.large ? "Standard garden" : "Larger garden"}</button></div><p className={styles.keyGuide}>SPACE / ESC · PAUSE</p></aside>
        {view !== "playing" && <div className={styles.overlay}>{view === "countdown" ? <div className={`${styles.statePanel} ${styles.countdown}`} role="status"><p className={styles.eyebrow}>FOLLOW YOUR THREAD</p><strong>{countdown}</strong></div> : view === "result" ? <div className={`${styles.statePanel} ${styles.result}`} ref={stateFocus} role="region" aria-label="Game results"><p className={styles.eyebrow}>{run.preset.toUpperCase()} · YOUR GARDEN RIBBON</p><h2>{endings[run.reason!]}</h2><div className={styles.ribbon}><strong>{run.body.length}</strong><span>CELLS OF SILK</span></div><dl className={styles.resultStats}><div><dt>Leaves</dt><dd>{run.score}</dd></div><div><dt>Final length</dt><dd>{run.body.length}</dd></div><div><dt>Active time</dt><dd>{formatTime(run.elapsedMs)}</dd></div><div><dt>{run.preset} best</dt><dd>{records[run.preset]}</dd></div></dl><div className={styles.actions}><button className={styles.primary} onClick={() => prepare(run.preset)}>Play again →</button><button className={styles.secondary} onClick={menu}>Choose a pace</button></div></div> : <div className={styles.statePanel} ref={stateFocus} role="region" aria-label={view === "ready" ? "Ready to play" : "Game paused"}><span className={styles.stateMark}><TrailMark /></span><p className={styles.eyebrow}>{view === "ready" ? "YOUR GARDEN IS READY" : "THE THREAD CAN WAIT"}</p><h2>{view === "ready" ? "Follow a little leaf." : "Rest in the garden."}</h2><p>{view === "ready" ? "Arrows, WASD, the direction pad, or a clear swipe. Gather leaves and keep a little space to turn." : "Your trail, leaf, and time are just where you left them."}</p><div className={styles.stateActions}><button className={styles.primary} onClick={resume} disabled={vihar.paused}>{view === "ready" ? "Start · 3, 2, 1" : "Resume · 3, 2, 1"}</button><button className={styles.secondary} onClick={openRules}>How to play</button><button className={styles.secondary} onClick={() => requestStart(run.preset)}>New garden</button><button className={styles.textButton} onClick={menu}>Save & choose a pace</button></div></div>}</div>}
      </div><div className={styles.gameFeedback}><span role="status" aria-live="polite">{notice || vihar.notice || feedback || "Gather a leaf. Leave a little room."}</span><span>{formatTime(run.elapsedMs)} · {saving ? "Saved" : "Unsaved"}</span></div></section>}
    <SilkFooter />
    {dialog === "rules" && <SilkDialog title="How to play" onClose={() => setDialog(null)}><RulesBook /></SilkDialog>}
    {dialog === "restart" && <SilkDialog title="Unfold a fresh garden?" onClose={() => setDialog(null)}><p>Replace your unfinished trail with a new {pendingPreset} garden? The leaf count and active time start again.</p><div className={styles.actions}><button className={styles.secondary} onClick={() => setDialog(null)}>Keep this trail</button><button className={styles.primary} onClick={() => prepare(pendingPreset)}>Start fresh</button></div></SilkDialog>}
  </main>;
}
