import type { Action } from "./engine.ts";

// Browser auto-repeat is ignored. Keyboard and pointer holds use this same clock.
export function createInput() {
  const held = new Map<string, { action: Action; remaining: number; order: number }>();
  let order = 0;
  return {
    press(token: string, action: Action): Action[] {
      if (held.has(token)) return [];
      held.set(token, { action, remaining: action === "soft-drop" ? 45 : 170, order: order++ });
      return [action];
    },
    release(token: string) { held.delete(token); },
    clear() { held.clear(); },
    advance(ms: number): Action[] {
      const actions: Action[] = [];
      let horizontal = -1;
      for (const item of held.values()) if (item.action === "left" || item.action === "right") horizontal = Math.max(horizontal, item.order);
      for (const item of held.values()) {
        if (!["left", "right", "soft-drop"].includes(item.action)) continue;
        if (item.action !== "soft-drop" && item.order !== horizontal) continue;
        item.remaining -= ms;
        while (item.remaining <= 0) {
          actions.push(item.action); item.remaining += item.action === "soft-drop" ? 45 : 70;
        }
      }
      return actions;
    },
  };
}
