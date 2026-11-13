**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Game catalog

**Project:** Vihar Games  
**Updated:** 13 November 2026
**Hosting:** One Next.js application in one Vercel project.  
**Status:** Chess, Tic Tac Toe, and Carrom are `playable` in computer and pass-and-play modes; Carrom also supports practice, with their courtyard/notebook screens and published rules. Private-room screens are prepared but backend integration is deferred. The other nine games remain `planned`; catalog/launch/info APIs serve the whole collection.

**Presentation:** Every game is 2D only, using flat boards, pieces, cards, dice, and planar transitions.

## Included games and endpoints

All production paths below use `https://games.vihar.online`. A browser visit to a game's `GET` launch API redirects to its overview. Chess, Tic Tac Toe, and Carrom open their courtyard and notebook heroes and have implemented `/play`, `/how-to-play`, and `/rules` paths. The other nine games retain their overview and play/rules placeholders. Every game has an implemented `/info` API.

| Game specification | Game page | Launch API / API base | Solo | Pass-and-play people | Online room people |
| --- | --- | --- | --- | --- | --- |
| [Chess](./games/Chess/GAME_SPEC.md) | `/chess` | `/api/games/chess` | Acharya Dev: Easy / Medium / Hard | 2 | 2 |
| [Carrom](./games/Carrom/GAME_SPEC.md) | `/carrom` | `/api/games/carrom` | Computer opponent or practice | 2 | 2 |
| [Billiards](./games/Billiards/GAME_SPEC.md) | `/billiards` | `/api/games/billiards` | Computer opponent or practice | 2 | 2 |
| [Tic-Tac-Toe](./games/Tic-Tac-Toe/GAME_SPEC.md) | `/tic-tac-toe` | `/api/games/tic-tac-toe` | Computer opponent | 2 | 2 |
| [Ludo](./games/Ludo/GAME_SPEC.md) | `/ludo` | `/api/games/ludo` | 1 human + 1–3 bots | 2–4 | 2–4 |
| [Snakes and Ladders](./games/Snakes%20and%20Ladders/GAME_SPEC.md) | `/snakes-and-ladders` | `/api/games/snakes-and-ladders` | 1 human + 1–3 bots | 2–4 | 2–4 |
| [Connect Four](./games/Connect%20Four/GAME_SPEC.md) | `/connect-four` | `/api/games/connect-four` | Computer opponent | 2 | 2 |
| [Checkers](./games/Checkers/GAME_SPEC.md) | `/checkers` | `/api/games/checkers` | Computer opponent | 2 | 2 |
| [Reversi](./games/Reversi/GAME_SPEC.md) | `/reversi` | `/api/games/reversi` | Computer opponent | 2 | 2 |
| [Sudoku](./games/Sudoku/GAME_SPEC.md) | `/sudoku` | `/api/games/sudoku` | Solo puzzle | — | — |
| [Minesweeper](./games/Minesweeper/GAME_SPEC.md) | `/minesweeper` | `/api/games/minesweeper` | Solo puzzle | — | — |
| [Memory Match](./games/Memory%20Match/GAME_SPEC.md) | `/memory-match` | `/api/games/memory-match` | Solo puzzle | 2–4 | 2–4 |

Select any game from the shared homepage at `/`. The twelve entries above are the complete Vihar Games catalog for this phase.

The mode and player columns describe the full approved designs. Chess and Tic Tac Toe metadata reports `availability: "playable"`, `availableModes: ["computer", "pass-and-play"]`, and `rulesVersion: "1.0.0"`; online modes remain planned. Carrom also reports `availability: "playable"`, `availableModes: ["computer", "practice", "pass-and-play"]`, `rulesVersion: "1.0.0"`, and `embedVersion: 1`. Other games report `planned` availability and no available modes or rules version. All room actions remain deferred.

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
- Render all twelve games with HTML, SVG, or Canvas 2D. Do not use 3D or semi-3D presentation, modeled objects, raised/tilted boards, CSS perspective, or 3D transforms. Physics for Carrom and Billiards remains a 2D x/y simulation.
- Chess, Carrom, and Ludo use the detailed Gulam Chor-inspired Indian courtyard artwork direction in section 7 of their specifications. This includes the warm palette, cream Hindi titles, block-print/paper textures, and quiet flat controls.
- Every game now has an approved visual theme in section 7 of its own specification. The [visual index](./README.md#approved-2d-artwork-direction) lists all twelve handoffs, including Notebook Doodles for Tic-Tac-Toe and the eight distinct themes approved for the remaining games. Keep graphics flat, layouts uncluttered, and animation brief, with reduced-motion alternatives and preserved gameplay timing.
- Chess retains local solo play against Acharya Dev (आचार्य देव), a fictional Indian chess mentor with his own 2D avatar and selectable Easy, Medium, or Hard difficulty. His identity is distinct from human multiplayer seats.

## Planning documents

- [Project overview and document map](./README.md)
- [Project architecture, room lifecycle, and implementation boundaries](./docs/PROJECT_SPEC.md)
- [API endpoints, action payloads, and responses](./docs/API_ENDPOINTS.md)
- [Single-project Vercel deployment and verification plan](./docs/DEPLOYMENT.md)

## Suggested implementation order

1. Tic-Tac-Toe establishes the shared catalog, local modes, API commands, and online room lifecycle.
2. Connect Four, Memory Match, and Snakes and Ladders extend the foundation with scoring, private information, and server dice.
3. Checkers, Reversi, Sudoku, and Minesweeper add rule engines and puzzle sessions.
4. Chess and Ludo add special moves and multi-seat behavior.
5. Carrom and Billiards add deterministic shot simulation. Their physics require more work than the other familiar games.

Future work begins only when game implementation is requested.
