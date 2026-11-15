"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Side } from "@/games/carrom/engine";
import type { QueenJourney } from "@/games/carrom/queen-transfer";
import { Coin } from "./board-art";
import styles from "./table.module.css";

export function QueenFlight({ journey, surface, orientation, paused, onDone }: {
  journey: QueenJourney; surface: RefObject<HTMLDivElement | null>; orientation: Side; paused: boolean; onDone: () => void;
}) {
  const token = useRef<HTMLSpanElement>(null), animation = useRef<Animation | null>(null);
  const done = useRef(onDone);
  useLayoutEffect(() => { done.current = onDone; }, [onDone]);
  useLayoutEffect(() => {
    const root = surface.current, element = token.current;
    const slot = root?.querySelector<HTMLElement>(`[data-queen-slot="${journey.side}"]`);
    if (!root || !element || !slot) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frames = () => {
      const board = root.getBoundingClientRect(), target = slot.getBoundingClientRect();
      const x = (orientation === "cream" ? journey.x : 600 - journey.x) / 600 * board.width;
      const y = (orientation === "cream" ? journey.y : 600 - journey.y) / 600 * board.height;
      const endX = target.left + target.width / 2 - board.left, endY = target.top + target.height / 2 - board.top;
      const at = (px: number, py: number, scale: number, rotate = 0) => `translate(${px - 22}px, ${py - 22}px) scale(${scale}) rotate(${rotate}deg)`;
      const dock = at(endX, endY, target.width / 44), centre = at(x, y, 1.3);
      if (reduced.matches) return [{ transform: dock, opacity: 0 }, { transform: dock, opacity: 0 }];
      if (journey.kind === "cover") return [{ transform: dock, filter: "drop-shadow(0 0 0px #efb55a)" }, { transform: at(endX, endY, .95), filter: "drop-shadow(0 0 16px #efb55a)", offset: .45 }, { transform: dock }];
      if (journey.kind === "return") return [{ transform: dock, opacity: 1 }, { transform: at((x + endX) / 2, y * .25, 1, -20), offset: .5 }, { transform: at(x, y, .48), opacity: 0 }];
      return [{ transform: at(x, y, .25), opacity: 0 }, { transform: centre, opacity: 1, offset: .18 }, { transform: centre, opacity: 1, offset: .4 }, { transform: at(endX, endY + 38, .8, -12), opacity: 1, offset: .82 }, { transform: dock, opacity: 1 }];
    };
    const flight = element.animate(frames(), { duration: reduced.matches ? 1 : journey.kind === "take" ? 1800 : 1000, easing: "cubic-bezier(.22,.75,.22,1)", fill: "both" });
    animation.current = flight;
    flight.onfinish = () => done.current();
    const observer = new ResizeObserver(() => (flight.effect as KeyframeEffect).setKeyframes(frames()));
    observer.observe(root);
    return () => { observer.disconnect(); flight.onfinish = null; flight.cancel(); animation.current = null; };
  }, [journey, surface, orientation]);
  useLayoutEffect(() => { if (paused) animation.current?.pause(); else animation.current?.play(); }, [paused]);
  return <span ref={token} className={styles.queenFlight} data-journey={journey.kind} aria-hidden="true"><Coin color="queen" /></span>;
}
