**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Game catalog

**Project:** Vihar Games  
**Updated:** 14 November 2026
**Hosting:** One Next.js application in one Vercel project.  
**Status:** 24 catalog entries, including twelve new solo puzzle/arcade designs. Chess, Tic Tac Toe, and Carrom are `playable` in computer and pass-and-play modes; Carrom also supports practice. Paperwing is `playable` in solo Standard/Practice. Sudoku is `playable` in solo Easy/Medium/Hard. Dune Dash is `playable` in solo Endless/Practice. All six have original screens and published rules, and appear first in the catalog. Private-room screens are prepared but backend integration is deferred. The other 18 games remain `planned`; catalog/launch/info APIs serve the whole collection.

**Presentation:** Every game is 2D only, using flat boards, pieces, cards, dice, and planar transitions.

## Included games and endpoints

All production paths below use `https://games.vihar.online`. A browser visit to a game's `GET` launch API redirects to its overview. Chess, Tic Tac Toe, Carrom, Sudoku, Paperwing, and Dune Dash open their own themed overviews and have implemented `/play`, `/how-to-play`, and `/rules` paths. The other 18 games retain their overview and play/rules placeholders. Every game has an implemented `/info` API.

| Game specification | Game page | Launch API / API base | Solo | Pass-and-play people | Online room people |
| --- | --- | --- | --- | --- | --- |
| [Chess](./games/Chess/GAME_SPEC.md) | `/chess` | `/api/games/chess` | Acharya Dev: Easy / Medium / Hard | 2 | 2 |
| [Carrom](./games/Carrom/GAME_SPEC.md) | `/carrom` | `/api/games/carrom` | Computer opponent or practice | 2 | 2 |
| [Tic-Tac-Toe](./games/Tic-Tac-Toe/GAME_SPEC.md) | `/tic-tac-toe` | `/api/games/tic-tac-toe` | Computer opponent | 2 | 2 |
| [Paperwing](./games/Paperwing/spec.md) | `/paperwing` | `/api/games/paperwing` | Flying bird | — | — |
| [Billiards](./games/Billiards/GAME_SPEC.md) | `/billiards` | `/api/games/billiards` | Computer opponent or practice | 2 | 2 |
| [Ludo](./games/Ludo/GAME_SPEC.md) | `/ludo` | `/api/games/ludo` | 1 human + 1–3 bots | 2–4 | 2–4 |
| [Snakes and Ladders](./games/Snakes%20and%20Ladders/GAME_SPEC.md) | `/snakes-and-ladders` | `/api/games/snakes-and-ladders` | 1 human + 1–3 bots | 2–4 | 2–4 |
| [Connect Four](./games/Connect%20Four/GAME_SPEC.md) | `/connect-four` | `/api/games/connect-four` | Computer opponent | 2 | 2 |
| [Checkers](./games/Checkers/GAME_SPEC.md) | `/checkers` | `/api/games/checkers` | Computer opponent | 2 | 2 |
| [Reversi](./games/Reversi/GAME_SPEC.md) | `/reversi` | `/api/games/reversi` | Computer opponent | 2 | 2 |
| [Sudoku](./games/Sudoku/GAME_SPEC.md) | `/sudoku` | `/api/games/sudoku` | Solo puzzle | — | — |
| [Minesweeper](./games/Minesweeper/GAME_SPEC.md) | `/minesweeper` | `/api/games/minesweeper` | Solo puzzle | — | — |
| [Memory Match](./games/Memory%20Match/GAME_SPEC.md) | `/memory-match` | `/api/games/memory-match` | Solo puzzle | 2–4 | 2–4 |
| [Silk Trail](./games/Silk%20Trail/spec.md) | `/silk-trail` | `/api/games/silk-trail` | Snake | — | — |
| [Monsoon Blocks](./games/Monsoon%20Blocks/spec.md) | `/monsoon-blocks` | `/api/games/monsoon-blocks` | Falling blocks | — | — |
| [Dune Dash](./games/Dune%20Dash/spec.md) | `/dune-dash` | `/api/games/dune-dash` | Endless runner | — | — |
| [Lantern Logic](./games/Lantern%20Logic/spec.md) | `/lantern-logic` | `/api/games/lantern-logic` | Nonogram | — | — |
| [Mosaic Shift](./games/Mosaic%20Shift/spec.md) | `/mosaic-shift` | `/api/games/mosaic-shift` | Sliding tiles | — | — |
| [Prism Paths](./games/Prism%20Paths/spec.md) | `/prism-paths` | `/api/games/prism-paths` | Light routing | — | — |
| [Crate Courtyard](./games/Crate%20Courtyard/spec.md) | `/crate-courtyard` | `/api/games/crate-courtyard` | Crate pushing | — | — |
| [Tide Turn](./games/Tide%20Turn/spec.md) | `/tide-turn` | `/api/games/tide-turn` | Water measuring | — | — |
| [Pebble Solitaire](./games/Pebble%20Solitaire/spec.md) | `/pebble-solitaire` | `/api/games/pebble-solitaire` | Peg solitaire | — | — |
| [Rangoli Loops](./games/Rangoli%20Loops/spec.md) | `/rangoli-loops` | `/api/games/rangoli-loops` | Loop deduction | — | — |
| [Orbit Breaker](./games/Orbit%20Breaker/spec.md) | `/orbit-breaker` | `/api/games/orbit-breaker` | Brick breaker | — | — |

