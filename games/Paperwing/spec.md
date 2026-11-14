# Paperwing

**Status:** Playable local release; Standard and Practice, saves, personal records, published rules, and Vihar Quick Play integration.

**Updated:** 15 November 2026
**Game ID:** `paperwing` · **Category:** Arcade · **Players:** One  
**Page:** `/paperwing` · **API base:** `/api/games/paperwing`  
**Style:** Airmail Atelier · **Inspiration:** One-button flying bird

**Rules release:** `2.0.0` — immediate starts, gradual speed progression, moving shutters, and wax-seal hazards.

## 1. Identity and experience

A folded paper swallow flies through openings in hanging airmail panels. Precise taps create an easy-to-learn rhythm. Original stationery artwork, a swallow silhouette, and suspended fabric gates give this game its own identity.

Target session: 20 seconds–3 minutes. One local player, one continuous run, one point per gate. No borrowed pipe artwork, currency, boosts, or continues.

## 2. Exact rules

- The world is a 480×720 logical portrait surface. The bird's centre stays at `x = 120`; its circular hitbox has radius 12 units. Gates travel horizontally left.
- Create the bird at `(120, 360)`, then apply one flap as a fresh flight starts. Opening Play starts automatically; choosing Start flight or Retry also begins immediately. There is no fresh-flight confirmation popup or second Ready screen. Current saved unfinished flights restore paused.
- Gravity is 900 units/second²; downward velocity is capped at 360. Each flap sets vertical velocity to `-280`, rather than adding an accumulating impulse.
- Flight bounds are `y = 40` and `y = 680`. Crossing either bound with the hitbox ends the run. There is no bounce, ground platform, or wrapping.
- Gates have upper and lower panels, width 64 units, leaving one opening. Ordinary gaps are 180 units in Standard and 220 in Practice. Starting speeds are 140 units/second and 110 respectively; use the time progression below.
- Collision occurs when the bird's circle positively overlaps a panel or crosses a bound. Edge tangency alone is safe. Collision uses logical shapes with swept checks, not feather or paper-decoration pixels.
- Award exactly one point when a gate's trailing edge passes the bird centre and that gate is still unscored. If collision occurs earlier or at the same simulation instant, end the run before awarding the gate point.
- Each new press/tap produces one flap. Held keys, browser repeat, pointer movement, and touches on UI controls do not create extra flaps.

## 3. Fair gates, presets, and results

- Show two seconds of clear flight before the first gate's leading edge reaches the bird. Gate leading edges remain 280 units apart in Standard and 300 in Practice.
- Sample gap centres in `[210, 510]` using the run's generator. The first gap centre is 360; each later centre differs from the previous by at most 90 units. Reject any layout violating these constraints.
- The first ten active seconds use the starting speed. For the next fifty seconds, increase speed continuously: Standard by 2 units/second per second to 240; Practice by 1.2 to 170. Hold that cap afterwards. Pause, countdown, menus and hidden tabs add no active time. Retry resets this clock. Integrate distance continuously across acceleration boundaries; never teleport gates or change their spacing.
- The first four gates are ordinary postal panels. Starting with gate ID 4, even IDs divisible by four are moving shutters, other even IDs are wax-seal gates, and odd IDs remain ordinary panels. The sequence is deterministic; new hazards are separated by ordinary gates.
- Shutters widen the mode's gap by 20 units. Their base centre follows the normal generation rules; its actual centre follows a six-second triangular cycle, offset by gate ID × 1.5 seconds. The maximum offset is ±24 units in Standard and ±16 in Practice. Speed and collision checks split at each turning point. Only active flight time moves the shutter.
- Wax-seal gates widen the gap by 100 units. A solid circular wax seal of radius 22 sits at the gate's horizontal centre, 56 units below the base gap centre when ID modulo 8 is 6, and 56 above otherwise. Fly through the larger opening on the seal's open side. Circle-to-circle swept collision ends the run at first contact; decorative seal lines add no hitboxes.
- The run ends at first collision. The score header keeps points and that mode's high score visible, including a new best reached during the current flight; an icon retries the same mode with a new seed. Active time and mode remain in the saved run.
- No bonus for near misses or crossing a decorative ring. A personal record is local to the device.

## 4. Controls and interruption

- Space, Up, or W flaps. After a flight ends, a fresh Space press invokes the existing Retry action immediately, keeping the mode and applying one initial flap. Held/repeated presses cannot restart or add flaps; release Space before the next flap. Space on other focused UI controls retains their normal behavior. Pointer/touch taps anywhere on the flight surface flap. The entire surface has an accessible Flap label; an icon provides Pause, and Escape also pauses.
- A new flight applies one initial flap immediately. Resuming uses the shared three-count countdown and consumes the resume gesture without flapping. Starting a new mode or retrying directly replaces the old unfinished flight without a popup.
- Pause freezes bird velocity, gate positions, score flags, and generator. Clear held input and pending taps. Return from a hidden tab remains paused.
- Fill the viewport below a compact score header. Scale both axes equally, keeping the complete vertical flight bounds visible. Wider displays extend the sky to the right and preview the same seeded future gates without advancing the simulation or its generator. Resizing preserves the bird, gate positions, scoring, collision geometry, and the two-second first approach.

## 5. Detailed 2D visual direction — Airmail Atelier

