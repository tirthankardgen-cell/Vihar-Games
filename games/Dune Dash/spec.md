# Dune Dash

**Status:** Playable locally; Endless/Practice, original 2D artwork, local saves/records, published rules and Vihar embedding.
**Updated:** 15 November 2026
**Game ID:** `dune-dash` · **Category:** Arcade · **Players:** One  
**Page:** `/dune-dash` · **API base:** `/api/games/dune-dash`  
**Style:** Desert Field Notes · **Inspiration:** Browser dinosaur-style endless running

## 1. Identity and experience

A small desert fox runs along a printed horizon, jumping sandstone and ducking beneath birds. The familiar two-action runner gains an original character, desert setting, and natural-history print style.

Target session: 30 seconds–4 minutes. One collision ends a run. No weapons, double jumps, collectable currency, revives, or online racing.

## 2. Exact rules

- Simulate a 960×360 logical world independent of screen size. Ground is at `y = 300`; the fox's left edge is fixed at `x = 120` while obstacles move left.
- Standing collision rectangle: 34×46 units, bottom on the ground. Ducking rectangle: 46×24 units. Artwork must indicate both shapes and fit around these documented hitboxes.
- A grounded jump sets vertical velocity to `-620` units/second; gravity is `1800` units/second². Landing clamps feet to ground and velocity to zero. There is one jump per press and no mid-air jump.
- Duck is available only while grounded. A jump request while ducking first stands and jumps; duck input during a jump does nothing. Releasing duck stands immediately, using the standing collision rectangle.
- World speed starts at 240 units/second and increases by eight units/second for every completed ten seconds of active running, capped at 420. Practice fixes speed at 180 and has its own records.
- Sandstones have width 28–52 and height 28–54 units with bases on the ground. Bird hazards have a 50×24 rectangle with bottom at `y = 264`; standing overlaps their path but ducking clears it.
- Collision occurs on a positive-area overlap of logical rectangles; touching edges alone is safe. Use swept collision between steps so an obstacle cannot tunnel through the fox.
- Any collision ends simulation immediately. Distance accrues only while running. Score is `floor(total distance / 10)`; there are no item or trick bonuses.

## 3. Fair obstacle sequence and ending

- Begin with three seconds of clear ground. The first two hazards are individual stones; birds become eligible after 15 active seconds.
- Generate hazards from a stored seed. Adjacent hazards have a minimum trailing-edge to leading-edge gap equal to current speed × 1.1 seconds. Do not place overlapping clusters or unavoidable alternating patterns.
- At creation, the next hazard starts beyond the right edge and offers at least 1.8 seconds of visible approach at the maximum speed. The playable camera must expose the full logical horizon on all devices.
- No finish line in Endless mode. Practice also ends on collision. Results show distance, score, active time, mode, and local best; retry preserves mode and starts a fresh seed.
- Restart and return to collection use clear separate controls. Do not bind a death-frame tap to an immediate hidden restart.

## 4. Controls and interruption

- Space, Up, or W jumps; Down or S ducks while held. Escape pauses. Keyboard repeat cannot auto-jump after landing; release is required before another jump.
- Pointer/touch: a large Jump control, a separate press-and-hold Duck control, and Pause. A play-surface tap may jump only when no control is hit.
- Pause freezes speed progression, distance, jump velocity, obstacles, and generator. Clear held duck/jump state; retain the actual pose until the explicit resume countdown ends, then return to standing if duck is no longer held.
- The resume transition must run collision checks normally; pausing cannot grant invulnerability or skip a hazard.

## 5. Detailed 2D visual direction — Desert Field Notes

- Palette: sand paper `#F2E5CB`, charcoal brown `#463D32`, fox rust `#B56843`, faded blue `#829BA3`, dry grass `#B8AB77`.
- Original fox silhouette: long ears, compact muzzle, rust tail with a cream tip. It remains clearly different from a dinosaur or borrowed runner sprite.
- Sandstone obstacles use two or three flat hand-cut silhouettes. Birds are thin ink swifts. Empty decorative dunes and grasses stay below/behind the ground line and never resemble hazards.
- Use one flat printed skyline with restrained grain; avoid 3D depth, moving perspective, night flashes, or busy parallax layers. The full approach distance remains readable on a phone.
- Overview resembles a small field-guide plate. Setup shows a labelled fox/jump/duck diagram. During play, place score and pause above the horizon; results resemble a dated travel stamp with distance as live text.
- A small running cycle, one clear airborne pose, and a low duck pose communicate state. Necessary movement stays smooth; reduced motion removes drifting clouds and decorative stride effects.
- Optional sound: dry foot taps, a light jump note, and one subdued collision thud. Avoid repetitive compulsory sound.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Save mode, fox pose/height/velocity, active time, distance, speed stage, obstacles and positions, generator state, and next spawn progress. Validate speed bounds, obstacle templates, nonnegative distance/time, and grounded pose. Restore paused with no held controls.

## 7. Future asset handoff

Implemented as original native SVG: fox run/jump/duck poses, three sandstone silhouettes, ink swift, field-note border, static skyline, and labelled jump/duck diagrams. Results use a dated field-note stamp with live distance and counters. Optional foot taps, jump note, collision thud and an original pentatonic desert music loop are synthesized locally. Music and effects have independent controls, start muted, and stop on pause/Exit. The pure runner is in `src/games/dune-dash/`; its interface is in `src/components/dune-dash/`.

## 8. Acceptance when implemented

- Jump and duck clearance match documented hitboxes; no double jump or held-key auto-jump is possible.
- Generated hazards meet opening, gap, visibility, and speed rules on phone and desktop.
- Fast movement cannot skip collision; score derives from distance once.
- Pause/resume and save restoration freeze motion and preserve the same obstacle sequence.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.

## Implemented keyboard addition

Space deliberately starts the Ready screen and replays a completed run with a fresh seed in the same mode. During running it jumps. Holding Space never repeats a jump or retries on a death frame; release is required for another action. Focused navigation and other buttons retain their normal Space activation. The result also has separate Try again, Change mode and Return to collection controls.
