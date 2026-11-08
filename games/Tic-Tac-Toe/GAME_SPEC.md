**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/tic-tac-toe](https://games.vihar.online/tic-tac-toe)  
**Open endpoint:** `GET /api/games/tic-tac-toe` → `/tic-tac-toe`  
**API base:** `/api/games/tic-tac-toe`  
**Project:** Vihar Games; one shared Vercel deployment.

# Tic-Tac-Toe — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Required modes:** Computer opponent, pass-and-play, and private online room.  
**Match format:** Standard 3 × 3 Tic-Tac-Toe, one round at a time.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

## 1. Game and objective

Two players alternate placing X and O in empty cells. The first to make three of their marks in a row wins. A full board with no winning line is a draw.

## 2. Exact rules

- Use nine cells in three rows and three columns. One player has X; the other has O. X always moves first.
- A turn places exactly one mark in an empty cell. Marks cannot move or be removed during a round.
- Three matching marks in a horizontal row, vertical column, or either diagonal win immediately.
- Check for a winner before checking for a full-board draw. A final move that fills the board and completes a line is a win.
- Reject occupied-cell moves, out-of-turn moves, and all moves after a result.
- Keep a session score of each player's wins and the number of draws. A rematch alternates who receives X; do not change seats or identity when symbols swap.
- Easy computer play can make mistakes; Medium prefers winning and blocking; Hard uses complete optimal search and cannot lose from the standard starting position.
- Resignation or an online forfeit ends the round in favor of the opponent; classify it separately from a three-in-a-row win.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Tic-Tac-Toe, or visit `/tic-tac-toe` directly. Choose Play or How to Play.
2. Choose Play Computer, Pass-and-Play, Create Room, or Join Room.
3. Computer mode: choose difficulty and X, O, or Random; start a local round. If the human is O, the computer moves first.
4. Pass-and-play: enter optional names and assign the first X player. One person makes a move, then the other accepts the handover and plays on the same device.
5. Online: enter a nickname, create a room, and share the six-character code or `https://games.vihar.online/tic-tac-toe/play?room=ABC234`. A friend joins from their own device; the host starts once both seats are present.
6. Choose one empty cell on your turn. Commit the mark, check the result, and advance the turn only when the round remains active.
7. Show the win, draw, or forfeit reason and session score. Play Again starts another local round; online Rematch requires both players to accept before the host starts. Return to Lobby allows player or setting changes.

## 4. Sessions, rooms, and interruptions

- Local modes need no backend or guest identity. Save the active round and session score locally when possible; refresh can resume. Storage failure must not prevent play.
- Online uses persistent anonymous guests without a sign-in form, exactly two human seats, and server-owned rounds and scores. Same-browser reconnect restores the seat and current symbol.
- Disconnect blocks that player's submissions. After 120 seconds, a connected opponent can request forfeit. The same request is available after 120 seconds of current-turn inactivity since the last accepted action or turn start. Explicit resignation is immediate.
- The host role transfers when the host leaves a lobby; the remaining player can request transfer after a mid-round disconnect grace period. Active rounds cannot accept new seats.
- Rooms expire after 24 hours without an accepted action. If both people disconnect, retain the round until expiry without assigning a winner. A claimed forfeit cannot be reversed by reconnecting.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML/SVG grid with flat X/O marks. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Implement a pure TypeScript engine for legal moves, all eight winning lines, draws, turn changes, and scoring. Use the same engine for local, computer, and online modes.
- Online follows Gulam Chor: Firebase anonymous identity, Realtime Database listeners, and Vihar Games Node.js API route handlers at `/api/games/tic-tac-toe/rooms/<code>/actions`. Atomically validate room membership, current actor, cell, round ID, action ID, and expected revision.
- State contains the nine cells, seat-to-symbol assignment, current actor, round number, status, winner or draw reason, session scores, rematch acceptance, and revision. Duplicate requests must not place extra marks or count the result twice.
- Computer logic runs locally and responds without blocking interactions. Cancel pending moves when a round is restarted or left.
- Mount the game overview at `/tic-tac-toe`, mode selection and play at `/tic-tac-toe/play`, and rules at `/tic-tac-toe/how-to-play`. Selecting the game in the shared catalog opens `/tic-tac-toe`.
- `GET /api/games/tic-tac-toe` redirects to the game overview. `GET /api/games/tic-tac-toe/info` returns catalog metadata and supported modes; `GET /api/games/tic-tac-toe/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/tic-tac-toe/rooms`, join through `POST /api/games/tic-tac-toe/rooms/<code>/join`, read member-visible state through `GET /api/games/tic-tac-toe/rooms/<code>`, and submit mutations through `POST /api/games/tic-tac-toe/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/tic-tac-toe/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:tic-tac-toe:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/tic-tac-toe`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All three modes complete wins and draws without registration on touch and desktop devices.
- Validate every winning line, an occupied-cell rejection, a win on the ninth move, and a full-board draw.
- Hard mode is unbeatable against all legal human move sequences.
- Two independent browser profiles agree on symbols, actor, score, and result after every move; retries cannot double-count a round.
- Rematches alternate X ownership and retain score. Local handover and online reconnect preserve the correct next player.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/tic-tac-toe`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/tic-tac-toe` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
