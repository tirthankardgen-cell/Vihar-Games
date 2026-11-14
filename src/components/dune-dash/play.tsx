"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { duck, jump, scoreOf, speedAt, start, step, STEP, presets, type Mode } from "@/games/dune-dash/engine";
import { defaultSettings, emptyRecords, loadRecords, loadSession, loadSettings, newSession, recordResult, saveValue, SESSION_KEY, SETTINGS_KEY, RECORDS_KEY, type Session, type Settings, type Records } from "@/games/dune-dash/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { createAudio } from "./audio";
import { ControlStudy, Fox, RunField } from "./art";
import { Dialog, DuneFooter, DuneNav } from "./shared";
import { RulesBook } from "./rules-book";
import styles from "./dune-dash.module.css";

type View = "loading" | "choose" | "ready" | "running" | "paused" | "countdown" | "result";
type Confirmation = { kind: "prepare"; mode: Mode } | { kind: "choose" };
const active = (view: View) => ["running", "paused", "countdown"].includes(view);
const withStorage = (key: string, value: Session | Settings | Records) => { try { return saveValue(window.localStorage, key, value); } catch { return false; } };
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function DuneDashPlay() {
  const [view, setView] = useState<View>("loading"), [session, setSession] = useState<Session | null>(null), [previous, setPrevious] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings), [records, setRecords] = useState<Records>(emptyRecords);
  const [saving, setSaving] = useState(true), [notice, setNotice] = useState(""), [countdown, setCountdown] = useState(3);
  const [rulesOpen, setRulesOpen] = useState(false), [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const runtime = useRef({ view: "loading" as View, session: null as Session | null, previous: null as Session | null, records: emptyRecords(), lastSave: 0, blocked: false });
  const held = useRef(new Set<string>()), pointers = useRef(new Map<number, HTMLButtonElement>()), audio = useRef<ReturnType<typeof createAudio> | null>(null), stage = useRef<HTMLElement>(null);
  const inRound = active(view) && session?.run.status === "running";
  const vihar = useViharPlay("dune-dash", inRound, view === "running");

  const clearInput = useCallback(() => {
    held.current.clear();
    for (const [id, element] of pointers.current) { if (element.hasPointerCapture(id)) element.releasePointerCapture(id); }
    pointers.current.clear();
  }, []);
  const persist = useCallback((value: Session) => {
    if (!withStorage(SESSION_KEY, value)) setSaving(false);
    runtime.current.previous = value; setPrevious(value);
  }, []);
  const publish = useCallback((value: Session, next: View) => {
    runtime.current.session = value; runtime.current.view = next; setSession(value); setView(next);
    if (next === "result") {
      clearInput(); audio.current?.stop(); audio.current?.thud();
      const bests = recordResult(runtime.current.records, value.run);
      runtime.current.records = bests; setRecords(bests);
      if (!withStorage(RECORDS_KEY, bests)) setSaving(false);
      persist(value);
    }
  }, [clearInput, persist]);
  const pause = useCallback(() => {
    const r = runtime.current;
    if (!r.session || !["running", "countdown"].includes(r.view)) return;
    // Change the phase before releasing capture: lost-capture handlers must not
    // stand a frozen duck underneath a bird.
    r.view = "paused"; clearInput(); audio.current?.stop(); publish(r.session, "paused"); persist(r.session);
  }, [clearInput, persist, publish]);
  const prepare = useCallback((mode: Mode) => {
    runtime.current.view = "ready"; clearInput(); audio.current?.stop();
    const date = new Date().toLocaleDateString("en-CA");
    const fresh = newSession(mode, crypto.getRandomValues(new Uint32Array(1))[0], crypto.randomUUID(), date);
    runtime.current.lastSave = 0; publish(fresh, "ready"); persist(fresh);
  }, [clearInput, persist, publish]);
  const canRun = useCallback(() => !vihar.paused && !runtime.current.blocked && document.visibilityState === "visible" && document.hasFocus(), [vihar.paused]);
  const begin = useCallback(() => {
    const r = runtime.current;
    if (!r.session || r.view !== "ready" || !canRun()) return;
    clearInput(); audio.current?.running(true); publish({ ...r.session, run: start(r.session.run) }, "running"); stage.current?.focus();
  }, [canRun, clearInput, publish]);
  const resume = useCallback(() => {
    const r = runtime.current;
    if (!r.session || r.view !== "paused" || !canRun()) return;
    clearInput(); audio.current?.unlock(); setCountdown(3); publish(r.session, "countdown"); stage.current?.focus();
  }, [canRun, clearInput, publish]);
  const takeJump = useCallback(() => {
    const r = runtime.current;
    if (!r.session || r.view !== "running" || !canRun()) return;
    const next = jump(r.session.run);
    if (next !== r.session.run) { audio.current?.jump(); publish({ ...r.session, run: next }, "running"); }
  }, [canRun, publish]);
  const takeDuck = useCallback((down: boolean) => {
    const r = runtime.current;
    if (!r.session || r.view !== "running" || !canRun()) return;
    publish({ ...r.session, run: duck(r.session.run, down) }, "running");
  }, [canRun, publish]);
  const choose = useCallback(() => {
    pause(); const r = runtime.current;
    if (r.session) persist(r.session);
    r.view = "choose"; clearInput(); setView("choose");
  }, [clearInput, pause, persist]);
  const updateSettings = useCallback((value: Settings) => {
    setSettings(value); audio.current?.enable(value.sound); audio.current?.music(value.music);
    if (!withStorage(SETTINGS_KEY, value)) setSaving(false);
  }, []);
  const requestPrepare = (mode: Mode) => {
    const saved = runtime.current.previous;
    if (saved?.run.status === "running" && saved.run.elapsed > 0) { pause(); setConfirmation({ kind: "prepare", mode }); }
    else prepare(mode);
  };
  const exit = () => { pause(); const current = runtime.current.session; if (current) persist(current); audio.current?.stop(); clearInput(); vihar.exit(); };

  useEffect(() => {
    runtime.current.blocked = rulesOpen || confirmation !== null;
  }, [rulesOpen, confirmation]);
  useEffect(() => {
    let cancelled = false;
    const r = runtime.current;
    audio.current = createAudio(() => setNotice("Sound is unavailable. You can keep running quietly."));
    audio.current.enable(defaultSettings.sound); audio.current.music(defaultSettings.music);
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const storage = window.localStorage, loaded = loadSession(storage), preferences = loadSettings(storage), bests = loadRecords(storage);
        r.previous = loaded.session; r.records = bests; setPrevious(loaded.session); setRecords(bests); setSettings(preferences); audio.current?.enable(preferences.sound); audio.current?.music(preferences.music);
        if (loaded.session && loaded.session.run.status !== "ended") { r.lastSave = loaded.session.run.elapsed; publish(loaded.session, loaded.session.run.status === "ready" ? "ready" : "paused"); }
        else { r.view = "choose"; setView("choose"); }
        if (loaded.damaged) setNotice("The saved run could not be restored. Choose a mode for a fresh journey.");
      } catch { setSaving(false); r.view = "choose"; setView("choose"); }
    });
    return () => { cancelled = true; if (r.session) withStorage(SESSION_KEY, r.session); clearInput(); audio.current?.dispose(); audio.current = null; };
  }, [clearInput, publish]);

  useEffect(() => {
    const blur = () => { pause(); clearInput(); audio.current?.stop(); };
    const visibility = () => { if (document.visibilityState !== "visible") blur(); };
    const keydown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("dialog,input,textarea,select") || runtime.current.blocked) return;
      if (event.code === "Escape" && active(runtime.current.view)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) { if (runtime.current.view === "paused") resume(); else pause(); }
        return;
      }
      const phase = runtime.current.view;
      if (event.code === "Space" && (phase === "ready" || phase === "result")) {
        if (target?.closest("button,a") && !target.closest("[data-space-start]")) return;
        event.preventDefault();
        if (event.repeat || held.current.has(event.code) || !canRun()) return;
        const current = runtime.current.session;
        if (!current) return;
        if (phase === "result") {
          prepare(current.run.mode);
          const fresh = runtime.current.session;
          if (fresh) { audio.current?.running(true); publish({ ...fresh, run: start(fresh.run) }, "running"); }
          stage.current?.focus();
        } else begin();
        held.current.add(event.code);
        return;
      }
      if (runtime.current.view !== "running") return;
      const onJump = !!target?.closest("[data-jump]"), onDuck = !!target?.closest("[data-duck]");
      const jumpKey = ["Space", "ArrowUp", "KeyW"].includes(event.code) || onJump && event.code === "Enter";
      const duckKey = ["ArrowDown", "KeyS"].includes(event.code) || onDuck && ["Space", "Enter"].includes(event.code);
      if ((!jumpKey && !duckKey) || event.code === "Space" && target?.closest("button,a") && !onJump && !onDuck) return;
      event.preventDefault();
      if (event.repeat || held.current.has(event.code)) return;
      const alreadyJumping = [...held.current].some((key) => ["Space", "ArrowUp", "KeyW", "Enter"].includes(key));
      held.current.add(event.code);
      if (duckKey) takeDuck(true); else if (!alreadyJumping) takeJump();
    };
    const keyup = (event: KeyboardEvent) => {
      const wasHeld = held.current.delete(event.code);
      if (wasHeld && ["ArrowDown", "KeyS", "Space", "Enter"].includes(event.code) && ![...held.current].some((key) => ["ArrowDown", "KeyS"].includes(key)) && !pointers.current.size) takeDuck(false);
    };
    window.addEventListener("keydown", keydown, true); window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur); window.addEventListener("pagehide", blur); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("keydown", keydown, true); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); window.removeEventListener("pagehide", blur); document.removeEventListener("visibilitychange", visibility); };
  }, [begin, canRun, clearInput, pause, prepare, publish, resume, takeDuck, takeJump]);
  useEffect(() => { if (vihar.paused) queueMicrotask(pause); }, [pause, vihar.paused]);

  useEffect(() => {
    if (view !== "running" && view !== "countdown") return;
    let frame = 0, last = performance.now(), remaining = 3, stopped = false;
    const tick = (now: number) => {
      const r = runtime.current;
      if (stopped || !r.session || !["running", "countdown"].includes(r.view)) return;
      const elapsed = Math.max(0, (now - last) / 1000); last = now;
      if (!canRun() || elapsed > .15) { pause(); return; }
      if (r.view === "countdown") {
        remaining -= elapsed; setCountdown(Math.max(1, Math.ceil(remaining)));
        if (remaining <= 0) { clearInput(); audio.current?.running(true); publish({ ...r.session, run: duck(r.session.run, false) }, "running"); return; }
      } else {
        let accumulator = r.session.remainder + elapsed, run = r.session.run;
        const oldFootstep = Math.floor(run.elapsed * 5);
        while (accumulator >= STEP && run.status === "running") { run = step(run); accumulator -= STEP; }
        const updated = { ...r.session, run, remainder: run.status === "ended" ? 0 : Math.max(0, accumulator) };
        if (Math.floor(run.elapsed * 5) > oldFootstep && run.pose === "standing") audio.current?.tap();
        publish(updated, run.status === "ended" ? "result" : "running");
        if (run.status === "ended") return;
        if (run.elapsed - r.lastSave >= 1) { r.lastSave = run.elapsed; persist(updated); }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(frame); };
  }, [view, canRun, clearInput, pause, persist, publish]);

  const releaseDuck = (id: number) => {
    pointers.current.delete(id);
    if (!pointers.current.size && ![...held.current].some((key) => ["ArrowDown", "KeyS"].includes(key))) takeDuck(false);
  };
  const saveNotice = notice || vihar.notice || (!saving ? "Saving unavailable. Your run stays in this tab." : "Saved on this device. No sign-up. Just a little run.");
  const run = session?.run;
  const collection = vihar.embedded ? <button className={styles.textButton} onClick={exit}>Exit to Vihar ↗</button> : <Link className={styles.textButton} href="/">Return to collection ↗</Link>;

  return <main id="main-content" className={styles.page} data-vihar-embedded={vihar.embedded || undefined} data-dune-view={view}>
    <DuneNav embedded={vihar.embedded}>
      {view === "choose" || view === "loading" ? vihar.embedded ? <button className={styles.iconButton} aria-label="Exit to Vihar" onClick={exit}>↗</button> : <Link className={styles.iconButton} href="/" aria-label="Return to collection">↗</Link> : <button className={styles.guideButton} aria-label="Field guide" onClick={() => { pause(); setRulesOpen(true); }}><span className={styles.guideLabel}>Field guide</span><span className={styles.guideSymbol} aria-hidden="true">?</span></button>}
      <button className={styles.audioButton} onClick={() => updateSettings({ ...settings, sound: !settings.sound })} aria-pressed={settings.sound} aria-label={settings.sound ? "Turn sound off" : "Turn sound on"} title={settings.sound ? "Sound effects on" : "Sound effects off"}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Z" />{settings.sound ? <path d="M15 8q5 4 0 8m3-11q7 7 0 14" /> : <path d="m16 9 5 6m0-6-5 6" />}</svg></button>
      <button className={styles.audioButton} onClick={() => updateSettings({ ...settings, music: !settings.music })} aria-pressed={settings.music} aria-label={settings.music ? "Turn music off" : "Turn music on"} title={settings.music ? "Desert music on" : "Desert music off"}>♫</button>
      {vihar.embedded && view !== "choose" && <button className={styles.iconButton} data-exit aria-label="Exit to Vihar" onClick={exit}>×</button>}
    </DuneNav>
    {view === "loading" ? <section className={styles.loading} role="status">Opening your field notes…</section> : view === "choose" ? <section className={styles.choose} aria-labelledby="choose-title">
      <header className={styles.screenHeading}><p className={styles.eyebrow}>01 / CHOOSE YOUR PACE</p><h1 id="choose-title">The horizon is yours.</h1><p>A little leap. A low duck. See how far you wander.</p></header>
      <fieldset className={styles.modeGrid}><legend className={styles.srOnly}>Choose a running mode</legend>{(["endless", "practice"] as const).map((mode) => <label className={styles.modeCard} data-selected={settings.mode === mode} key={mode}>
        <input type="radio" name="mode" checked={settings.mode === mode} onChange={() => updateSettings({ ...settings, mode })} />
        <span className={styles.modeMark}><Fox pose={mode === "practice" ? "ducking" : "standing"} /></span><span className={styles.modeCopy}><strong>{presets[mode].name}</strong><span>{mode === "endless" ? "A quicker trail. The pace rises as you run." : "A gentler trail. One steady, slower pace."}</span><small>LOCAL BEST · {records[mode].score} POINTS</small></span><span className={styles.radioMark} aria-hidden="true">{settings.mode === mode ? "✓" : ""}</span>
      </label>)}</fieldset>
      <div className={styles.chooseActions}><button className={styles.primary} onClick={() => requestPrepare(settings.mode)}>Pack your field notes <span aria-hidden="true">→</span></button>{previous && <button className={styles.secondary} onClick={() => publish(previous, previous.run.status === "ended" ? "result" : previous.run.status === "ready" ? "ready" : "paused")}>{previous.run.status === "ended" ? "Last journey" : "Resume saved run"}</button>}</div>
      <p className={styles.screenNote} role="status">{saveNotice}</p>
    </section> : run && session && <section className={styles.playLayout} aria-label={`${presets[run.mode].name} desert run`}>
      <header className={styles.hud}>
        <span className={styles.modeLabel}>{presets[run.mode].name}<small>{view === "running" ? "ON THE TRAIL" : view === "paused" ? "TRAIL PAUSED" : view === "result" ? "JOURNEY COMPLETE" : "GET YOUR BEARINGS"}</small></span>
        <div className={styles.scores}><span>Score <output aria-label="Score" aria-live="off">{scoreOf(run)}</output></span><span>Local best <output aria-label="Local best" aria-live="off">{Math.max(records[run.mode].score, view === "result" ? scoreOf(run) : 0)}</output></span></div>
        <button className={styles.secondary} disabled={view !== "running" && view !== "countdown"} onClick={pause} aria-label="Pause run">Ⅱ <span>Pause</span></button>
      </header>
      <div className={styles.trail}>
        <section ref={stage} tabIndex={0} className={styles.stage} aria-label="Running field" aria-describedby="dune-controls"><RunField run={run} moving={view === "running"} onJump={takeJump} /></section>
        {view !== "running" && <section className={styles.panel} aria-labelledby="panel-title" data-phase={view}>
          {view === "ready" ? <>
            <header><p className={styles.eyebrow}>02 / A FEW NOTES BEFORE YOU GO</p><h1 id="panel-title">Ready, little wanderer?</h1></header><ControlStudy />
            <p className={styles.panelCopy}>Jump the stones. Hold Duck for birds.<br />Space starts the run, then jumps.</p><div className={styles.panelActions}><button className={styles.primary} data-space-start disabled={vihar.paused} onClick={begin}>Start run ↗</button><button className={styles.secondary} onClick={choose}>Change mode</button></div>
          </> : view === "paused" ? <>
            <header><p className={styles.eyebrow}>A PLACE TO CATCH YOUR BREATH</p><h1 id="panel-title">The desert can wait.</h1></header><p className={styles.panelCopy}>Your fox and the trail are right where you left them.</p>
            <div className={styles.panelActions}><button className={styles.primary} disabled={vihar.paused} onClick={resume}>Resume · 3, 2, 1</button><button className={styles.secondary} onClick={() => requestPrepare(run.mode)}>Restart</button><button className={styles.textButton} onClick={() => setConfirmation({ kind: "choose" })}>Change mode</button>{collection}</div>
          </> : view === "countdown" ? <>
            <header><p className={styles.eyebrow}>BACK TO THE TRAIL IN</p><h1 id="panel-title" className={styles.countdown} role="status">{countdown}</h1></header><button className={styles.secondary} onClick={pause}>Keep paused</button>
          </> : <>
            <header><p className={styles.eyebrow}>FIELD NOTES / {session.date}</p><h1 id="panel-title">A fine little journey.</h1></header>
            <p className={styles.resultDistance}><output aria-label="Distance" aria-live="off">{run.distance.toFixed(1)}</output><span>UNITS TRAVELLED</span></p>
            <dl className={styles.resultDetails}><div><dt>Score</dt><dd>{scoreOf(run)}</dd></div><div><dt>Active time</dt><dd>{formatTime(run.elapsed)}</dd></div><div><dt>Mode</dt><dd>{presets[run.mode].name}</dd></div><div><dt>Local best</dt><dd>{records[run.mode].score}</dd></div></dl>
            <p className={styles.panelCopy} role="status">{run.ending === "bird" ? "A passing swift caught your ears. Try a lower duck." : "A sandstone stopped your paws. Try a little leap."}</p>
            <div className={styles.panelActions}><button className={styles.primary} data-space-start onClick={() => prepare(run.mode)}>Try again ↗</button><button className={styles.secondary} onClick={choose}>Change mode</button>{collection}</div><p className={styles.replayHint}>Press Space to run again</p>
          </>}
        </section>}
      </div>
      <div className={styles.controls} id="dune-controls">
        <p className={styles.keyHints}><kbd>Space</kbd> / <kbd>↑</kbd> / W jump <i /> <kbd>↓</kbd> / S hold to duck</p>
        <div className={styles.touchControls}>
          <button className={styles.jumpButton} data-jump disabled={view !== "running"} onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); takeJump(); } }}>↑ Jump</button>
          <button className={styles.duckButton} data-duck disabled={view !== "running"} aria-label="Duck — press and hold" onPointerDown={(event) => { if (event.button !== 0 || !canRun()) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pointers.current.set(event.pointerId, event.currentTarget); takeDuck(true); }} onPointerUp={(event) => releaseDuck(event.pointerId)} onPointerCancel={(event) => releaseDuck(event.pointerId)} onLostPointerCapture={(event) => releaseDuck(event.pointerId)}>↓ Hold Duck</button>
        </div><p className={styles.runMeta}>{run.distance.toFixed(0)} units · {formatTime(run.elapsed)} · {speedAt(run.mode, run.elapsed)} u/s</p>
      </div>
      <p className={styles.screenNote} role="status">{view === "running" ? "Escape pauses · Tap the open horizon to jump" : saveNotice}</p>
    </section>}
    <DuneFooter />
    {rulesOpen && <Dialog title="Your field guide" onClose={() => setRulesOpen(false)}><RulesBook /></Dialog>}
    {confirmation && <Dialog title={confirmation.kind === "prepare" ? "Start a fresh trail?" : "Choose another pace?"} onClose={() => setConfirmation(null)}>
      <p className={styles.confirmCopy}>{confirmation.kind === "prepare" ? "This replaces your unfinished run with a fresh seed. Your local best stays in your field notes." : "Your current run will stay saved and paused. You can come back to it from mode selection."}</p>
      <div className={styles.panelActions}><button className={styles.secondary} onClick={() => setConfirmation(null)}>Keep this run</button><button className={styles.primary} onClick={() => { const next = confirmation; runtime.current.blocked = false; setConfirmation(null); if (next.kind === "prepare") prepare(next.mode); else choose(); }}>{confirmation.kind === "prepare" ? "Start fresh" : "Choose mode"}</button></div>
    </Dialog>}
  </main>;
}