Select any game from the shared homepage at `/`. The 24 entries above are the complete Vihar Games catalog for this phase. Ten retain planned multiplayer support; Sudoku, Minesweeper, and the twelve additions are exclusively solo.

The mode and player columns describe the full approved designs. Chess and Tic Tac Toe metadata reports `availability: "playable"`, `availableModes: ["computer", "pass-and-play"]`, and `rulesVersion: "1.0.0"`; online modes remain planned. Carrom also reports `availability: "playable"`, `availableModes: ["computer", "practice", "pass-and-play"]`, `rulesVersion: "1.0.0"`, and `embedVersion: 1`. Paperwing reports `playable`, `availableModes: ["solo"]`, `soloPresets: ["standard", "practice"]`, `rulesVersion: "2.0.0"`, and `embedVersion: 1`. Dune Dash reports `playable`, `availableModes: ["solo"]`, `soloPresets: ["endless", "practice"]`, `rulesVersion: "1.0.0"`, and `embedVersion: 1`. The other eighteen games report `planned` availability and no available modes or rules version. All room actions remain deferred.

## New solo games and original styles

| Game | Familiar mechanic | Original visual direction |
| --- | --- | --- |
| [Silk Trail](./games/Silk%20Trail/spec.md) | Snake | Silk Garden: mulberry snake, woven border, parchment and sage |
| [Monsoon Blocks](./games/Monsoon%20Blocks/spec.md) | Falling blocks | Rain Window: patterned glass swatches and muted rain colours |
| [Dune Dash](./games/Dune%20Dash/spec.md) | Endless runner | Desert Field Notes: original fox, sandstone, natural-history print |
| [Paperwing](./games/Paperwing/spec.md) | Flying bird | Airmail Atelier: folded swallow, postal panels, navy and coral |
| [Lantern Logic](./games/Lantern%20Logic/spec.md) | Nonogram | Lantern Workshop: amber stencil cells and plum clues |
| [Mosaic Shift](./games/Mosaic%20Shift/spec.md) | Sliding tiles | Ceramic Studio: cobalt patterns, chalk tiles, maker stamp |
| [Prism Paths](./games/Prism%20Paths/spec.md) | Light routing | Optical Print Room: drafting paper and labelled beams |
| [Crate Courtyard](./games/Crate%20Courtyard/spec.md) | Crate pushing | Morning Market: produce stamps, chalk targets, indigo cloth |
| [Tide Turn](./games/Tide%20Turn/spec.md) | Water measuring | Brass Water Study: vessel silhouettes, litre ticks, teal water |
| [Pebble Solitaire](./games/Pebble%20Solitaire/spec.md) | Peg solitaire | Riverstone Tray: stone silhouettes and reed/ripple margins |
| [Rangoli Loops](./games/Rangoli%20Loops/spec.md) | Loop deduction | Chalk Threshold: dotted limestone grid and rangoli corners |
| [Orbit Breaker](./games/Orbit%20Breaker/spec.md) | Brick breaker | Celestial Instrument: comet, chart tiles, gold paddle |

Each new `spec.md` defines exact rules, controls, presets, scoring/progress, endings, local state, artwork, sound direction, and future acceptance criteria. [Shared solo standards](./docs/SOLO_GAME_STANDARDS.md) cover premium flat 2D presentation, accessibility, pause/resume, local saves, and later Quick Play integration. Paperwing and Dune Dash now ship local engines, original artwork, optional audio, saves and game screens. The other ten additions retain catalog entries and specifications; their implementation remains future work. The other ten additions' `/play` and `/how-to-play` pages stay **Coming soon**, and `/rules` returns `404 RULES_NOT_AVAILABLE` until actual rules are published.

