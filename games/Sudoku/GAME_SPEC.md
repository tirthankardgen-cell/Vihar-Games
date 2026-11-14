**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/sudoku](https://games.vihar.online/sudoku)  
**Open endpoint:** `GET /api/games/sudoku` → `/sudoku`  
**API base:** `/api/games/sudoku`  
**Project:** Vihar Games; one shared Vercel deployment.

# Sudoku — Game specification

**Status:** Playable local release: Easy/Medium/Hard, 18 validated puzzles, Puzzle Journal screens, notes, undo/redo, hints/checks, pause, local saves/records, and Vihar embedding.
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One.  
**Required mode:** Local single-player puzzle.  
**Match format:** Standard 9 × 9 Sudoku with Easy, Medium, and Hard difficulty.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Puzzle Journal; an off-white puzzle page with a neatly ruled grid, crisp numerals, blue player entries, small pencil notes, and generous blank margins.

## 1. Game and objective

Complete a partially filled grid with digits 1–9 so that every row, column, and 3 × 3 box contains each digit exactly once. The puzzle starts with fixed clues and must have exactly one solution.

## 2. Exact rules

- Use 81 cells arranged in nine rows, nine columns, and nine 3 × 3 boxes. The fixed starting clues cannot be changed, erased, or overwritten by notes.
- Each empty cell accepts a digit from 1 to 9, or removable pencil notes containing possible digits. Notes are not final answers and never count toward completion.
- No digit may repeat within a row, column, or box in the completed puzzle. A puzzle finishes only when all cells are filled and every rule is satisfied.
- Allow players to enter a conflicting digit, but identify the row, column, or box rule it violates. A temporarily valid digit is not necessarily the correct solution; do not silently claim it is correct.
- Editing and erasing a player-entered cell is allowed. Undo and redo restore both entries and notes; making a new edit after undo discards the abandoned redo branch.
- A Check action reports entries inconsistent with the unique solution and marks the run as checked. It does not automatically replace all answers.
- A Hint fills one unresolved cell with its correct digit and increments a hint count. If that cell already contains a wrong digit, replace it with the correct digit. Repeated hints cannot target a completed correct cell.
- Pause stops the active-play timer and suspends puzzle input. Resume continues the same run. Timer measurement is informational, not a strict time limit.
- Winning requires a fully valid completed grid. Record difficulty, active time, hints, and checks used; assisted and unassisted completions remain distinguishable in local records.
- Every shipped or generated puzzle must have exactly one solution. Difficulty is based on required solving techniques rather than clue count alone.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Sudoku, or visit `/sudoku` directly. Choose Play or How to Play.
2. Select Easy, Medium, or Hard, then start a new puzzle. Starting a new puzzle during an unfinished run asks before replacing that local run.
3. Choose an editable cell and enter a digit, pencil note, or erase action. Switch between notes and final entries as needed.
4. Use undo, redo, pause, check, or hint when desired. Preserve the puzzle identity and record any assistance.
5. Resume after a refresh from the same browser when local storage is available. If saving is unavailable, continue the current session normally.
6. Finish by completing the grid correctly. Report completion time and assistance counts; offer another puzzle at the same difficulty, a different difficulty, or a restart of the same puzzle.
7. Restarting the same puzzle resets entries, notes, undo history, elapsed time, and assistance counters, and records it as a restarted attempt rather than an untouched first attempt.

## 4. Sessions and connectivity

- There are no online rooms, friend codes, computer opponents, or turn handovers in this first release. This is a solo logic puzzle.
- Play, checking, hints, and validation happen in the browser with no backend, external AI service, or authentication requirement.
- Ship a curated validated puzzle bank as a reliable baseline. Optional runtime generation uses bounded computation and falls back to the bank if it cannot produce a valid puzzle promptly.
- Save puzzle ID, clues, solution, difficulty, entries, notes, undo/redo history, active time, assistance counts, restart status, and save-format version locally when possible.
- Count elapsed time only while the puzzle is resumed and the document is visible. Backgrounding pauses time and input; on returning, the player resumes explicitly.
- Loaded puzzles keep working without gameplay internet requests. The first visit still needs the application resources to load; cross-device cloud sync is outside the first release.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML grid, text digits, and notes. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Keep puzzle validation, solution checking, notes, undo history, and completion in pure TypeScript modules. Use a tested solver to validate puzzle-bank uniqueness during preparation.
- Run generation and expensive solver work in a browser worker; bound attempts and cancel abandoned requests when switching puzzles.
- Package a valid solution for each bank puzzle, or compute and cache it locally. Browser users can inspect local data, so local records are personal records, not a tamper-proof global leaderboard.
- Handle touch, mouse, and keyboard digit entry, note entry, deletion, and navigation. Prevent fixed-clue editing consistently across every input method.
- Mount the game overview at `/sudoku`, mode selection and play at `/sudoku/play`, and rules at `/sudoku/how-to-play`. Selecting the game in the shared catalog opens `/sudoku`.
- `GET /api/games/sudoku` redirects to the game overview. `GET /api/games/sudoku/info` returns catalog metadata and supported modes; `GET /api/games/sudoku/rules` returns the versioned rules. These public requests do not start a match.
- This solo game's launch, metadata, and rules endpoints live in the shared API layer. Gameplay stays local and has no room endpoints, guest identity requirement, or server-authoritative puzzle session. Unsupported room requests return the documented mode-unavailable error.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:sudoku:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/sudoku`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- A visitor can start, pause, resume, and complete puzzles at all three difficulties without signing in.
- Every bank puzzle has exactly one solution; generator fallback cannot produce invalid or duplicate-solution puzzles.
- Verify row, column, and box conflicts; protected clues; notes; undo/redo; erased values; and completion only on a valid filled grid.
- Hints and checks update assistance records correctly, and restart clears the run while retaining its restarted-attempt status.
- Same-browser refresh restores the correct puzzle and entries; background time is excluded; blocked storage still permits play.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/sudoku`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Puzzle Journal presentation clearly separates fixed clues, player entries, pencil notes, selection, conflicts, and assisted results on mobile and desktop; visual feedback does not claim correctness without the documented check or hint actions.

## 7. Detailed 2D visual direction — Puzzle Journal

### 7.1. Mood and palette

The game should feel like a neatly printed Sudoku page in a quiet puzzle journal. It shares the paper family of Tic-Tac-Toe's Notebook Doodles theme, with crisp numerals and a carefully ruled grid for focused solving.

- Use warm off-white paper, graphite grid lines and fixed clues, muted blue player entries, and subtle grey pencil notes.
- Leave generous blank margins. Any paper grain stays faint enough to keep small notes and grid boundaries clear.
- Use pale selection highlights and restrained coral for conflict feedback, always paired with an outline or text explanation.
- Keep the page and all controls flat and 2D, with an uncluttered notebook-like composition.

### 7.2. Grid, entries, notes, and highlights

- Draw the exact 9 × 9 grid, using stronger dividers around the nine 3 × 3 boxes and finer internal cell lines.
- Fixed clues use a bold graphite numeral treatment. Editable entries use a distinct blue treatment; both remain crisp and readable.
- Pencil notes appear in a consistent small 3 × 3 arrangement inside a cell. They remain distinguishable from final entries.
- Highlight the selected cell and its row, column, and box quietly. Matching-digit emphasis may aid scanning without overwhelming the grid.
- Show conflicts with a cell outline and a concise explanation of the violated row, column, or box rule.
- Selection or conflict-free styling does not certify a digit against the unique solution. Fixed clues remain visibly protected from edits and notes.

### 7.3. Pages, typography, and layout

- Carry the paper, graphite, blue ink, and light notebook accents through the overview, difficulty setup, rules, puzzle, pause, and completion screens.
- Use a modest journal-style title with clear live text and clean printed numerals throughout the grid and keypad.
- Place difficulty and active time above the grid. Put the 1–9 keypad, Erase, Notes, Undo, Redo, Check, Hint, and Pause controls within easy reach.
- Show Notes mode as a persistent labelled state so the player can tell whether a key adds a note or a final entry.
- On phones, place the keypad and essential actions below the square grid. Keep notes legible and provide a larger 2D grid view when necessary.
- On wide screens, allow a compact control area beside the grid while preserving generous paper margins and consistent action labels.

### 7.4. Puzzle states and feedback

- Sudoku remains a solo puzzle; its visual setup shows difficulty and local resume options.
- Preserve the distinction between ordinary entries, conflicting entries, checked inconsistencies, and cells supplied by a hint.
- Check reports the documented inconsistencies without silently filling the puzzle. Hint feedback identifies the filled cell and updates the assisted-run indicators.
- Keep hint/check counts readable. Completion shows difficulty, active time, hints, and checks so assisted and unassisted records remain distinguishable.
- Pause presents a quiet paper panel with a clear Resume action and the documented suspended input/timer state.
- Give unfinished-run replacement, restart, and invalid-save messages the same readable journal controls as the main puzzle.

### 7.5. Animation and feedback

- Entries appear with a brief ink fade; notes and erasures use equally restrained transitions.
- Selection, matching-digit emphasis, and conflict outlines respond immediately and avoid repeated flashing.
- Use a gentle underline or outline for active Notes mode and chosen keypad actions.
- Keep edit acceptance, undo/redo, timer behaviour, checks, hints, and completion independent of decorative motion.
- Respect reduced-motion preferences by displaying all accepted edits and highlights immediately.
- Keep completion quiet: retain the finished grid and reveal a compact result message on the page.

### 7.6. Planned artwork and accessibility handoff

Prepare the paper treatment, ruled grid, selection/conflict styles, keypad, and small note/erase control symbols. Use live text for every numeral, note, timer, and record; the visual style should not require puzzle images. Provide keyboard entry and navigation, visible focus, and accessible labels that distinguish fixed clues, editable cells, notes, and conflicts. Elaborate illustration assets are unnecessary.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
