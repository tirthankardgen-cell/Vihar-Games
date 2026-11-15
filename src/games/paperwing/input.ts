export type FlightView = "loading" | "choose" | "ready" | "flying" | "paused" | "countdown" | "result";
export const flightKeys = ["Space", "ArrowUp", "KeyW", "Escape"];

export function flightAction(view: FlightView, code: string) {
  if (code === "Escape") return view === "paused" ? "resume" : view === "flying" || view === "countdown" ? "pause" : null;
  if (code === "Space") {
    if (view === "choose") return "start";
    if (view === "ready" || view === "flying") return "flap";
    if (view === "paused") return "resume";
    if (view === "result") return "retry";
  }
  return view === "flying" && (code === "ArrowUp" || code === "KeyW") ? "flap" : null;
}

// Keep the latch across start, countdown, collision and retry. Only a key release
// or focus loss ends a press; a view transition must not manufacture a new one.
export function createFlightInput() {
  const held = new Set<string>();
  return {
    press(code: string, repeat: boolean) {
      if (repeat || held.has(code)) return false;
      held.add(code); return true;
    },
    release(code: string) { held.delete(code); },
    clear() { held.clear(); },
  };
}
