"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flap, step, STEP, presets, type Mode } from "@/games/paperwing/engine";
import { defaultSettings, emptyRecords, loadRecords, loadSession, loadSettings, newSession, recordResult, saveSession, saveValue, RECORDS_KEY, SETTINGS_KEY, type Session, type Settings, type Records } from "@/games/paperwing/persistence";
import { useViharPlay } from "@/lib/use-vihar-play";
import { createAudio } from "./audio";
import { BirdMark, FlightField } from "./art";
import { Dialog, PaperwingFooter, PaperwingNav } from "./shared";
import styles from "./paperwing.module.css";

type View = "choose" | "ready" | "flying" | "paused" | "countdown" | "result";
const activeView = (view: View) => view === "flying" || view === "paused" || view === "countdown";
const withStorage = (operation: (storage: Storage) => boolean): boolean => { try { return operation(window.localStorage); } catch { return false; } };

export default function PaperwingPlay() {
  const [view, setView] = useState<View>("choose"), [session, setSession] = useState<Session | null>(null);
  const [previous, setPrevious] = useState<Session | null>(null), [settings, setSettings] = useState<Settings>(defaultSettings);
  const [records, setRecords] = useState<Records>(emptyRecords), [saving, setSaving] = useState(true), [notice, setNotice] = useState("");
  const [countdown, setCountdown] = useState(3), [confirm, setConfirm] = useState<Mode | null>(null);
  const runtime = useRef<{ view: View; session: Session | null; previous: Session | null; records: Records; settings: Settings; lastSave: number }>({ view: "choose", session: null, previous: null, records: emptyRecords(), settings: defaultSettings, lastSave: 0 });
  const audio = useRef<ReturnType<typeof createAudio> | null>(null), held = useRef(new Set<string>());
  const inRound = activeView(view) && session?.run.status === "flying";
  const vihar = useViharPlay("paperwing", inRound, view === "flying");

  const persist = useCallback((value: Session) => {
    setSaving(withStorage((storage) => saveSession(storage, value)));
    runtime.current.previous = value; setPrevious(value);
  }, []);
  const publish = useCallback((value: Session, next: View) => {
    runtime.current.session = value; runtime.current.view = next;
    setSession(value); setView(next);
    if (next === "result") {
      const bests = recordResult(runtime.current.records, value.run);
      runtime.current.records = bests; setRecords(bests);
      const ok = withStorage((storage) => saveValue(storage, RECORDS_KEY, bests));
      persist(value); if (!ok) setSaving(false);
    }
  }, [persist]);
  const pauseFlight = useCallback(() => {
    const r = runtime.current;
    if ((r.view !== "flying" && r.view !== "countdown") || !r.session) return;
    held.current.clear(); audio.current?.stop(); publish(r.session, "paused"); persist(r.session);
  }, [persist, publish]);
  const beginResume = useCallback(() => {
    const r = runtime.current;
    if (r.view !== "paused" || !r.session || vihar.paused || document.visibilityState !== "visible" || !document.hasFocus()) return;
    held.current.clear(); setCountdown(3); publish(r.session, "countdown");
  }, [publish, vihar.paused]);
  const takeFlap = useCallback(() => {
    const r = runtime.current;
    if (!r.session || (r.view !== "flying" && r.view !== "ready") || vihar.paused || document.visibilityState !== "visible") return;
    const next = { ...r.session, run: flap(r.session.run) };
    audio.current?.flap(); publish(next, "flying"); persist(next);
  }, [persist, publish, vihar.paused]);
  const prepare = useCallback((mode: Mode) => {
    held.current.clear(); audio.current?.stop();
    const fresh = newSession(mode, crypto.getRandomValues(new Uint32Array(1))[0], crypto.randomUUID());
    runtime.current.lastSave = 0; setConfirm(null); setNotice(""); publish(fresh, "ready"); persist(fresh);
  }, [persist, publish]);
  const requestFresh = useCallback((mode: Mode) => {
    const old = runtime.current.session ?? runtime.current.previous;
    if (old?.run.status === "flying") { pauseFlight(); setConfirm(mode); } else prepare(mode);
  }, [pauseFlight, prepare]);
  const choose = useCallback(() => {
    pauseFlight();
    const r = runtime.current; if (r.session) persist(r.session);
    r.view = "choose"; setView("choose");
  }, [pauseFlight, persist]);
  const updateSettings = useCallback((value: Settings) => {
    runtime.current.settings = value; setSettings(value); audio.current?.enable(value.sound);
    if (!withStorage((storage) => saveValue(storage, SETTINGS_KEY, value))) setSaving(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const currentRuntime = runtime.current;
    audio.current = createAudio(() => setNotice("Sound is unavailable in this browser. Your flight can continue quietly."));
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const storage = window.localStorage, loaded = loadSession(storage), preferences = loadSettings(storage), bests = loadRecords(storage);
        runtime.current.previous = loaded.session; runtime.current.settings = preferences; runtime.current.records = bests;
        setPrevious(loaded.session); setSettings(preferences); setRecords(bests); audio.current?.enable(preferences.sound);
        if (loaded.damaged) setNotice("The saved flight could not be restored. Start a fresh flight below.");
      } catch { setSaving(false); }
    });
    return () => {
      cancelled = true;
      const current = currentRuntime.session;
      if (current) withStorage((storage) => saveSession(storage, current));
      audio.current?.dispose(); audio.current = null;
    };
  }, []);
  useEffect(() => {
    const blur = () => { held.current.clear(); pauseFlight(); };
    const visibility = () => { if (document.visibilityState !== "visible") blur(); };
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("dialog,input,textarea,select")) return;
      const phase = runtime.current.view;
      if (event.key === "Escape" && activeView(phase)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.repeat) return;
        if (phase === "paused") beginResume(); else pauseFlight();
        return;
      }
      if (!["Space", "ArrowUp", "KeyW"].includes(event.code) || (event.code === "Space" && target instanceof Element && target.closest("button,a"))) return;
      if (phase !== "ready" && phase !== "flying") return;
      event.preventDefault();
      if (event.repeat || held.current.has(event.code)) return;
      held.current.add(event.code); takeFlap();
    };
    const keyup = (event: KeyboardEvent) => { held.current.delete(event.code); };
    window.addEventListener("keydown", keydown, true); window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur); window.addEventListener("pagehide", blur); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("keydown", keydown, true); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); window.removeEventListener("pagehide", blur); document.removeEventListener("visibilitychange", visibility); };
  }, [beginResume, pauseFlight, takeFlap]);
  useEffect(() => {
    if (vihar.paused) queueMicrotask(pauseFlight);
  }, [vihar.paused, pauseFlight]);
  useEffect(() => {
    if (view !== "flying" && view !== "countdown") return;
    let frame = 0, last = performance.now(), remaining = 3, stopped = false;
    const tick = (now: number) => {
      const r = runtime.current;
      if (stopped || !r.session || (r.view !== "flying" && r.view !== "countdown")) return;
      const elapsed = Math.max(0, (now - last) / 1000); last = now;
      if (document.visibilityState !== "visible" || !document.hasFocus() || elapsed > .15) {
        pauseFlight(); return;
      }
      if (r.view === "countdown") {
        remaining -= elapsed;
        setCountdown(Math.max(1, Math.ceil(remaining)));
        if (remaining <= 0) { publish(r.session, "flying"); return; }
      } else {
        let accumulator = r.session.remainder + elapsed, run = r.session.run;
        const oldScore = run.score;
        while (accumulator >= STEP && run.status === "flying") { run = step(run); accumulator -= STEP; }
        const updated = { ...r.session, run, remainder: run.status === "ended" ? 0 : Math.max(0, accumulator) };
        if (run.score > oldScore) audio.current?.gate();
        if (run.status === "ended") { audio.current?.stop(); publish(updated, "result"); return; }
        publish(updated, "flying");
        if (run.elapsed - r.lastSave >= 1) { r.lastSave = run.elapsed; persist(updated); }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(frame); };
  }, [view, pauseFlight, persist, publish]);

  const best = Math.max(records[session?.run.mode ?? settings.mode].score, session?.run.score ?? 0);
  return <main id="main-content" className={view === "choose" ? styles.page : styles.fullPlay} data-vihar-embedded={vihar.embedded || undefined} data-paperwing-view={view}>
    {view === "choose" && <PaperwingNav embedded={vihar.embedded}>
      {vihar.embedded && <button className={styles.textButton} onClick={() => { pauseFlight(); vihar.exit(); }}>← Exit to Vihar</button>}
      <button className={styles.soundButton} onClick={() => updateSettings({ ...settings, sound: !settings.sound })} aria-pressed={settings.sound} aria-label={settings.sound ? "Turn sound off" : "Turn sound on"}>{settings.sound ? "Sound on" : "Sound off"}</button>
    </PaperwingNav>}
    {view === "choose" ? <section className={styles.choose} aria-labelledby="choose-title">
      <div className={styles.screenHeading}><p className={styles.eyebrow}>01 / PICK YOUR KIND OF SKY</p><h1 id="choose-title">Every flight starts<br /><span>with a little possibility.</span></h1><p>One tap. One opening. Your own quiet rhythm.</p></div>
      <fieldset className={styles.modeGrid}><legend className={styles.srOnly}>Choose a flight mode</legend>{(["standard", "practice"] as const).map((mode) => <label key={mode} className={styles.modeCard} data-selected={settings.mode === mode}>
        <input type="radio" name="mode" value={mode} checked={settings.mode === mode} onChange={() => updateSettings({ ...settings, mode })} />
        <span className={styles.stamp}><BirdMark /><small>{mode === "standard" ? "AIR POST" : "SLOW POST"}</small></span><span className={styles.modeCopy}><span className={styles.eyebrow}>{mode === "standard" ? "FIND YOUR RHYTHM" : "A LITTLE MORE ROOM"}</span><strong>{presets[mode].name}</strong><span>{mode === "standard" ? "The classic flight. A steady sky and a thoughtful tap." : "Wider openings. Gentler speed. Space to find your wings."}</span><small>PERSONAL BEST · {records[mode].score} GATES</small></span><span className={styles.radioMark} aria-hidden="true">{settings.mode === mode ? "✓" : ""}</span>
      </label>)}</fieldset>
      <div className={styles.chooseActions}><button className={styles.primary} onClick={() => requestFresh(settings.mode)}>Prepare a flight <span aria-hidden="true">↗</span></button>
        {previous && <button className={styles.textButton} onClick={() => { publish(previous, previous.run.status === "ended" ? "result" : previous.run.status === "ready" ? "ready" : "paused"); }}>{previous.run.status === "ended" ? "Your last flight" : "Resume saved flight"}<span aria-hidden="true">→</span></button>}
      </div><p className={styles.screenNote} role="status">{notice || vihar.notice || (!saving ? "Saving unavailable. Your flight stays in this tab." : "Saved on this device. Ready when you are.")}</p>
    </section> : session && <>
      <header className={styles.playHud} aria-label="Paperwing scoreboard">
        <button className={styles.hudName} onClick={choose} aria-label="Paperwing — choose a flight mode">Paperwing</button>
        <div className={styles.hudScores}><span>Points <output aria-label="Points">{session.run.score}</output></span><span>High score <output aria-label="High score">{best}</output></span></div>
        <div className={styles.hudActions}>
          {view === "flying" && <button className={styles.hudIcon} aria-label="Pause flight" onClick={pauseFlight}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg></button>}
          {vihar.embedded && <button className={styles.hudIcon} aria-label="Exit to Vihar" onClick={() => { pauseFlight(); vihar.exit(); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}
        </div>
      </header>
      <section className={styles.fullStage} aria-label={`${presets[session.run.mode].name} flight`}>
        <FlightField run={session.run} moving={view === "flying"} onFlap={takeFlap} />
        {view !== "flying" && <div className={styles.flightOverlay}>
          {view === "countdown" ? <button className={styles.startIcon} aria-label={`Resuming in ${countdown}. Keep paused.`} onClick={pauseFlight}><span className={styles.resumeCount} role="status">{countdown}</span></button> : <button className={styles.startIcon} disabled={vihar.paused} aria-label={view === "result" ? "Try again" : view === "ready" ? "Take flight" : "Resume flight"} onClick={view === "result" ? () => prepare(session.run.mode) : view === "ready" ? takeFlap : beginResume}>
            <svg viewBox="0 0 32 32" aria-hidden="true">{view === "result" ? <path d="M25 14a10 10 0 1 0-3 10M25 6v8h-8" /> : <path d="m12 7 14 9-14 9Z" />}</svg>
          </button>}
        </div>}
      </section>
      {(!saving || notice || vihar.notice) && <p className={styles.srOnly} role="status">{notice || vihar.notice || "Saving unavailable. Keep this tab open."}</p>}
    </>}
    {view === "choose" && <PaperwingFooter />}
    {confirm && <Dialog title="Start a fresh flight?" onClose={() => setConfirm(null)}><p>Your unfinished flight is saved here. Starting fresh replaces it with a new {presets[confirm].name.toLowerCase()} sky.</p><div className={styles.dialogActions}><button className={styles.primary} onClick={() => prepare(confirm)}>Start fresh ↗</button><button className={styles.secondary} onClick={() => setConfirm(null)}>Keep my flight</button></div></Dialog>}
  </main>;
}
