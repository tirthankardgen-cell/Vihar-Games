# Crate Courtyard

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `crate-courtyard` · **Category:** Puzzle · **Players:** One  
**Page:** `/crate-courtyard` · **API base:** `/api/games/crate-courtyard`  
**Style:** Morning Market · **Inspiration:** Sokoban-style crate pushing

## 1. Identity and experience

Help a market keeper place flat produce crates on chalk delivery marks. A small top-down bazaar, indigo cloth details, and careful spatial planning distinguish this game from the collection's board games.

Target session: 2–12 minutes. Single-player authored spatial puzzles; no timer limit, enemies, falling objects, crate pulling, or hidden target requirements.

## 2. Exact rules

- Each level is a finite orthogonal map of walls, walkable floor, target cells, one keeper, and an equal positive number of crates and targets. A target is also floor.
- A keeper move is one cell North, South, East, or West. Walking into a wall or beyond the authored map is illegal and changes no state.
- If the adjacent cell contains a crate, the keeper may push it one cell in that direction only when the next cell is floor/target and has no crate. The keeper occupies the crate's old cell after a successful push.
- Push exactly one crate at a time. Crates cannot be pulled, passed through, stacked, pushed diagonally, or moved as a chain.
- Crates are mechanically identical; any crate can fill any target. A crate on a target may be moved again.
- Victory occurs when every target is occupied by one crate, regardless of the keeper's final position. All targets are visible from the start.
- Each accepted one-cell keeper action increments cumulative moves once. A successful push also increments cumulative pushes once. Illegal actions count neither.
- An unsolved position with no legal keeper move may show **No moves available**, but is recoverable with Undo/Restart. A crate in a non-target wall corner receives a warning; do not declare every apparent deadlock solved or terminal without proof.

## 3. Levels, assistance, and records

| Preset | Maximum map | Crates | Intended challenge |
| --- | --- | --- | --- |
| Delivery | 6×6 | 1–2 | Learn pushing and corners |
| Market | 8×8 | 3–4 | Order and narrow passages |
| Courtyard | 10×10 | 4–6 | Multi-stage planning |

Maps can be smaller than the maximum and need no rectangular walkable interior. Each level includes stable ID, floor/wall map, keeper/crate/target positions, and a complete validated solving move sequence. Initial state must be unsolved and reachable to a solution.

Undo/redo restore positions without reducing cumulative counters/time. Hint suggests the next action from a validated current-state solution and marks assistance; failure to find a solution shows no invented guidance. Results show level, pushes, moves, optional active time, and assistance. Personal records for the same level/version rank pushes, then moves, then active time.

## 4. Controls and interruption

- Arrow keys/WASD move one cell. Each separate press acts once; held repeat, if enabled, waits 220 ms then repeats every 150 ms and is disabled by default for deliberate play.
- Touch/pointer use a visible direction pad. Clicking distant floor does not silently route the keeper or perform a series of pushes.
- Provide Undo, Redo, Hint, Restart, and Pause. Label keeper position, adjacent walls/crates/targets, and successful pushes accessibly.
- Movement feedback is brief and planar. Accept inputs against settled logical state; restart/navigation cancels obsolete queued input and animation.
- Pause freezes active time; reloading restores the same map and positions. Larger maps allow zoom without hiding goals or changing coordinates.

## 5. Detailed 2D visual direction — Morning Market

- Palette: limestone `#F0E7D4`, deep indigo `#344A69`, marigold `#C29D46`, crate rust `#A86C4E`, leaf `#758C65`.
- Render a flat top-down map with fine floor joints and solid wall blocks. Keep the walkable boundary obvious; no isometric streets, roof overlap, or 3D crates.
- Crates are square rust outlines with a tiny original produce stamp. Target cells show a chalk ring plus a live target mark; a correctly placed crate carries a small tick while the target outline stays visible.
- Keeper is a compact illustrated top-down symbol with a direction notch. Distinguish the keeper, target, crate, wall, and empty floor by shape and pattern.
- Decorative cloth awnings and baskets live outside the walkable map. The overview depicts one simple delivery diagram; setup uses a folded order list; results show a stamped delivery receipt.
- Play puts pushes/moves above the map, direction/undo tools below, and level name in quiet live text. No bonus coins, cart physics, crowd simulation, or busy scene decoration.
- Use a short one-cell slide for walking/pushing; reduced motion updates immediately. No shaking deadlock warning or punitive flash.
- Optional sound: a soft footstep, dry crate scrape, and one receipt stamp on completion.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Store level ID/version, keeper and distinct crate positions, undo/redo transactions, moves, pushes, hints, active time, and assistance. Validate floor occupancy, crate/target count, distinct positions, and `pushes ≤ moves`. Derive target coverage from positions rather than saved victory flags.

## 7. Future asset handoff

Original keeper symbol, crate stamps, floor/wall/target tiles, indigo margin cloth, delivery receipt, authored maps with solutions, and optional sounds. Gameplay and assets remain future work.

## 8. Acceptance when implemented

- Walking, single pushing, blocked chains, corner warnings, and exact all-target victory obey the published rules.
- Each shipped level has a verified complete solution and visible targets.
- Undo/redo, hints, counters, saves, and result ranking remain consistent.
- Touch/keyboard controls and map zoom never introduce hidden pathfinding or extra moves.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