- Palette: letter paper `#F8F1E4`, ink navy `#2C445C`, postal coral `#B96054`, faded sky `#BCD4DE`, stamp gold `#B39357`.
- Draw an original folded swallow with angular wings, one small ink eye, and navy fold lines. Keep its circular collision centre apparent through a discreet chest mark.
- Gates are suspended flat fabric/postcard panels with diagonal postal edging. Their solid edges are clean and readable; decorative ropes remain outside the flight corridor and never collide.
- Use quiet sky paper with one sparse cloud motif and no perspective layers. Never copy a pixel bird mascot, green pipes, or another game's score typography.
- Overview is an open airmail card. Play starts immediately; mode selection is available by clicking Paperwing and offers two stamp-shaped choices with a single Start flight action. The full-width game shows only Paperwing, points, and high score as visible text, with accessible icons for Pause, Resume, Retry, and embedded Exit. The three-count resume countdown is the only temporary numeric overlay. No fresh-flight dialog or large modal appears.
- Shutters use muted blue slats, gold opening edges and small motion chevrons. Wax seals are original coral medallions with navy boundaries and a cream folded-envelope mark. Draw both using their actual collision geometry; decorative motion must not change collision timing.
- Flapping uses two planar wing poses and a limited angle change within the flat drawing. No camera shake, full-screen flash, or debris on collision. Reduced motion removes cloud drift and postmark drawing.
- On phones and wide screens, the sky fills all available space below the header. There is no instruction side panel, footer, visible sound/rules link, Flap button row, postcard frame, or wording printed inside the field. Rules remain available from the overview and dedicated rules page; sound preferences are available in mode selection and through the gameplay speaker icon.
- Optional audio: an original eight-bar instrumental waltz at 96 BPM, with soft stereo plucks, held chords, and bass. A paper flick marks each flap, a rising two-note bell marks a passed gate, and a short descending chime marks landing. The compact speaker icon controls music and effects together and retains the preference locally. Fresh visits enable music and effects; saved mute choices are preserved, and audio unlocks on the first gameplay gesture, following browser autoplay rules.
- Music plays only during active flight. Pause, countdown, lost focus, hidden tabs, menus, and host pause stop it. Resume continues its musical position; a fresh flight or replay resets the tune. Mute stops both music and effects immediately. Exit silences all sources; navigation disposes sources and the audio context. Audio rendering runs separately from the flight clock, with no music timers driving gameplay.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Save bird height/velocity, mode, gates with gap centres/positions/scored flags, generator, next gate ID/position, score, active time, and fixed-step remainder. The versioned session validates these invariants before loading. Validate separation, gap bounds, speed, and score flags. Restoring never changes an upcoming gate or resumes gravity automatically.

Rules `2.0.0` derive obstacle types, shutter phase and current speed from gate IDs, mode and active time. Save validation uses the integrated travel distance and current obstacle shapes. Existing rules `1.0.0` personal records migrate without losing their scores; their incompatible unfinished flights are replaced automatically by a fresh flight. Storage schema/key names remain unchanged, and other games' data is untouched.

## 7. Implemented artwork and sound

Original flat SVG folded-swallow poses, postal panels, moving slatted shutters, wax seals, mode stamps, cloud print and cover postcard are implemented in `src/components/paperwing/art.tsx`. The original waltz and flap, score, and landing sounds are synthesized locally with Web Audio in `audio.ts`. Offline rendering prepares one reusable stereo loop without blocking simulation; native audio playback loops it without application timers. Sound and music are on for a fresh visit, becoming audible after a player gesture. No borrowed sprite, licensed recording, or remote asset is required.

## 8. Release acceptance criteria

- Single presses flap exactly once; held/repeated input and Pause/Resume never produce unintended flaps.
- Generated gates stay reachable under the published gap, offset, and spacing rules.
- Collision takes precedence over a simultaneous gate score; each gate scores once.
- Resizing, frame rates, pause, and local save restoration preserve the logical flight world.
- Speed rises smoothly at ten seconds and reaches its cap at sixty, without position jumps. Pausing freezes speed progression and moving shutters.
- Shutter and seal collisions use their true moving/round shapes. Wide-screen previews match the upcoming generated obstacles without advancing the saved generator.
- Fresh navigation, Start flight, and Retry require no confirmation or second Start action. Current saved flights restore paused; previous high scores survive the rules upgrade.
- Music and effects become audible after a browser gesture when audio is enabled. Mute/pause/host visibility/navigation stop the appropriate sources; retries never stack loops. Both modes retain their audio preference, Space controls, and viewport layout. Browsers without audio support continue gameplay quietly.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.

## Local implementation

The pure engine and save validation live in `src/games/paperwing/`; interface, original SVG artwork, optional sound, and viewport styles live in `src/components/paperwing/`. Dedicated overview, play, and paged rules routes use `/paperwing`, `/paperwing/play`, and `/paperwing/how-to-play`. `/api/games/paperwing/info` advertises `availableModes: ["solo"]`, `soloPresets: ["standard", "practice"]`, `rulesVersion: "2.0.0"`, and embed protocol v1. `/rules` publishes the same rules used by the paged rules screen. All records are personal/local, and the game continues without storage or account services. A frame delay beyond the bounded catch-up budget pauses the flight rather than skipping unseen hazards.
