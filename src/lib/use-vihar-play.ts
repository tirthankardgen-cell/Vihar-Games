"use client";

import { useEffect, useRef, useState } from "react";
import { createViharEmbed } from "./vihar-sdk/vihar-embed.js";
import { createViharId } from "./vihar-sdk/vihar-id.js";

// These SDK modules mirror Vihar's public v1 modules. The engine remains the
// only source of round state; menus and handovers never count as playing.
export function useViharPlay(gameId: "chess" | "tic-tac-toe" | "carrom" | "paperwing" | "sudoku" | "dune-dash" | "monsoon-blocks" | "silk-trail", inRound: boolean, playing: boolean) {
  const [embedded, setEmbedded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [manualPause, setManualPause] = useState(false);
  const [notice, setNotice] = useState("");
  const runtime = useRef<{ update: (round: boolean, active: boolean) => void; exit: () => void } | null>(null);
  const paused = manualPause || !visible;

  useEffect(() => {
    let disposed = false, stopped = false, connected = false, started = false;
    let round = false, active = false, parentVisible = true;
    let queue = Promise.resolve();
    const reportError = () => { if (!disposed) setNotice("Account activity could not connect. You can keep playing as a guest."); };
    const id = createViharId({ gameId, onError: reportError });
    const sync = () => {
      queue = queue.catch(reportError).then(async () => {
        if (disposed || stopped || !connected) return;
        if (round && !started) { await id.startSession(); started = true; }
        id.setPlaying(!disposed && !stopped && round && active && parentVisible);
        if (!round && started) { await id.stopSession(); started = false; }
      }).catch(reportError);
    };
    const stop = async () => {
      stopped = true;
      id.setPlaying(false);
      await queue;
      await id.stopSession();
    };
    const bridge = createViharEmbed({
      gameId,
      onVisibilityChange(value) {
        parentVisible = value;
        if (!disposed) setVisible(value && document.visibilityState === "visible");
        id.setPlaying(round && active && value);
      },
      onExit: stop,
    });
    runtime.current = {
      update(nextRound, nextActive) { round = nextRound; active = nextActive; sync(); },
      exit() { void bridge.exit(); },
    };
    const visibility = () => { if (!disposed) setVisible(parentVisible && document.visibilityState === "visible"); };
    document.addEventListener("visibilitychange", visibility);
    void id.resumeLaunch().catch(reportError).then(() => {
      if (disposed || stopped) return;
      connected = true;
      setEmbedded(bridge.embedded);
      sync();
      // The menu is hydrated, usable, and its Exit action has been installed.
      requestAnimationFrame(() => { if (!disposed && !stopped) bridge.ready(); });
    });
    return () => {
      disposed = true;
      runtime.current = null;
      bridge.dispose();
      document.removeEventListener("visibilitychange", visibility);
      void stop().catch(() => {});
    };
  }, [gameId]);

  useEffect(() => { runtime.current?.update(inRound, playing && !paused); }, [inRound, playing, paused]);
  return { embedded, paused, manualPause, notice, togglePause: () => setManualPause((value) => !value), exit: () => runtime.current?.exit() };
}
