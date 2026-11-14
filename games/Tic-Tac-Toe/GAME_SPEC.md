**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/tic-tac-toe](https://games.vihar.online/tic-tac-toe)  
**Open endpoint:** `GET /api/games/tic-tac-toe` → `/tic-tac-toe`  
**API base:** `/api/games/tic-tac-toe`  
**Project:** Vihar Games; one shared Vercel deployment.

# Tic-Tac-Toe — Game specification

**Status:** Computer play, pass-and-play, the notebook hero, setup, and rules are implemented. Create/Join Room screens are prepared; Firebase and room backend integration are deferred until the user supplies backend details.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Required modes:** Computer opponent, pass-and-play, and private online room.  
**Currently available:** Computer opponent and pass-and-play. Private rooms remain an explicit later integration.  
**Match format:** Standard 3 × 3 Tic-Tac-Toe, one round at a time.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Notebook Doodles; a minimal, mostly empty notebook page with hand-drawn board lines, X/O marks, and drawing animations.

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

1. Open Vihar Games at `https://games.vihar.online` and select Tic-Tac-Toe, or visit `/tic-tac-toe` directly. The landing page is one full-screen Notebook Doodles hero with a **Let's Play** button and a How to Play link. Let's Play opens `/tic-tac-toe/play`.
2. Choose Play Computer, Pass-and-Play, Create Room, or Join Room.
3. Computer mode: choose difficulty and X, O, or Random; start a local round. If the human is O, the computer moves first.
4. Pass-and-play: enter optional names and assign the first X player. One person makes a move, then the other accepts the handover and plays on the same device.
5. Planned online integration: enter a nickname, create a room, and share the six-character code or `https://games.vihar.online/tic-tac-toe/play?room=ABC234`. A friend joins from their own device; the host starts once both seats are present. For now, Create/Join Room screens clearly show that private rooms are coming soon and offer pass-and-play; they do not create pretend rooms or contact a backend.
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
- The overview, setup, and play screens follow the Notebook Doodles direction below. On mobile and desktop, the board feels drawn directly onto a mostly empty notebook page; hand-drawn lines, marks, and animations stay readable and do not delay play.

## 7. Detailed 2D visual direction — Notebook Doodles

### 7.1. Overall mood and notebook page

The experience should feel like opening an empty notebook, drawing a Tic-Tac-Toe grid, and playing with a friend. Keep the aesthetic minimal, quiet, informal, and personal. The doodles are the board and the moves themselves; the page does not need a collection of decorative sketches.

- Use a warm white or pale cream paper background with generous empty space around the board. Keep paper grain faint and make the horizontal notebook ruling clearly visible with restrained blue-grey lines, so the background reads as a real notebook without competing with the game.
- Keep the entire scene flat and 2D. The board is drawn directly on the page, with no raised tiles, perspective, heavy shadows, or surrounding desk scene.
- Use a restrained palette: charcoal or graphite for the grid and text, with muted blue and muted red ink available for the two players. Keep X and O recognizable by shape as well as colour.
- Avoid busy borders, stickers, large illustrations, dense textures, neon effects, and confetti. Small purposeful strokes are enough to establish the notebook identity.

### 7.2. Hand-drawn board and player marks

- Draw the 3 × 3 board with exactly two horizontal and two vertical pencil or pen lines. Leave the outside edges open, as on a casually sketched paper grid.
- Give grid strokes visible natural irregularity in curvature, endpoints, and thickness. Lean the sketch slightly to the left or right with a flat 2D rotation; rotate the marks, winning line, and cell targets together so every square remains correctly usable.
- Draw each X as two uneven diagonal pen strokes and each O as an irregular loop with a small pen overlap. Vary curvature, lengths, and endpoints so the marks feel drawn by hand. Keep them centred, similarly sized, and clearly separated from the grid lines.
- Use controlled variations between marks without changing their identity or making the board appear untidy. A placed mark stays still for the rest of the round.
- On a three-in-a-row win, draw a single hand-drawn line through the winning marks. A draw leaves the completed board visible with a short text result.

### 7.3. Typography, controls, and layout

- Use a readable handwritten style for the game title and small accent labels. Keep instructions, names, difficulty choices, scores, and buttons in clear readable text; do not bake text into artwork.
- Keep the board as the visual focus. Place a compact player/turn row above it and a small score row and essential actions nearby, leaving the rest of the page open.
- Controls should feel like simple notebook annotations: quiet text, light hand-drawn outlines, or underlines. Keep touch targets comfortable even when their visible styling is minimal.
- On mobile, use one centred page with the board, turn label, and primary actions within easy reach. On larger screens, preserve the same spacious composition rather than filling the margins with panels.
- Fit the overview, mode selection, computer/friend setup, room forms, gameplay, handover, and results into one viewport. Adapt spacing and board size to both width and height, including shorter laptop windows and phone landscape. Keep all essential controls visible and usable. Present rules in short notebook pages with Previous/Next controls; adjust the number of rules per page to the available space.
- Carry the same paper, ink, and handwritten accents through the overview, mode selection, difficulty setup, rules, and result states.

### 7.4. Computer and friend presentation

- Reuse the same notebook board and visual language across supported modes.
- In Play Computer, show the human's name or "You", the label "Computer", their current X/O marks, and a quiet "Computer is thinking" status while a move is pending. Difficulty selection uses the same understated paper controls.
- In Pass-and-Play, show the two optional player names and a clear label such as "Alex's turn". Indicate the active player with a small ink underline or outline and show the handover prompt on the same notebook page.
- Keep scores attached to player identity when X/O ownership alternates on a rematch. Turn and result messages remain readable text rather than relying only on ink colour.

### 7.5. Hand-drawn animations

- When a fresh board appears, briefly reveal the four grid lines as if a pencil is drawing them across the paper. Do not continuously wobble or redraw the finished grid.
- Animate an accepted X in two short drawing strokes and an accepted O in one continuous loop. The motion should follow the stroke path, giving the impression that the player just drew the mark.
- Draw the winning line in one brief continuous stroke, then show the result quietly beside the board. Use restrained ink or underline feedback for buttons and the active turn.
- A rematch clears the previous marks and returns to a fresh notebook grid with a short, gentle transition.
- Keep all animation brief, planar, and non-blocking. Record an accepted move immediately; visual drawing must not add artificial computer delays or hold up the next turn or handover.
- Respect reduced-motion preferences by displaying the completed grid, marks, and winning line immediately without drawing transitions.

### 7.6. Artwork approach

Use lightweight flat SVG or equivalent 2D drawing paths for the grid, X/O marks, winning line, and subtle control accents. Keep stroke styling consistent across these elements. The notebook identity should come from the paper, spacing, typography, and hand-drawn strokes; elaborate background artwork or character assets are unnecessary.

## 8. Current implementation and backend deferral

- Every notebook screen occupies one dynamic viewport on desktop and phone layouts. The play flow explicitly shows Choose, Set up, and Play steps. The board uses the remaining game area; the handover button shares the action row to keep the layout stable. Rules use short notebook pages.
- The pure TypeScript engine, local computer worker, and optional browser persistence live in `src/games/tic-tac-toe/`. Notebook screens and reusable SVG strokes live in `src/components/tic-tac-toe/`.
- Local modes support all difficulty/mark choices, optional names, handover confirmation, wins/draws, resignation, identity-based scores, alternating-X rematches, and saved-round recovery.
- Caveat is bundled locally with its SIL Open Font License for handwritten headings. Visible horizontal ruling, wavy grid paths with a slight left lean, and irregular X/O pen strokes establish the notebook style. Grid, marks, winning lines, and controls use flat SVG/HTML, with reduced-motion alternatives.
- Public metadata lists only the two implemented modes and rules version `1.0.0`. The rules page and public rules JSON share the same source. The rules page is indexed; play and invite URLs are not.
- On 9 November 2026, the user explicitly requested that Firebase/backend work remain unchanged until they provide Firebase details. The online requirements in sections 4–6 remain the future contract; current room screens are interface preparation, not an operational online service.
- Run `npm run check` for lint, types, meaningful engine/persistence tests, and a production build. Browser verification covers the hero, setup steps, local games, handover, rematches, reload, blocked storage, keyboard input, reduced motion, and prepared room forms.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
