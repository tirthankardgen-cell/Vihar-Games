# Paperwing

**Status:** Playable local release; Standard and Practice, saves, personal records, published rules, and Vihar Quick Play integration.

**Updated:** 14 November 2026  
**Game ID:** `paperwing` · **Category:** Arcade · **Players:** One  
**Page:** `/paperwing` · **API base:** `/api/games/paperwing`  
**Style:** Airmail Atelier · **Inspiration:** One-button flying bird

## 1. Identity and experience

A folded paper swallow flies through openings in hanging airmail panels. Precise taps create an easy-to-learn rhythm. Original stationery artwork, a swallow silhouette, and suspended fabric gates give this game its own identity.

Target session: 20 seconds–3 minutes. One local player, one continuous run, one point per gate. No borrowed pipe artwork, currency, boosts, or continues.

## 2. Exact rules

- The world is a 480×720 logical portrait surface. The bird's centre stays at `x = 120`; its circular hitbox has radius 12 units. Gates travel horizontally left.
- Start the bird at `(120, 360)`, vertical velocity zero. The first accepted Start action begins flight and applies one flap; Ready has no gravity or score.
- Gravity is 900 units/second²; downward velocity is capped at 360. Each flap sets vertical velocity to `-280`, rather than adding an accumulating impulse.
- Flight bounds are `y = 40` and `y = 680`. Crossing either bound with the hitbox ends the run. There is no bounce, ground platform, or wrapping.
- Each gate consists of upper and lower rectangular panels, width 64 units, leaving one vertical opening. Standard gap height is 180; practice gap is 220. Gate speed is fixed at 140 units/second in Standard and 110 in Practice.
- Collision occurs when the bird's circle positively overlaps a panel or crosses a bound. Edge tangency alone is safe. Collision uses logical shapes with swept checks, not feather or paper-decoration pixels.
- Award exactly one point when a gate's trailing edge passes the bird centre and that gate is still unscored. If collision occurs earlier or at the same simulation instant, end the run before awarding the gate point.
- Each new press/tap produces one flap. Held keys, browser repeat, pointer movement, and touches on UI controls do not create extra flaps.

## 3. Fair gates, presets, and results

- Show two seconds of clear flight before the first gate's leading edge reaches the bird. Gate leading edges remain 280 units apart in Standard and 300 in Practice.
- Sample gap centres in `[210, 510]` using the run's generator. The first gap centre is 360; each later centre differs from the previous by at most 90 units. Reject any layout violating these constraints.
- Standard and Practice remain at their preset speeds/gaps throughout a run. There is no hidden difficulty ramp or score-dependent shrinkage.
- The run ends at first collision. The score header keeps points and that mode's high score visible, including a new best reached during the current flight; an icon retries the same mode with a new seed. Active time and mode remain in the saved run.
- No bonus for near misses or crossing a decorative ring. A personal record is local to the device.

## 4. Controls and interruption

- Space, Up, or W flaps. Pointer/touch taps anywhere on the flight surface flap. The entire surface has an accessible Flap label; an icon provides Pause, and Escape also pauses.
- Start consumes one intentional press as the initial flap. Resuming uses the shared three-count countdown and consumes the resume gesture without flapping.
- Pause freezes bird velocity, gate positions, score flags, and generator. Clear held input and pending taps. Return from a hidden tab remains paused.
- Fill the viewport below a compact score header. Scale both axes equally, keeping the complete vertical flight bounds visible. Wider displays extend the sky to the right and preview the same seeded future gates without advancing the simulation or its generator. Resizing preserves the bird, gate positions, scoring, collision geometry, and the two-second first approach.

## 5. Detailed 2D visual direction — Airmail Atelier

- Palette: letter paper `#F8F1E4`, ink navy `#2C445C`, postal coral `#B96054`, faded sky `#BCD4DE`, stamp gold `#B39357`.
- Draw an original folded swallow with angular wings, one small ink eye, and navy fold lines. Keep its circular collision centre apparent through a discreet chest mark.
- Gates are suspended flat fabric/postcard panels with diagonal postal edging. Their solid edges are clean and readable; decorative ropes remain outside the flight corridor and never collide.
- Use quiet sky paper with one sparse cloud motif and no perspective layers. Never copy a pixel bird mascot, green pipes, or another game's score typography.
- Overview is an open airmail card. Setup offers two stamp-shaped mode choices. The full-width play screen shows only Paperwing, points, and high score as visible text, with small accessible icons for Pause, Start, Resume, Retry, and embedded Exit as applicable. Clicking the game name returns to mode selection. The three-count resume countdown is the only temporary numeric overlay.
- Flapping uses two planar wing poses and a limited angle change within the flat drawing. No camera shake, full-screen flash, or debris on collision. Reduced motion removes cloud drift and postmark drawing.
- On phones and wide screens, the sky fills all available space below the header. There is no instruction side panel, footer, visible sound/rules link, Flap button row, postcard frame, or wording printed inside the field. Rules remain available from the overview and dedicated rules page; sound preferences remain in mode selection.
- Optional sound: one soft paper flick per flap and a muted bell per passed gate, with visual score feedback.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Save bird height/velocity, mode, gates with gap centres/positions/scored flags, generator, next gate ID/position, score, active time, and fixed-step remainder. The versioned session validates these invariants before loading. Validate separation, gap bounds, speed, and score flags. Restoring never changes an upcoming gate or resumes gravity automatically.

## 7. Implemented artwork and sound

Original flat SVG folded-swallow poses, postal panel edges, two mode stamps, cloud print, cover postcard, and result postmark are implemented in `src/components/paperwing/art.tsx`. Optional paper-flick and gate-bell sounds are synthesized locally with Web Audio in `audio.ts`. Sound is off on a fresh visit. No borrowed sprite or remote asset is required.

## 8. Release acceptance criteria

- Single presses flap exactly once; held/repeated input and Pause/Resume never produce unintended flaps.
- Generated gates stay reachable under the published gap, offset, and spacing rules.
- Collision takes precedence over a simultaneous gate score; each gate scores once.
- Resizing, frame rates, pause, and local save restoration preserve the logical flight world.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.

## Local implementation

The pure engine and save validation live in `src/games/paperwing/`; interface, original SVG artwork, optional sound, and viewport styles live in `src/components/paperwing/`. Dedicated overview, play, and paged rules routes use `/paperwing`, `/paperwing/play`, and `/paperwing/how-to-play`. `/api/games/paperwing/info` advertises `availableModes: ["solo"]`, `soloPresets: ["standard", "practice"]`, `rulesVersion: "1.0.0"`, and embed protocol v1. `/rules` publishes the same rules used by the paged rules screen. All records are personal/local, and the game continues without storage or account services. A frame delay beyond the bounded catch-up budget pauses the flight rather than skipping unseen hazards.