## Shared play flow

1. Open Vihar Games, select a game, and read its rules or choose Play.
2. Start a local solo puzzle, computer match, or practice mode where the game supports it. Local gameplay uses no guest identity or server match.
3. For Pass-and-Play, enter optional names and take turns on one phone, tablet, or laptop, using the game's handover process.
4. For online play, choose Create Room or Join Room, use a nickname, and share a six-character code or `https://games.vihar.online/<game-id>/play?room=ABC234`.
5. Friends join from separate devices or browser profiles. The host starts with the game's documented human player count. Accepted actions and results synchronize within that game's room.
6. Finish with the game's result, then play again or return to its lobby. All continuing online players accept a rematch before the host starts.

Accounts, email addresses, passwords, visible sign-in, and downloads are not required. Online mode automatically obtains an anonymous guest identity. Sudoku and Minesweeper remain solo puzzles; the other ten games retain both local multiplayer and private rooms.

## Common project requirements

- `games.vihar.online` is the only deployment domain. Game names become URL paths, not separate hostnames or separate Vercel projects.
- One shared package, lockfile, App Router application, environment configuration, and release pipeline serve the full catalog.
- Use latest stable compatible Next.js, React, TypeScript, Tailwind CSS, and the newest stable Node.js supported by Vercel when implementation begins.
- Keep each game's rules and state inside its own module, while sharing catalog, routing, guest access, room lifecycle, persistence helpers, and API validation.
- Firebase Realtime Database provides durable online room state, and Firebase anonymous authentication identifies guests. The game's Node.js API handlers on Vercel perform authoritative mutations.
- Namespace room state and local saves by game ID. The same room code in two different games never identifies the same match.
- Preserve the exact rules in each specification. This reorganization changes project structure, routes, and API delivery.
- Render all twenty-four games with HTML, SVG, or Canvas 2D. Do not use 3D or semi-3D presentation, modeled objects, raised/tilted boards, CSS perspective, or 3D transforms. Physics for Carrom and Billiards remains a 2D x/y simulation.
- Chess, Carrom, and Ludo use the detailed Gulam Chor-inspired Indian courtyard artwork direction in section 7 of their specifications. This includes the warm palette, cream Hindi titles, block-print/paper textures, and quiet flat controls.
- Every game has its own visual handoff: section 7 of the original `GAME_SPEC.md` files and section 5 of the new `spec.md` files. The [visual index](./README.md#approved-2d-artwork-direction) covers all 24 themes. Keep graphics flat, layouts uncluttered, and animation brief, with reduced-motion alternatives and preserved gameplay timing.
- Chess retains local solo play against Acharya Dev (आचार्य देव), a fictional Indian chess mentor with his own 2D avatar and selectable Easy, Medium, or Hard difficulty. His identity is distinct from human multiplayer seats.

## Planning documents

Sudoku now reports `availability: "playable"`, `availableModes: ["solo"]`, `soloPresets: ["easy", "medium", "hard"]`, `rulesVersion: "1.0.0"`, and `embedVersion: 1`. Its journal screens and public rules are implemented; gameplay and personal records remain local.

- [Project overview and document map](./README.md)
- [Project architecture, room lifecycle, and implementation boundaries](./docs/PROJECT_SPEC.md)
- [API endpoints, action payloads, and responses](./docs/API_ENDPOINTS.md)
- [Single-project Vercel deployment and verification plan](./docs/DEPLOYMENT.md)
- [Shared solo puzzle and arcade requirements](./docs/SOLO_GAME_STANDARDS.md)

## Suggested implementation order

1. Tic-Tac-Toe establishes the shared catalog, local modes, API commands, and online room lifecycle.
2. Connect Four, Memory Match, and Snakes and Ladders extend the foundation with scoring, private information, and server dice.
3. Checkers, Reversi, Sudoku, and Minesweeper add rule engines and puzzle sessions.
4. Chess and Ludo add special moves and multi-seat behavior.
5. Carrom and Billiards add deterministic shot simulation. Their physics require more work than the other familiar games.
6. When solo additions are commissioned, start with Silk Trail/Mosaic Shift, then Lantern Logic/Pebble Solitaire/Tide Turn, followed by Crate Courtyard/Prism Paths/Rangoli Loops and the remaining arcade games. This is a suggested sequence; implementation begins only when requested.

Future work begins only when game implementation is requested.
