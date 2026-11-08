**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/minesweeper](https://games.vihar.online/minesweeper)  
**Open endpoint:** `GET /api/games/minesweeper` → `/minesweeper`  
**API base:** `/api/games/minesweeper`  
**Project:** Vihar Games; one shared Vercel deployment.

# Minesweeper — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One.  
**Required mode:** Local single-player puzzle.  
**Match format:** Classic mine-clearing puzzle with a guaranteed safe first reveal.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Retro Desktop; a tidy flat light-grey grid on a charcoal background, familiar coloured numbers, teal flags, and small classic-computer pixel accents.

## 1. Game and objective

Reveal all cells that do not contain mines, using neighboring mine counts to reason about danger. Revealing a mine loses the run. Flags are optional guesses; correctly flagging every mine is not required to win.

## 2. Exact rules

- Offer three presets: Beginner `9 × 9, 10 mines`; Intermediate `16 × 16, 40 mines`; Expert `30 columns × 16 rows, 99 mines`.
- Delay mine placement until the first reveal. Exclude that cell and all valid neighboring cells from mine placement, guaranteeing an empty first-reveal neighborhood. Placing a flag does not generate the board.
- Place the exact preset mine count uniformly among eligible cells. Save the chosen layout; it must not change after refresh, a mistaken flag, or later reveals.
- Each safe numbered cell reports the mines in its up to eight neighboring cells, including diagonals. Edge and corner cells have fewer neighbors.
- Revealing a zero-mine cell automatically reveals its connected zero region and the bordering numbered safe cells. Do not reveal flagged cells through this expansion.
- Flag mode toggles a flag on a covered cell. A flagged cell cannot be directly revealed until unflagged. Already revealed cells cannot be flagged.
- Limit placed flags to the preset mine count. The remaining-mine counter is `mine count minus placed flags`; it is not a proof that those flags are correct.
- Chording a revealed numbered cell is allowed when the number of its adjacent flags equals its number. Reveal every adjacent covered, unflagged cell as one action.
- If those flags are misplaced, a chord may reveal a mine and lose. Resolve any mine hit before evaluating victory.
- Win only when every non-mine cell is revealed. Hidden but correctly flagged mines may remain. Revealing any mine loses, whether by direct reveal or chord.
- There are no lives, mandatory hints, or automated solutions in the first release. Pause suspends input and the active-play timer; resume continues the same layout.
- Restart Same Board clears progress and flags, reuses the exact mine layout, restores the original safe first reveal and its expansion, resets the timer, and marks a replay attempt. It never relocates mines to protect a different opening cell. New Board discards the old layout and again delays placement until the first reveal.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Minesweeper, or visit `/minesweeper` directly. Choose Play or How to Play.
2. Select a difficulty and start. Request confirmation before replacing an unfinished local run.
3. Make a first reveal to generate the safe-start layout and begin active-play timing.
4. Reveal covered cells, toggle flags, or chord eligible numbered cells. On touch devices use an explicit Reveal/Flag input mode; also support mouse and keyboard actions.
5. Pause, resume, or continue after a refresh when local saving is available.
6. On winning, report preset and active time; on losing, identify that a mine was revealed. Stop further gameplay input after either result.
7. Choose New Board, Restart Same Board, or a different preset. Keep local best times for first-attempt wins separate from replay attempts.

## 4. Sessions and connectivity

- This release is single-player: no room codes, multiplayer backend, computer opponent, or pass-and-play turns are needed.
- Mine placement, flood fill, chording, result evaluation, timer, and records run entirely in the browser. No API keys or account are required.
- Save preset, first-reveal status and original first-reveal cell, layout, revealed cells, flags, active time, pause state, result, replay status, and save-format version locally when possible.
- Before the first reveal, resume the same ungenerated run. After generation, resume the same fixed layout rather than generating another one.
- Count active time only while a started run is resumed and the document is visible. Backgrounding pauses time and input until the player resumes.
- Storage failure must not stop the current run. Loaded games continue without gameplay internet requests; cross-device saves and global competitive records are outside the first release.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML grid, flat flags/mines, and text counts. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Use a pure TypeScript engine for mine placement, neighborhood counts, reveal expansion, flags, chording, and terminal states. Random placement is local and never requires an external service.
- Use an iterative queue for flood fill to avoid recursive stack overflow. Treat chord reveals atomically so a mine hit cannot coexist with a win result.
- Validate imported local saves against grid dimensions, mine count, indices, and save version. Fall back to a new run when data is invalid, with a clear explanation.
- Support explicit touch actions and keyboard reveal/flag commands; avoid requiring a right mouse button for essential gameplay.
- Mount the game overview at `/minesweeper`, mode selection and play at `/minesweeper/play`, and rules at `/minesweeper/how-to-play`. Selecting the game in the shared catalog opens `/minesweeper`.
- `GET /api/games/minesweeper` redirects to the game overview. `GET /api/games/minesweeper/info` returns catalog metadata and supported modes; `GET /api/games/minesweeper/rules` returns the versioned rules. These public requests do not start a match.
- This solo game's launch, metadata, and rules endpoints live in the shared API layer. Gameplay stays local and has no room endpoints, guest identity requirement, or server-authoritative puzzle session. Unsupported room requests return the documented mode-unavailable error.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:minesweeper:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/minesweeper`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- Every preset is playable without registration on phone, tablet, and desktop.
- Verify exact mine counts, safe first-reveal neighborhoods at edges and corners, adjacent counts, flood-fill boundaries, and flagged-cell protection.
- Verify direct mine loss, incorrect-flag chord loss, correct chording, flag limit, and victory without flagging every mine.
- Refresh preserves the mine layout. Same Board preserves it and restores the original safe opening; New Board generates a new safe layout on the next first reveal.
- Background time is excluded, replay attempts do not replace first-attempt best times, and unavailable storage does not block play.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/minesweeper`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Retro Desktop presentation keeps all three preset grids, covered/revealed states, numbered clues, flags, touch input modes, and terminal results readable; large boards remain navigable without shrinking cells into unusable targets.

## 7. Detailed 2D visual direction — Retro Desktop

### 7.1. Mood and palette

The game should feel like a tidy classic desktop puzzle with modern readability. Use recognisable Minesweeper symbols and small pixel-style accents around a clean flat grid.

- Use a charcoal surrounding page, light-grey covered cells, a slightly different pale tone for revealed cells, and teal flags.
- Keep familiar coloured numbered clues with clear numerals and sufficient contrast against revealed cells.
- Use restrained pixel-style lettering for the title or counter accents, while keeping cell numbers and controls crisp and readable.
- Cells and controls are flat bordered shapes. The retro direction does not use bevels, raised buttons, perspective, or simulated 3D tiles.

### 7.2. Grid, flags, mines, and input modes

- Render the exact Beginner 9 × 9, Intermediate 16 × 16, and Expert 30-column × 16-row presets.
- Covered and revealed cells differ clearly in fill and border treatment. Revealed zero cells are quiet and empty; numbered cells retain prominent clues.
- Flags use a consistent teal symbol that remains legible at normal cell size. A mine uses a distinct dark symbol, with a restrained red outline for the mine that caused a loss.
- Expose the remaining-mine counter and active timer as readable text. Make clear that the counter reflects placed flags rather than verified mine locations.
- On touch devices, provide prominent labelled Reveal and Flag modes, with a persistent active-mode indicator.
- Show keyboard focus and any chord target clearly. Visual previews cannot certify covered cells as safe or flags as correct.

### 7.3. Pages, typography, and layout

- Carry the charcoal, grey, teal, and small pixel accents through the overview, preset selection, rules, grid, pause, and result screens.
- Place preset, counter, and time above the grid, with Reveal/Flag and main actions nearby.
- Keep New Board and Restart Same Board distinctly labelled. Preserve the required unfinished-run replacement confirmation.
- Beginner can fit a phone-width grid. For larger presets, offer a navigable 2D board viewport with pan/scroll and optional zoom while keeping controls accessible.
- Preserve useful cell sizes and legible numbers on Expert; a narrow screen must not compress all 30 columns into tiny targets.
- On desktop, give the grid room to expand while keeping status and input mode visible during navigation.

### 7.4. Puzzle states and feedback

- Minesweeper remains a solo puzzle. Show the selected preset and local run/replay status.
- Before the first reveal, show the untouched covered grid and ready state. After generation, preserve the accepted layout and ongoing active timer.
- Flags, direct reveals, region expansion, and chords use the same consistent cell treatments.
- Pause presents a simple desktop-style panel and suspends the documented input/timer state.
- On a mine hit, identify the loss clearly and retain the board. On victory, show the preset and active time without requiring every mine to be flagged.
- Keep replay records distinguishable from first-attempt wins, and stop further gameplay input after either result.

### 7.5. Animation and feedback

- Reveal connected empty areas in a quick, gentle wave based on the already accepted safe region. The visual sequence cannot reveal protected flagged cells.
- Flags appear or disappear with a brief fade; counters update from the accepted action.
- A mine hit uses a static red outline and concise result text. Keep the board stable rather than shaking or replacing it with a large explosion.
- Reveal, chord, and terminal-state evaluation remain atomic and independent of decorative animation. A mine hit retains precedence over victory.
- Respect reduced-motion preferences by displaying the full accepted reveal region, flags, and result immediately.
- Keep scrolling, mode controls, pause, and keyboard navigation responsive during larger-board reveals.

### 7.6. Planned artwork and accessibility handoff

Prepare flat cell states, flag/mine symbols, numeral styles, counter panels, focus outlines, and a small pixel-title treatment. Use an HTML grid and accessible live text for counts and status. Provide mouse, explicit touch-mode, and keyboard actions with visible focus; the retro theme must not make a right mouse button necessary. Detailed background artwork is unnecessary.
