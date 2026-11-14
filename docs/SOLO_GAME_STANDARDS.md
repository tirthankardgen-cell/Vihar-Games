# Solo puzzle and arcade specifications

**Updated:** 15 November 2026\
**Scope:** The twelve solo additions in the [complete catalog](../GAME_CATALOG.md).  
**Current delivery:** Paperwing (Standard/Practice), Dune Dash (Endless/Practice), Monsoon Blocks (Standard/Practice), and Silk Trail (Calm/Flow/Swift) are playable with local saves/records, original 2D artwork, optional sound/music, published rules, and Vihar embedding. The other eight additions have `availability: "planned"`, `plannedModes: ["solo"]`, `availableModes: []`, and `rulesVersion: null`. All twelve remain `presentation: "2d"`.

Each new game has a lowercase `spec.md` in its own `games/` folder. Its rules and visual direction are authoritative; this document supplies shared requirements for current and later implementations. Existing games retain their `GAME_SPEC.md` files.

## 1. Catalog and page contract

- Register explicit IDs in `src/lib/catalog/registry.ts`; the homepage, overview, play/rules placeholders, launch redirect, info API, and overview sitemap entries use that allowlist.
- Keep the eight unimplemented entries labelled **Coming soon**. Paperwing, Dune Dash, Monsoon Blocks, and Silk Trail have published play/rules screens and versioned rules APIs. For the other eight additions, `/play` and `/how-to-play` remain placeholders; `/rules` returns `404 RULES_NOT_AVAILABLE` until actual rules are published. Written design rules in Git do not claim a shipped engine or published rules API.
- All twelve games are for one local player. Pass-and-play and online player limits are `null`. There are no rooms, bots, competitive leaderboards, accounts, or gameplay API requests in these designs.
- Future overview, setup, rules, play, pause, and results screens carry each game's own palette, motif, wording, and illustrations. Shared navigation and status placement remain familiar.
- Catalog IDs are stable. Use `/<id>`, `/<id>/play`, `/<id>/how-to-play`, and `/api/games/<id>` on `games.vihar.online`.

## 2. Original premium presentation

- Use original flat 2D illustration, careful spacing, crisp live typography, a restrained palette, and quiet borders. Quality comes from coherent artwork and legible interaction.
- Each specification defines its own world, colours, shapes, texture, animation, and asset list. Carry that identity through every screen; avoid applying one arcade skin to the whole collection.
- Familiar rules can inspire play. Create original characters, names, artwork, layouts, sounds, and interface copy. Dune Dash uses a desert fox and Paperwing a folded swallow; their designs do not reuse Chrome's dinosaur/sprites or another bird game's pipes/mascot.
- No 3D, semi-3D, perspective transforms, raised boards, beveled pieces, or spatial card flips. Paper grain, water, rain, and stars are flat decorative graphics outside essential play information.
- Use the existing local Hind font for body text and Yatra One for display where appropriate. Any future font needs a bundled licence. Keep numbers, clues, scores, and labels selectable/readable as live text.
- Decorative motion never changes collisions, moves, clues, randomness, timers, or scoring. Reduced motion removes decoration while retaining necessary gameplay feedback and equivalent rules.
- Sound is optional. Shipped games default to sound and music enabled after interaction, following the requested release preference; saved mute choices persist. Give each game a distinct small sound palette, with visible equivalents for every meaningful cue. Artwork and sound for the unimplemented games remain later tasks; shipped solo games supply native SVG art and local synthesized audio.

## 3. Input and accessibility

- Support keyboard, pointer, and touch with visible instructions. Setup/actions have targets of at least 44 CSS pixels. Small board cells need a usable zoom or equivalent navigation rather than unreadable controls.
- Use real focusable controls, visible focus rings, labelled actions, and adequate text contrast. Never encode colour-dependent rules using colour alone; add shapes, letters, patterns, or numbered labels.
- Puzzle boards expose coordinate, value, selection, and state information. Announce important changes and results without narrating every animation frame.
- Arcade games provide instructions, settings, pause, score, and result text to assistive technology; optional slower practice improves access. Their reflex gameplay still depends on visual timing and must be described honestly.
- Preserve the logical board, active selection, and hitboxes across resizing. Narrow screens may pan or zoom puzzle boards; resizing cannot reset a session or alter a layout seed.

