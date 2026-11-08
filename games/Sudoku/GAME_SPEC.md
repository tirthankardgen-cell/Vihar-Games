**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/sudoku](https://games.vihar.online/sudoku)  
**Open endpoint:** `GET /api/games/sudoku` → `/sudoku`  
**API base:** `/api/games/sudoku`  
**Project:** Vihar Games; one shared Vercel deployment.

# Sudoku — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One.  
**Required mode:** Local single-player puzzle.  
**Match format:** Standard 9 × 9 Sudoku with Easy, Medium, and Hard difficulty.

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
