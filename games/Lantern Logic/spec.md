# Lantern Logic

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `lantern-logic` · **Category:** Puzzle · **Players:** One  
**Page:** `/lantern-logic` · **API base:** `/api/games/lantern-logic`  
**Style:** Lantern Workshop · **Inspiration:** Nonogram picture logic

## 1. Identity and experience

Solve row and column clues to light a hidden stencil picture. Ink outlines and warm lantern squares make careful logical deduction feel like assembling a small paper lantern.

Target session: 3–15 minutes. This is an untimed single-player deduction puzzle with optional active-time display. No guessing requirement, lives, daily streak pressure, or multiplayer race.

## 2. Exact rules

- Every cell has one of three player states: Unknown, Lit, or Empty. Fixed row/column clues describe the contiguous runs of Lit cells in their listed order.
- Each positive clue value is a run length. Separate successive runs by at least one Empty cell. A clue of `0` means that the entire line is Empty.
- Example: `2 1` on a five-cell row permits `Lit, Lit, Empty, Lit, Empty`, but not three adjacent Lit cells. Leading/trailing Empty cells are allowed.
- The same cells must satisfy their row and column clues. Clues never change as the player edits.
- The player may revise any non-fixed entry. A mark does not automatically reveal correctness, hidden picture identity, or a solution cell.
- Completion requires every cell explicitly classified and all row and column runs satisfied. Authored puzzles must have exactly one solution; the stored solution is a validation aid, not visible starting information.
- An optional Check action identifies contradictory completed lines only. Unknown cells prevent a line from being treated as completed. Checking does not auto-fill or consume a life.
- A Hint reveals the correct state of one player-selected cell, records one hint, and marks the run assisted. There is no automatic correction during normal entry.

## 3. Presets, progress, and ending

| Preset | Grid | Intended use |
| --- | --- | --- |
| Small glow | 5×5 | Introduction and quick play |
| Workshop | 10×10 | Default deduction |
| Festival | 15×15 | Longer picture puzzle |

Each authored puzzle has an ID, grid solution, derived clues, and a uniqueness witness from validation. Picture title/finished illustration remain concealed until completion or an explicitly confirmed assisted solution preview.

Progress shows classified cells/total, active time if enabled, and hints. Completion shows puzzle name, size, time, and assistance status. No speed score or penalty for erasing a mark. Keep local completion records separately for assisted and unassisted runs.

## 4. Controls and editing

- Pointer/touch selects a cell; explicit Lit, Empty, and Erase tools apply its state. Optional drag painting applies the selected tool once to each entered cell in a gesture; one gesture is one undo transaction.
- Arrow keys navigate; Space sets Lit, X sets Empty, Backspace/Delete clears. The selected tool and focused coordinates are labelled.
- Undo/redo restore marks without reversing cumulative hint/time counters. Pause preserves marks and hides the active puzzle behind a clear Resume sheet.
- Large grids support zoom/pan with row/column headers retained. Changing zoom or device orientation does not rearrange clues or reset the puzzle.

## 5. Detailed 2D visual direction — Lantern Workshop

- Palette: rice paper `#F6EBDD`, dark plum `#47384B`, lantern amber `#D1A24E`, muted red `#AB615A`, chalk `#FFF9EE`.
- Use a fine plum grid with stronger separators every five cells. Clues are dark live numerals aligned exactly to their rows/columns.
- Lit cells are flat amber squares with a small corner glint; Empty cells use a restrained ink cross; Unknown cells are plain paper. Shape and mark distinguish states without colour.
- Decorative lantern tassels belong at the frame corners, not inside clue gutters. No glowing blur behind text, flicker, or animation that looks like an automatically solved cell.
- Overview features a partly lit abstract stencil. Setup resembles a shelf of three lantern sizes. Play keeps tools below the grid and progress above it. Results reveal the completed stencil on a paper lantern outline.
- A short fill fade and quiet completed-line underline provide feedback. Reduced motion applies marks immediately. Completed clues must remain readable and never disappear.
- Phone grids use optional enlarged cells and pinned clues; desktop centres the workshop panel with hints/settings outside the grid.
- Optional sound: a soft pencil mark and a single warm bell on completion.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Store puzzle ID/version, grid marks, undo/redo transactions, active time, hint count, and assisted flag. Validate dimensions, mark states, immutable clues, and puzzle version. Never expose the hidden picture in accessible cell labels before legitimate completion/reveal.

## 7. Future asset handoff

Original lantern outlines, three size motifs, tassel frame, initial abstract stencil, authored unique picture puzzles, completion illustration, and optional sounds. The game engine and assets remain planned.

## 8. Acceptance when implemented

- Ordered clue runs, separators, zero lines, contradictory lines, and exact completion follow the published rules.
- Every shipped puzzle has derived clues and one verified solution.
- Mark tools, drag undo, keyboard labels, clue alignment, and zoom preserve grid state.
- Hints mark assistance; reload/pause preserves progress without exposing the answer.
