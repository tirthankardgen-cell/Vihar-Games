# Orbit Breaker

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `orbit-breaker` · **Category:** Arcade · **Players:** One  
**Page:** `/orbit-breaker` · **API base:** `/api/games/orbit-breaker`  
**Style:** Celestial Instrument · **Inspiration:** Paddle-and-brick breaker

## 1. Identity and experience

Keep a small comet aloft with a horizontal paddle and clear a field of star-chart tiles. Precise linework and restrained astronomical motifs create an original flat arcade instrument.

Target session: 2–8 minutes. One player, five authored stages, three shared lives. No power-up drops, weapons, ball multiplication, bosses, or online score submission.

## 2. World, paddle, and ball

- Simulate an 800×600 logical field. Side walls are at `x = 20` and `780`; top wall at `y = 40`. They reflect the ball. The bottom is open.
- Paddle centre starts at `(400, 560)`, width 96, height 12. Constrain its centre to `[68, 732]` so the paddle stays inside the side walls. Keyboard/pointer movement is limited to 600 units/second; no instant teleport through a ball.
- Ball radius is eight units. Before each launch it rests above the paddle at `y = 546` and follows its centre. Launch deliberately at 25° right of vertical, upward.
- Ball speed starts at 300 units/second on stage one, then increases by 20 per stage to 380 on stage five. Practice starts at 220 and increases by 15 per stage, using a separate record.
- A downward ball contacting the paddle's top reflects upward. Let `u = clamp((ball.x - paddle.x) / (paddle.width / 2), -1, 1)` and use an outgoing angle of `u × 60°` from upward vertical at that stage's fixed speed.
- Paddle side contact reflects horizontally only when it is an actual swept contact; the underside provides no rescue. Wall and tile collisions reflect by the contacted normal. Use swept circle/rectangle contact to avoid tunnelling.
- If a corner simultaneously contacts two perpendicular surfaces, invert both components and apply each contacted tile's hit once. Process earliest contact before later contacts in a step; a tile cannot take multiple hits from one unresolved contact.
- A life is lost when the ball is wholly below `y = 600`. Freeze play, deduct one life, and show Ready to launch on the same stage. No automatic launch or offscreen return.

## 3. Stages, tiles, and score

- Ship five authored solvable layouts, each with up to 8 columns × 4 rows of tiles in the upper field. Tile positions, durability, and stage order are fixed; no unbreakable tiles or random drops.
- Tiles require either one or two hits. A clear numeric pip/outline indicates remaining durability. Each valid ball hit subtracts one; a tile disappears at zero.
- Award 50 points per accepted hit, including the destroying hit. Clearing a stage awards an additional 200 points. There is no multiplier, catch bonus, time bonus, or remaining-life bonus.
- Each stage transition keeps lives/score, resets the ball to attached Ready state, and starts the next stage only after a deliberate launch. Clearing stage five wins **Chart complete**.
- Losing the third life ends **Comet lost**. Resolve a simultaneous final tile hit/stage clear before a later bottom crossing in chronological collision order; there is no extra life for clearing a stage.
- Results show score, stage reached/completed, lives remaining, active time, mode, and mode-specific local best. Restart begins stage one with three lives and zero score.

## 4. Controls and interruption

- Left/Right or A/D move the paddle; Space launches only from Ready; Escape pauses. A held launch key does not relaunch after a lost life or stage transition.
- Pointer/touch moves a target for the paddle by dragging within a dedicated lower control band. The simulation moves toward that target at the same speed limit; use a separate Launch button.
- Pause clears held movement/launch input and freezes ball, paddle, stage, lives, and scoring. Resume uses a deliberate countdown and does not launch an attached ball.
- Resize preserves the full field and physics scale with letterboxing. On phones, the control band sits outside the ball field so a finger does not obscure upcoming contacts.

## 5. Detailed 2D visual direction — Celestial Instrument

- Palette: midnight ink `#243B50`, pale chart `#EDE7D6`, aged gold `#BA985A`, dusty aqua `#72A1A4`, muted comet coral `#BC796B`.
- Render a flat star-chart field with fine boundary lines. Tiles are original rectangular celestial glyph panels; two-hit tiles show two explicit pips, then one after a hit.
- Paddle is a slim gold instrument bar with visible end caps. Ball is a small cream circle with an optional short planar dotted trail; the trail is decorative and has no collision area.
- Keep star-map dots sparse and faint outside tile/ball paths. No space tunnel, 3D planet, lens flare, or arcade neon bloom that hides the comet.
- Overview is a small astronomical instrument diagram. Setup uses Standard/Practice chart tabs. Play places lives as labelled marks and score/stage above the field. Results show a flat five-stage constellation progress strip.
- Tile removal uses a brief outline fade; necessary ball movement stays smooth. Reduced motion removes trails/twinkling, keeping ball, durability changes, and collision feedback legible.
- Optional sound: soft instrument taps for walls/paddle, distinct one-/two-hit tile notes, and a restrained stage chord. All important cues also have visible state updates.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Save mode, stage, lives, score, authoritative tile durability, paddle position, ball position/velocity or attached state, active time, and simulation remainder. Validate layouts, hit counts, speed, bounds, and phase. Restore paused without manufacturing a life or a launch.

## 7. Future asset handoff

Original celestial tile glyphs, durability pips, instrument paddle, comet/trail, star-chart frame, five validated stage layouts, progress strip, and optional collision/stage sounds. Game engine and artwork remain planned.

## 8. Acceptance when implemented

- Paddle angle, speed cap, swept wall/tile/paddle contact, corner resolution, and bottom loss follow these rules.
- Hits score once, durability decrements once per contact, and stage/life transitions require deliberate launches.
- Five-stage completion and third-life loss resolve in chronological order without extra bonuses.
- Touch/keyboard movement, different frame rates, pause, saves, and resizing preserve the same field and outcome.
