"use client";
import { useEffect, useRef } from "react";
import { coinRadius, strikerRadius, strikerPosition, type Match, type Shot, type Side } from "@/games/carrom/engine";
import type { Frame } from "@/games/carrom/physics";
import { aimGuide } from "@/games/carrom/aim-guide";
import { pockets } from "@/games/carrom/geometry";
import { BoardArt } from "./board-art";
import styles from "./carrom.module.css";

export const snapPosition = (position: number) => Math.abs(position) > 80 ? Math.sign(position) * 100 : Math.round(position);

export function Board({ match, shot, frame, orientation, locked, onAim, onShoot, onPull }: { match: Match; shot: Shot; frame: Frame | null; orientation: Side; locked: boolean; onAim: (shot: Shot) => void; onShoot: (shot: Shot) => void; onPull: (pulling: boolean) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<{ shot: Shot; pulling: boolean; x: number; y: number; pointerId: number } | null>(null);
  const previousFrame = useRef<Frame | null>(null);
  const pocketRipples = useRef<{ x: number; y: number; time: number }[]>([]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    element.width = 600 * scale; element.height = 600 * scale;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    const striker = strikerPosition(match.turn, shot);
    const bodies = frame ?? [...match.pieces, ...(!match.result ? [{ id: "striker", ...striker }] : [])];
    const now = performance.now();
    if (frame && previousFrame.current) {
      for (const body of previousFrame.current) if (!frame.some((next) => next.id === body.id)) {
        const [x, y] = pockets.reduce((closest, pocket) => Math.hypot(body.x - pocket[0], body.y - pocket[1]) < Math.hypot(body.x - closest[0], body.y - closest[1]) ? pocket : closest);
        pocketRipples.current.push({ x, y, time: now });
      }
    }
    previousFrame.current = frame;
    pocketRipples.current = frame ? pocketRipples.current.filter((ripple) => now - ripple.time < 550) : [];
    for (const ripple of pocketRipples.current) {
      const progress = (now - ripple.time) / 550;
      ctx.strokeStyle = `rgba(223, 179, 109, ${1 - progress})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ripple.x, ripple.y, 16 + progress * 23, 0, Math.PI * 2); ctx.stroke();
    }
    if (!frame && !locked && !match.result) {
      const guide = aimGuide(match, shot);
      ctx.strokeStyle = "#2b4a42"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); guide.forEach((point, i) => { if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); }); ctx.stroke();
      ctx.setLineDash([]);
      for (const point of guide) if (point.contact) {
        // The striker centre turns before the wall. Connect the guide to the
        // actual surface contact so the visible impact has no unexplained gap.
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(point.contact.x, point.contact.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(point.x, point.y, strikerRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#2b4a42"; ctx.beginPath(); ctx.arc(point.contact.x, point.contact.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      const end = guide.at(-1)!;
      ctx.beginPath(); ctx.arc(end.x, end.y, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(striker.x, striker.y, 22, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      if (gesture.current?.pulling) {
        const direction = match.turn === "cream" ? 1 : -1, radians = shot.angle * Math.PI / 180;
        const tail = { x: striker.x - Math.sin(radians) * shot.power * direction, y: striker.y + Math.cos(radians) * shot.power * direction };
        ctx.strokeStyle = "#af6443"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(striker.x, striker.y); ctx.lineTo(tail.x, tail.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(tail.x, tail.y, 7, 0, Math.PI * 2); ctx.stroke();
      }
    }
    for (const body of bodies) {
      const kind = body.id === "striker" ? "striker" : body.id === "q" ? "queen" : body.id.startsWith("c") ? "cream" : "ink";
      const r = kind === "striker" ? strikerRadius : coinRadius;
      ctx.fillStyle = { striker: "#dfb36d", queen: "#a83538", cream: "#fff5df", ink: "#293d35" }[kind];
      ctx.strokeStyle = kind === "ink" ? "#a99a77" : "#6d6146"; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(body.x, body.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(body.x, body.y, r * .7, 0, Math.PI * 2); ctx.lineWidth = .7; ctx.stroke();
      ctx.fillStyle = kind === "ink" || kind === "queen" ? "#f5e6c5" : "#6d6146";
      if (kind === "queen" || kind === "striker") {
        ctx.beginPath(); ctx.moveTo(body.x, body.y - r * .6); ctx.lineTo(body.x + r * .22, body.y - r * .22); ctx.lineTo(body.x + r * .6, body.y); ctx.lineTo(body.x + r * .22, body.y + r * .22); ctx.lineTo(body.x, body.y + r * .6); ctx.lineTo(body.x - r * .22, body.y + r * .22); ctx.lineTo(body.x - r * .6, body.y); ctx.lineTo(body.x - r * .22, body.y - r * .22); ctx.closePath(); ctx.fill();
      } else { ctx.beginPath(); ctx.arc(body.x, body.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
    }
  }, [match, shot, frame, locked]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = (event.clientX - rect.left) / rect.width * 600, y = (event.clientY - rect.top) / rect.height * 600;
    if (orientation === "ink") { x = 600 - x; y = 600 - y; }
    return { x, y };
  }
  function begin(event: React.PointerEvent<HTMLCanvasElement>) {
    if (locked || gesture.current || !event.isPrimary || event.button !== 0) return;
    const { x, y } = point(event), start = strikerPosition(match.turn, shot);
    if (Math.abs(y - start.y) > 30 || x < 140 || x > 460) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = snapPosition(Math.max(-100, Math.min(100, (x - 300) / 1.4 * (match.turn === "cream" ? 1 : -1))));
    const next = { ...shot, position };
    gesture.current = { shot: next, pulling: false, x, y, pointerId: event.pointerId };
    onAim(next);
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = gesture.current;
    if (!drag || locked || event.pointerId !== drag.pointerId) return;
    const { x, y } = point(event), direction = match.turn === "cream" ? 1 : -1;
    const start = strikerPosition(match.turn, drag.shot);
    if (!drag.pulling && (y - drag.y) * direction > 14) { drag.pulling = true; onPull(true); }
    if (drag.pulling) {
      const dx = x - start.x, dy = y - start.y;
      drag.shot = { ...drag.shot, angle: Math.round(Math.max(-75, Math.min(75, Math.atan2(-dx * direction, Math.max(1, dy * direction)) * 180 / Math.PI))), power: Math.max(1, Math.min(100, Math.round(Math.hypot(dx, dy)))) };
      // Pulling back onto the striker cancels the release instead of firing.
      if (Math.hypot(dx, dy) < 14 || dy * direction < 8) drag.shot.power = 0;
    } else {
      drag.shot = { ...drag.shot, position: snapPosition(Math.max(-100, Math.min(100, (x - 300) / 1.4 * direction))) };
    }
    onAim(drag.shot);
  }
  function release(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    move(event);
    gesture.current = null; onPull(false);
    if (!locked && drag.pulling && drag.shot.power >= 14) onShoot(drag.shot);
  }
  function cancel(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.pulling) onAim({ ...drag.shot, power: 0 });
    gesture.current = null; onPull(false);
  }
  return <div className={styles.liveBoard} data-orientation={orientation}>
    <BoardArt showPieces={false} />
    <canvas ref={canvas} className={styles.canvas} role="img" aria-label={`Carrom board. ${match.pieces.filter((p) => p.kind === "cream").length} cream and ${match.pieces.filter((p) => p.kind === "ink").length} dark coins remaining. Queen ${match.queen}. Slide the striker on your baseline, pull back to aim and power, release to strike. Keyboard controls are in Board options.`} onPointerDown={begin} onPointerMove={move} onPointerUp={release} onPointerCancel={cancel} onLostPointerCapture={cancel} />
  </div>;
}
