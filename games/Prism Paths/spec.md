# Prism Paths

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `prism-paths` · **Category:** Puzzle · **Players:** One  
**Page:** `/prism-paths` · **API base:** `/api/games/prism-paths`  
**Style:** Optical Print Room · **Inspiration:** Mirror-and-light routing

## 1. Identity and experience

Rotate mirrored tiles to send a printed beam through a small optical diagram. Fine lines, precise geometry, and restrained spectral accents create a quiet instrument-like puzzle.

Target session: 3–10 minutes. Solve an authored fixed layout by changing mirror orientation, with no real-time pressure, physics randomness, movable crates, or coloured-liquid mixing.

## 2. Exact rules

- The board is an orthogonal grid of fixed empty cells, walls, fixed directional emitters, fixed receivers, and rotatable mirrors. Tile positions never change.
- Each mirror has two distinct states: `/` and `\`. One quarter-turn toggles them; a half-turn returns to the same logical state. No prism splitting or diagonal beam travel is used.
- Beams move cell-to-cell in cardinal directions. A `/` mirror maps East→North, North→East, West→South, South→West. A `\` mirror maps East→South, South→East, West→North, North→West.
- Empty cells and receivers transmit a beam without changing direction. Walls, the board boundary, and other emitter cells terminate the beam. Emitters originate their own labelled beam and are not rotatable.
- Each receiver names the emitter label it requires, such as A or B. It is lit when at least one matching beam visits its cell; a nonmatching beam does not satisfy it. Independent beams may cross in an empty cell without interacting.
- Recompute paths after each accepted turn. Detect repetition of `(emitter label, cell, direction)` and stop tracing that path; a closed beam loop cannot hang the game or illuminate unvisited cells.
- Victory requires every receiver lit by its required beam. Beams may end at walls/boundaries after passing receivers; there is no extra requirement to fill every cell.
- Every authored puzzle has exactly one mirror configuration satisfying all receivers, considering `/` and `\` only. Every rotatable mirror lies on a required beam path in that solution. Validate these conditions before publishing levels.

## 3. Difficulty, moves, and ending

| Preset | Grid | Content |
| --- | --- | --- |
| First light | 5×5 | One emitter, 3–5 mirrors, 1–2 receivers |
| Study | 7×7 | One emitter, 6–10 mirrors, 2–3 receivers |
| Spectrum | 9×9 | Two labelled emitters, 10–14 mirrors, 3–4 receivers |

Levels ship as authored layouts with initial orientations, emitter directions/labels, receiver requirements, solution, and uniqueness validation. Initial state must be unsolved.

Each accepted mirror toggle adds one cumulative turn. Fixed-cell selection scores nothing. Show lit receivers/total and optional active time. Results show level, turns, time, hints, and assistance; local records compare only the same level/version. Hint sets one selected mirror to its solution orientation and marks assistance, even when it was already correct.

## 4. Controls and interruption

- Tap/click a mirror to toggle it. Arrow keys navigate the grid; Enter/Space turns a focused mirror. Fixed elements expose their role, direction, and required label through accessible text.
- Provide Undo, Redo, Hint, Restart, and Pause. Undo follows the shared cumulative-counter rules.
- Paths update from committed state immediately; a decorative tracing animation never delays validation or blocks another toggle.
- Zoom/pan large layouts without changing routing coordinates. Pause freezes the optional timer and any tracing feedback.

## 5. Detailed 2D visual direction — Optical Print Room

- Palette: drafting paper `#EFECE4`, graphite `#283F47`, amber beam `#B98B3C`, blue beam `#497F98`, muted rose `#AF727B`.
- Use crisp thin grid lines and flat mirror tiles with prominent slash marks. Emitters are labelled arrow capsules; receivers are outlined rings carrying the same live letter and a clear lit tick.
- Distinguish A/B beams by solid/dashed line pattern as well as colour. A receiver's label and status remain readable when a beam crosses it.
- Walls are solid hatched cells. Crossings, loops, and terminated paths are visibly distinct from valid lit receivers through markers and a concise status message, without revealing solution orientations.
- Overview uses an original optical line diagram. Setup is a row of instrument plates. Play keeps receiver status above the grid and tools below. Results form a clean signed diagram print.
- A short linear beam trace may follow path recomputation. No glow bloom, lens flare, depth illusion, particle effects, or strobe. Reduced motion displays paths immediately.
- On phones, retain labelled targets and pan/zoom for the 9×9 board. Desktop offers an explanation column beside the drafting sheet.
- Optional sound: a small mechanical turn click and one soft chord when all receivers light.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Store level ID/version, binary mirror orientations, turn count, undo/redo, active time, hints, and assistance. Derive beams/receiver states from validated orientations; never trust saved illumination flags as a victory state. Bound beam tracing by the finite directional state space.

## 7. Future asset handoff

Original mirror/emitter/receiver symbols, hatched walls, drafting frame, labelled beam styles, authored unique layouts, completion print, and optional sounds. Engine and custom screens remain planned.

## 8. Acceptance when implemented

- All eight mirror reflection mappings, independent beam crossings, receiver labels, and termination conditions work exactly as specified.
- Closed loops terminate tracing; saves cannot fabricate receiver completion.
- All shipped layouts have one validated solution with no unused rotatable mirror.
- Input, undo, hints, zoom, and reduced-motion tracing preserve the logical result.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
