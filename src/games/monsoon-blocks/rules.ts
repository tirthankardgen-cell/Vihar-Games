export { RULES_VERSION as MONSOON_RULES_VERSION } from "./engine.ts";
export const monsoonModes = ["solo"] as const;
export const monsoonRules = [
  { title: "A window, seven shapes", items: [
    "Fill complete horizontal rows on a 10-column, 20-row window. The seven four-cell shapes are I, O, T, J, L, S, and Z. Each shuffled bag contains every shape once; it is emptied before the next bag is shuffled. The next three shapes are always shown.",
    "Spawn masks are I: ####; O: ##/##; T: .#./###; J: #../###; L: ..#/###; S: .##/##.; Z: ##./.##. Slashes separate rows. Each shape starts in this orientation, centred by its bounding width, with its top row at −2. Four hidden rows run from −4 to −1. A blocked spawn ends play.",
  ] },
  { title: "Find a place for the rain", items: [
    "Left and Right move one cell. Down soft-drops one cell and earns one point per accepted row. Space hard-drops to the ghost outline and locks immediately, earning two points per travelled row. Gravity and failed moves earn no points.",
    "Up or X rotates clockwise inside the smallest bounding rectangle; empty outer rows and columns are trimmed. Keep the top-left anchor and try horizontal offsets 0, −1, +1, −2, +2, in that order. The first fit wins. There are no vertical kicks; the O square stays unchanged.",
  ] },
  { title: "Save a shape for later", items: [
    "C holds the active shape once before it locks. An empty hold takes the next preview shape. A swap restores the held shape to its original orientation and spawn position. A successful lock makes hold available again. A blocked held-piece spawn ends the run.",
    "Hold Left or Right for a first repeat after 170 ms, then every 70 ms. Down repeats every 45 ms. Rotate, hold, and hard drop need a separate press each time. Labelled touch controls follow exactly the same rules. When both directions are held, the most recently pressed direction moves.",
  ] },
  { title: "A moment to settle", items: [
    "Touching support starts a 400 ms lock delay. Time counts only while grounded. A successful grounded move or rotation resets it at most ten times for that piece; failed moves and the unchanged O shape do not. Becoming airborne suspends the remaining delay without restoring resets.",
    "On lock, any cell above visible row zero ends the run with Window full before blocks settle or rows clear. Otherwise the whole shape settles; all full rows clear together and the rows above shift down. The next shape spawns immediately. The brief row wipe never postpones the rules.",
  ] },
  { title: "Your own steady rhythm", items: [
    "One, two, three, or four rows cleared together score 100, 300, 500, or 800 × the level before that clear. Level starts at 1 and becomes 1 + floor(total rows / 10). There are no spin awards, combos, back-to-back bonuses, lives, power-ups, or paid continues.",
    "Standard gravity attempts a drop every max(80, 800 − 60 × (level − 1)) milliseconds. Practice doubles that interval and keeps the same scoring, controls, and lock delay. It has its own labelled local best. Reflex play relies on visual timing; Practice gives you more time to plan.",
  ] },
  { title: "Take a little pause", items: [
    "Pause or Escape freezes gravity, lock delay, repeats, active time, and sound. Switching tabs, losing window focus, leaving the page, or a Vihar host pause also stops play. Returning alone never resumes it. Resume deliberately starts 3, 2, 1; the countdown does not move or drop a shape.",
    "Unfinished windows restore paused on this device, with the grid, shape, hold, preview, bag, generator, and timers intact. Restart asks before replacing progress. Results show score, rows, highest level, active time, and your preset’s personal best. Glass sounds and original Cloudlight background music start off, have separate switches, and pause with play. Printed patterns distinguish shapes beyond colour. Play runs locally after loading.",
  ] },
] as const;
