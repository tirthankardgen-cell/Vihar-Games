# Mosaic Shift

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `mosaic-shift` · **Category:** Puzzle · **Players:** One  
**Page:** `/mosaic-shift` · **API base:** `/api/games/mosaic-shift`  
**Style:** Ceramic Studio · **Inspiration:** Sliding numbered tiles

## 1. Identity and experience

Slide small ceramic tiles into a single empty space to restore a numbered mosaic. Original flat pottery motifs provide a visual reward while clear numbering keeps the puzzle legible.

Target session: 2–12 minutes. One player solves a reachable arrangement at their own pace; no rotating tiles, swapping arbitrary pairs, time limits, or rivals.

## 2. Exact rules

- Choose an `N×N` board with distinct tiles numbered `1` through `N² - 1` and one empty cell. Tiles occupy stable row/column coordinates.
- A legal move slides one tile orthogonally adjacent to the empty cell into that cell. Diagonal moves, jumping over another tile, moving a whole row, and arbitrary swapping are illegal.
- Victory requires row-major ascending numbers with the empty cell in the bottom-right corner. A matching-looking picture is insufficient if tile IDs are out of order.
- Start from an authored scramble made by legal moves from the solved board. Store the generating move witness, reject an already solved starting position, and never use an unchecked random permutation.
- Every accepted tile slide increments cumulative moves once. Illegal selections change neither arrangement nor count.
- Undo/redo restore arrangements; they do not decrease cumulative moves or active time, and replaying a stored undo transaction is not a new scored slide. Starting again resets the run to the same authored scramble and zero counters.
- Hint highlights one legal next tile from a verified solution path/search and marks the run assisted. A failed/cancelled search must not invent a suggested move or change state.

## 3. Presets, content, and records

| Preset | Board | Tiles |
| --- | --- | --- |
| Miniature | 3×3 | 8 |
| Studio | 4×4 | 15 |
| Wall panel | 5×5 | 24 |

The first release uses a small authored collection for each size, each with an original tile illustration and a legal scramble witness. Board size is chosen before play; it cannot change the current puzzle.

Show moves and optional active time. Results record puzzle ID, size, moves, time, hints, and assisted status. Compare personal records only for the same puzzle/version, ranking fewer moves first and active time only for equal moves. Show a reference image when requested; it is the target arrangement, not a move hint, and does not mark assistance.

## 4. Controls and interruption

- Tap/click an adjacent tile to slide it. A nonadjacent tile selection provides a quiet explanation and performs no move.
- Arrow keys move focus across tiles; Enter/Space activates the focused tile. Labels include tile number, current coordinate, and whether it can slide.
- Provide visible Undo, Redo, Reference, Restart, and Pause controls. The empty cell is named and visibly outlined.
- Animations never queue unintended extra moves. Accept the next legal input against committed state; restarting cancels any old slide feedback.
- Pause freezes active time. Resize/zoom preserves the permutation and selection. All board sizes need readable tile numbers on a phone.

## 5. Detailed 2D visual direction — Ceramic Studio

- Palette: chalk `#F4EFE3`, cobalt ink `#355E82`, terracotta `#B47758`, glazed teal `#698D88`, dark clay `#3B454B`.
- Tiles are flat cream squares with a fine cobalt border, a generous live number, and an original fragment of a floral/geometric ceramic pattern. Numbers remain visible even when picture mode is selected.
- Give the empty position a dashed clay outline and a plain paper interior. No beveled grout, lifted tile shadows, perspective surface, or 3D sliding effect.
- Use three different mosaic families for the board sizes, rather than stretching the same picture. Motifs use distinct forms and tile IDs; adjacent fragments must not hide numbering.
- Overview is a small complete mosaic with one offset tile. Setup resembles three catalogue cards. Play centres the tile panel with move/time controls above and reference access below. Results show a flat ceramic maker's stamp.
- Slide accepted tiles in the x/y plane over roughly 120 ms; reduced motion updates immediately. The authoritative permutation changes before decorative motion.
- Phone panels fill available width with optional zoom for 5×5. Desktop adds whitespace and a side reference card without changing the board.
- Optional sound: one dry ceramic click per accepted slide and a short completion chime.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Save puzzle ID/version, size, tile permutation/empty index, undo/redo, cumulative moves, hint count, active time, and assistance. Validate each ID occurs exactly once, the empty cell is unique, and the state is reachable for that puzzle. Restore without replaying animation or counting a move.

## 7. Future asset handoff

Three original mosaic families, flat tile borders, empty marker, reference cards, maker's stamp, authored scramble witnesses, and optional sounds. Custom tiles, screens, and engine are future work.

## 8. Acceptance when implemented

- Only orthogonally adjacent tiles slide; every accepted new slide counts once.
- All initial scrambles are reachable and non-solved; completion uses IDs and exact target order.
- Undo/redo, reference, hints, pause, and save restoration respect counters and assistance.
- Numbers, focus, tile positions, and selection remain legible through mobile zoom/resize.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