## 4. Time, pause, and interruption

- Arcade simulation uses a fixed step and bounded catch-up. Speeds and collision outcomes cannot depend on refresh rate or decorative animation. A slow frame must not fast-forward through unseen obstacles.
- Show a Ready screen before the first moving frame. Starting/resuming requires deliberate input, with a three-count resume countdown for reflex games. Countdown time never scores or advances simulation.
- Pause on explicit Pause, hidden tabs, lost window focus, navigation, or the Vihar host's pause signal. Freeze simulation, active time, queued input, and sound; clear held keys and pointer capture.
- Resume only through an explicit action after visibility/focus returns. Touching Resume must not also flap, jump, move, or launch. Do not catch up elapsed wall-clock time.
- Puzzle timers record active play only and are optional in the interface. The engine can resolve a move immediately; decorative feedback cannot lock a valid next move.
- A restart confirms before discarding active progress, then uses the chosen preset and resets that run's counters. Result screens cannot accept gameplay input.

## 5. Local state and Quick Play integration

- At implementation time, place pure engines in `src/games/<id>/` and interfaces in `src/components/<id>/`; load only the selected game's code.
- Namespace local sessions, preferences, and records as `vihar-games:<id>:session:v1`, `settings:v1`, and `records:v1`. Store a schema version, preset, level/seed, authoritative board or simulation snapshot, counters, active time, and assistance flags.
- Validate saves against game invariants and ranges. Invalid, obsolete, or unavailable storage shows a recoverable message and still permits a fresh game. Saves do not mix games, levels, or presets.
- Restore a valid unfinished save in a paused state. Arcade snapshots include random-generator state and collision-relevant positions/velocities so resuming does not reroll the run.
- Use Vihar's existing embed, Exit, pause, and activity SDK conventions when implementing. Report activity only while an actual visible local game is active, never on catalog/setup/placeholder pages.
- Exit ends listeners, input handling, timers, animation frames, audio, and workers. Keep local progress where the specification allows; never leave simulation running behind another game.

## 6. Records, assistance, and content

- Records stay on the device and are compared within the same mode, preset, rules version, and level where appropriate. They are personal progress, not verified competitive results.
- Puzzle undo restores logical state but does not decrease cumulative moves, pushes, attempts, hints, or active time. Restart resets run counters. Hints/solution previews mark that run assisted; assisted and unassisted results are displayed separately.
- Puzzle completion follows the exact victory condition, not an animation, picture reveal, or an optimal-move estimate. Do not invent lives, time limits, or penalties absent from the specification.
- First puzzle releases use authored levels whose validity and reachability are verified before shipping. Nonograms, light routes, and loops additionally require a unique solution under the published rules. Authored levels need IDs, difficulty, initial/target state, and a validation witness or solution.
- Arcade seeds use reproducible bounded generators and guaranteed fair opening segments. Record only the counters each game specifies.

## 7. Scope and later acceptance

The original catalog phase added names, descriptions, categories, placeholder routes, rules, and visual handoffs. Paperwing, Dune Dash, Monsoon Blocks, and Silk Trail are now implemented locally; the other eight additions remain in that planning phase. Shared dependencies and SDK conventions are retained.

When implementation is requested, verify each game's acceptance criteria as well as input equivalence, pause/resume, save validation, same-origin isolation, responsive legibility, and reduced motion. Gameplay checks in each `spec.md` are future requirements, not evidence that the game is currently playable.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.

## Monsoon Blocks local release

Monsoon Blocks implements the Rain Window specification with local Standard/Practice, validated paused saves, separate preset records, printed SVG shape patterns, optional original effects/music, published rules, and the existing Vihar embed/activity conventions. Its overview, setup, Ready, countdown, play, pause, results, paged rules, and confirmation dialog fit the viewport. The remaining unimplemented solo additions retain their planned status.

## Silk Trail local release

Silk Trail implements the Silk Garden specification with local Calm/Flow/Swift, a deterministic 20 × 20 engine, validated paused saves, separate preset records, stitched SVG snake and garden artwork, original enabled-by-default effects/music, published rules, and Vihar embed/activity conventions. Its overview, setup, Ready, countdown, play, pause, results, paged rules, and restart confirmation fit the viewport. The remaining eight solo additions retain their planned status.
