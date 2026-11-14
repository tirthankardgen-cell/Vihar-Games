# Monsoon Blocks

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `monsoon-blocks` · **Category:** Arcade · **Players:** One  
**Page:** `/monsoon-blocks` · **API base:** `/api/games/monsoon-blocks`  
**Style:** Rain Window · **Inspiration:** Falling-block line clearing

## 1. Identity and experience

Arrange seven familiar four-cell shapes on a flat rain-window panel. Muted stained-glass colours, waterline borders, and a steady rhythm give the game its own character. The rules use a simple documented rotation system rather than branded presentation or an unexplained tournament variant.

Target session: 3–10 minutes. This is continuous solo falling-block play; no opponents, garbage attacks, paid continues, or power-ups.

## 2. Board, pieces, and movement

- Board: 10 columns × 20 visible rows, with four hidden spawn rows `-4` through `-1`. Cells are integer coordinates; settled blocks never overlap.
- The seven shapes use these spawn masks (`#` occupied, `/` next row): `I: ####`, `O: ##/##`, `T: .#./###`, `J: #../###`, `L: ..#/###`, `S: .##/##.`, `Z: ##./.##`. Trailing empty columns are not cells.
- Shuffle one copy of every shape into a seven-piece bag. Consume it completely before shuffling the next. Show the next three pieces.
- Spawn each shape in its mask orientation, bounding-box top row `-2`, and left column `floor((10 - width) / 2)`. A blocked spawn ends the run.
- Left/right moves one column if the destination fits. Soft drop moves down one row per accepted drop step. Hard drop travels to the lowest legal position and locks immediately.
- Rotate clockwise by rotating the current minimal bounding rectangle, then trimming empty outer rows/columns. Keep its top-left anchor and try horizontal offsets `0, -1, +1, -2, +2` in that order. Accept the first legal fit; otherwise leave the piece unchanged. There are no vertical kicks; `O` remains unchanged.
- A piece can be held once before its lock. An empty hold consumes the next bag piece; a swap restores the held shape's spawn orientation/position. A successful lock resets hold availability. A blocked held-piece spawn also ends the run.

## 3. Locking, row clearing, and difficulty

- Gravity attempts a downward move every `max(80, 800 - 60 × (level - 1))` milliseconds. Level starts at one and becomes `1 + floor(total cleared rows / 10)` after a clear.
- After first touching support, a 400 ms lock delay runs only while grounded. A successful grounded move/rotation resets the delay at most ten times for that piece; subsequent adjustments cannot postpone locking. Becoming airborne suspends the remaining delay and does not replenish reset allowance.
- On lock, any occupied cell above visible row zero causes **Window full** and ends the run before row clearing. Otherwise settle the whole piece, identify all complete visible rows, remove them together, and shift rows above down by the removed count.
- Score row clears using the level before that clear: one row = 100, two = 300, three = 500, four = 800, multiplied by level. Accepted player soft-drop rows add one point each; hard-drop distance adds two points per row. Gravity and failed moves score nothing.
- No spin awards, combos, back-to-back bonus, or hidden scoring. Clear feedback never delays the next authoritative spawn or grants extra input time.

## 4. Controls and results

- Keyboard: arrows left/right to move, Down to soft drop, Up or X to rotate, Space to hard drop, C to hold, Escape to pause. Left/right repeat starts after 170 ms and repeats every 70 ms; soft drop repeats every 45 ms. Rotation, hold, and hard drop require separate presses.
- Touch/pointer: labelled left, right, rotate, drop, hard-drop, hold, and pause controls. Held movement uses the same repeat rules. A ghost outline previews the exact hard-drop landing position.
- Pause clears held input/repeat state and freezes gravity/lock counters. Resume uses the shared countdown; a resume gesture cannot drop a piece.
- Results show score, rows, highest level, active time, and local best. There is one standard scoring preset; an optional slower practice preset keeps a separate record and is labelled practice.

## 5. Detailed 2D visual direction — Rain Window

- Palette: warm cloud `#EEE9DF`, ink slate `#263B49`, rain blue `#5D8195`, sea glass `#619787`, muted plum `#806A85`, amber `#C39551`. Dark outlines and subtle patterns distinguish the seven shapes beyond colour.
- Board: a perfectly flat upright rectangle divided by thin mullion lines. Blocks look like printed glass swatches, with no bevel, shine implying depth, or raised cube treatment.
- Rain lines sit outside the board or below a low-contrast background layer; never hide the ghost, grid, or next/hold trays.
- Overview features seven arranged swatches beneath a minimal window arch. Setup explains rotation and scoring. Play keeps next and hold trays beside the board on desktop and in one row above it on phones.
- Rows clear with a brief horizontal wipe. Piece motion and rotation remain planar; reduced motion uses immediate state changes. Loss quietly marks the occupied skyline and shows a paper result slip.
- Keep the entire visible board and primary touch controls reachable without browser scrolling during play. State previews must match actual piece cells.
- Optional sound: muted glass taps for placement and a soft rainstick chord for a clear; no continuous rain audio by default.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Save settled grid, active shape/cells/anchor, hold and allowance, bag/preview and generator state, gravity/lock remainder, reset count, rows, level, score, preset, and active time. Validate fit, legal masks, bounded counters, and level/row agreement. Restore paused; no falling occurs during load.

## 7. Future asset handoff

Seven original patterned block swatches, rain-window border, ghost/hold/next markers, flat rain motif, result slip, and optional placement/clear sounds. Gameplay and assets remain future work.

## 8. Acceptance when implemented

- Every bag contains the seven shapes once, and preview/hold order is reproducible after save restoration.
- Rotation, horizontal fit offsets, drop distances, lock delay, and the ten-reset cap match these rules.
- Multi-row clearing is simultaneous; hidden-cell top-out takes precedence; scoring uses the pre-clear level.
- Touch/key repeat, ghost landing, pause, and gravity remain consistent at different frame rates.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
