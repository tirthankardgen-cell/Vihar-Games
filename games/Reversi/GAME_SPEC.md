**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/reversi](https://games.vihar.online/reversi)  
**Open endpoint:** `GET /api/games/reversi` → `/reversi`  
**API base:** `/api/games/reversi`  
**Project:** Vihar Games; one shared Vercel deployment.

# Reversi — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Required modes:** Computer opponent, pass-and-play, and private online room.  
**Match format:** Standard 8 × 8 Reversi starting position.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Quiet Garden; a muted sage-green board with fine grid lines, flat charcoal and ivory discs, generous space, and a small leaf accent.

## 1. Game and objective

Players place discs to surround straight lines of the opponent's discs, converting those discs to their own side. When neither player can move, the player with more discs wins.

## 2. Exact rules

- Use 64 cells. Start with four occupied center cells: White at `d4` and `e5`, Black at `e4` and `d5`. Black moves first.
- A move places one own disc into an empty cell and must trap at least one contiguous opponent disc between the new disc and an existing own disc.
- Check all eight straight directions: horizontal, vertical, and diagonal. Each qualifying direction contains one or more opponent discs followed immediately by an own disc, with no empty gap.
- Flip all trapped opponent discs in every qualifying direction as part of the move. Discs do not move between cells.
- A placement that flips no discs is illegal and cannot consume a turn. An occupied cell is also illegal.
- A player who has no legal placement must pass automatically. Passing voluntarily while a legal move exists is forbidden.
- After a pass, the opponent acts if they have a legal move. If neither side can move, end the game even if empty cells remain.
- A full board ends the game because neither side can place. Count all occupied discs: the higher count wins; equal counts draw.
- A side with zero discs has no legal move; resolve the other side's move availability before ending. No artificial disc is added to continue play.
- Resignation or an online forfeit ends with an opponent win and a separate reason, without presenting unfinished counts as a normal full-game result.
- Alternate Black ownership on rematches. Keep session wins and draws by player identity, not by disc side.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Reversi, or visit `/reversi` directly. Choose Play or How to Play.
2. Computer mode: choose Easy, Medium, or Hard and Black, White, or Random. Start locally; a computer assigned Black moves first.
3. Pass-and-play: enter optional names and assign sides. Make one legal placement, resolve all flips and any forced pass, then ask the actual next player to accept the handover. If the opponent must pass, the same person may play again.
4. Online: enter a nickname, create a room, and share its six-character code or `https://games.vihar.online/reversi/play?room=ABC234`. A second human joins from their own device. The host starts when both seats are occupied.
5. Select a legal empty cell. Commit placement and all flips, automatically resolve move availability, and continue with the correct side.
6. When neither side can move, count discs and declare the winner or draw. Offer another local game or online Rematch/Return to Lobby. Both players accept a rematch before the host starts, swapping Black ownership by default.

## 4. Sessions, rooms, and interruptions

- Local modes use no online backend or guest identity. Save the active board, actor, side assignment, and session score locally when available; play remains possible without storage.
- Online creates persistent anonymous guest identities automatically and supports exactly two human seats. Same-browser reconnect restores the original seat and latest board.
- A disconnected player cannot submit a move. A connected opponent can claim forfeit after a 120-second disconnect grace period, or 120 seconds of current-turn inactivity since the last accepted action or turn start. Explicit resignation forfeits immediately.
- Forced rules passes are unrelated to network disconnection; do not treat a disconnected player as having no legal move.
- Transfer host duties on lobby departure; during play, the remaining player can request transfer after the grace period. Change seats or settings only in the lobby.
- Expire rooms after 24 inactive hours. If both people disconnect, retain the recoverable game until expiry without declaring a winner.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML/SVG board and flat two-sided disc treatments. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Use a pure TypeScript engine for legal placements, eight-direction scanning, flips, forced passes, counts, and terminal detection. The same engine drives all modes.
- State contains 64 cell owners, player-to-side assignment, actor, most recent move and flipped cells, forced-pass information, round, score, result reason, action IDs, and revision.
- Use browser workers for stronger computer search, with bounded thinking time. Evaluate actual legal placements and forced passes; cancel search after reset or navigation.
- Online uses Firebase anonymous identity, Realtime Database listeners, and Vihar Games Node.js API route handlers at `/api/games/reversi/rooms/<code>/actions`. Validate actor, placement, action ID, and revision; the server calculates all flips and passes atomically.
- Mount the game overview at `/reversi`, mode selection and play at `/reversi/play`, and rules at `/reversi/how-to-play`. Selecting the game in the shared catalog opens `/reversi`.
- `GET /api/games/reversi` redirects to the game overview. `GET /api/games/reversi/info` returns catalog metadata and supported modes; `GET /api/games/reversi/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/reversi/rooms`, join through `POST /api/games/reversi/rooms/<code>/join`, read member-visible state through `GET /api/games/reversi/rooms/<code>`, and submit mutations through `POST /api/games/reversi/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/reversi/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:reversi:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/reversi`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All modes complete games without registration on mobile and desktop.
- Verify all eight directions, multiple directions in one placement, interrupted lines, occupied cells, and moves flipping zero discs.
- Verify one-side forced passes, two-side no-move termination before a full board, full-board termination, and tied final counts.
- Shared-device handover selects the correct person after a pass; online disconnect cannot cause a rules pass.
- Two browsers agree on all flipped discs, actor, counts, and result; retries cannot apply a move twice.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/reversi`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/reversi` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Quiet Garden presentation makes disc ownership, legal placements, atomic captures, automatic passes, and final counts clear on mobile and desktop; all colour changes remain flat 2D.

## 7. Detailed 2D visual direction — Quiet Garden

### 7.1. Mood and palette

The game should feel calm and thoughtful, like a simple strategy board in a quiet garden. Keep the playing area spare and let the contrast between the two disc sides provide the focus.

- Use muted sage green for the board, cream for the surrounding page, charcoal for Black, and ivory for White.
- Keep grid lines fine but clearly visible. Use a deeper green or dark outline for active controls and selection.
- A small leaf illustration may sit in an outer margin or near the title. Keep botanical decoration away from empty cells and disc positions.
- All discs and board surfaces are flat shapes, without stone-like volume, spherical highlights, shadows, or raised edges.

### 7.2. Board, discs, and legal-move markers

- Render the exact 8 × 8 board and four-disc starting position from section 2.
- Keep charcoal and ivory discs similarly sized, clearly bounded, and readable against the sage cells.
- Use small quiet dots to indicate legal empty cells for the current player. Ensure they are visually distinct from placed discs.
- Show the selected destination with a simple outline. Disc captures change side within their existing cells; they never move between cells.
- Represent each player's current side and disc count in a compact badge above the board, using both a disc symbol and text.
- Retain the final arrangement after completion and identify the actual result reason alongside the counts.

### 7.3. Pages, typography, and layout

- Carry the sage, cream, charcoal, and ivory palette through the overview, mode setup, rules, board, and results.
- Use a calm display title and clear live text for player names, difficulty, counts, turns, and room controls.
- Place two player/count badges above the centred board and keep essential actions and session results nearby.
- On phones, preserve readable cells and comfortably sized placement targets; keep the leaf accent small enough to leave the board central.
- On wide screens, use generous surrounding space and the same compact control arrangement.
- Provide visible keyboard focus, cell labels, legal-placement descriptions, and text summaries of captures and passes.

### 7.4. Modes and gameplay states

- Computer, pass-and-play, and private rooms share the same garden palette and disc styling.
- Label the computer, its difficulty, and any pending thinking state without covering the board.
- Keep current side ownership attached to the correct player as Black ownership alternates on rematches.
- After a legal move, update all captured directions and disc counts from the same accepted state. Decorative intermediate colours cannot enable an extra placement.
- Show automatic passes with a concise message such as "No legal move; turn passed". A player cannot voluntarily pass while a legal move exists.
- Finish when the engine reports completion, including when both sides have no move with empty cells remaining. Use distinct text for a normal count result, draw, resignation, or forfeit.

### 7.5. Animation and feedback

- New discs appear with a brief flat fade. Captured discs change colour through a short 2D wipe or crossfade within their existing circular boundaries.
- Keep all captures from one move part of the same accepted action, even if their visual colour transitions are slightly staggered.
- Use a soft active-player underline and a static final-count emphasis. Keep the legal-move dots stable while the player considers a move.
- Animation remains brief and independent of legality, turn advancement, automatic passes, and computer search.
- Respect reduced-motion preferences by showing accepted disc colours and counts immediately, with a readable capture/pass summary.
- Clear stale legal-move markers and animations when restarting or leaving a match.

### 7.6. Planned artwork handoff

Prepare the flat sage grid, charcoal/ivory disc symbols, player badges, legal-move dots, selection outlines, and one small optional leaf illustration. Use lightweight HTML/SVG or Canvas 2D graphics with accessible live text. Detailed botanical artwork remains a planned margin accent.
