**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/connect-four](https://games.vihar.online/connect-four)  
**Open endpoint:** `GET /api/games/connect-four` → `/connect-four`  
**API base:** `/api/games/connect-four`  
**Project:** Vihar Games; one shared Vercel deployment.

# Connect Four — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Required modes:** Computer opponent, pass-and-play, and private online room.  
**Match format:** Standard seven-column, six-row Connect Four.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Retro Toybox; a flat blue frame, circular slots, coral and mustard discs, rounded lettering, and a warm cream background.

## 1. Game and objective

Two players alternate dropping one token into a column. Tokens occupy the lowest empty cell in that column. The first player to connect four of their own tokens horizontally, vertically, or diagonally wins.

## 2. Exact rules

- Use seven columns and six rows, for a total capacity of 42 tokens. Start with an empty board.
- Assign distinct token ownership to the two seats. Choose the opening player randomly or explicitly in local setup; alternate the opening player on rematches.
- A move chooses exactly one non-full column. The token falls to the lowest empty cell; a player cannot choose a higher empty cell or replace an existing token.
- A full column is not a legal move. Reject that input without consuming the turn.
- Four or more contiguous own tokens in a horizontal, vertical, or diagonal line win immediately.
- Check for a win before a full-board draw. A last move that fills the board and creates four in a row wins.
- A board with 42 tokens and no winning line is a draw. There are no removals, swaps, or takebacks in the standard round.
- Keep session wins and draws. Resignation or claimed online forfeit is an opponent win, recorded with its own reason.
- Easy computer play may choose any legal column; Medium prefers immediate wins and blocks; Hard searches more deeply. Hard is a stronger opponent, not a promise of perfect play over every position.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Connect Four, or visit `/connect-four` directly. Choose Play or How to Play.
2. Computer mode: choose difficulty and whether to move first, then start a local round.
3. Pass-and-play: enter optional player names, choose the first player, and start on one device. After each token is committed, the other person accepts the handover.
4. Online: create a room with a nickname and share its six-character code or `https://games.vihar.online/connect-four/play?room=ABC234`. A friend joins on their own device. The host starts when both human seats are occupied.
5. On your turn, choose a non-full column. Resolve placement, win/draw conditions, and the next actor.
6. Show the result and session score. Offer another local round or online Rematch/Return to Lobby. Both players accept an online rematch before the host starts; alternate who moves first.

## 4. Sessions, rooms, and interruptions

- Local modes require no backend or guest identity. Save the current round and session score locally if storage is available; blocked storage does not prevent play.
- Online automatically creates persistent anonymous guest identities. Exactly two human seats are allowed; reconnecting in the same browser restores seat ownership and accepted state.
- Disconnected clients cannot submit moves. A connected opponent can request forfeit after a 120-second disconnect grace period or 120 seconds of current-turn inactivity since the last accepted action or turn start. Explicit resignation forfeits immediately.
- Host duties transfer on lobby departure. The remaining player can request host transfer after a mid-game disconnect grace period. Seat changes and settings require the lobby.
- Rooms expire after 24 inactive hours. If both people disconnect, retain the recoverable round until expiry without declaring a winner.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML/SVG grid and flat token circles. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Keep column legality, gravity placement, winning-line detection, turn order, and score updates in a pure TypeScript engine shared by all modes.
- Store cell ownership, column heights, seat order, actor, opening seat, round, score, result reason, revision, and action IDs. Check winning lines from the last placement.
- Run deeper computer search in a browser worker with bounded thinking time; cancel a pending search on reset, finish, or navigation.
- Online uses Firebase anonymous identity, Realtime Database listeners, and Vihar Games Node.js API route handlers at `/api/games/connect-four/rooms/<code>/actions`. Validate membership, actor, column, action ID, and expected revision atomically. The server chooses the landing row.
- Mount the game overview at `/connect-four`, mode selection and play at `/connect-four/play`, and rules at `/connect-four/how-to-play`. Selecting the game in the shared catalog opens `/connect-four`.
- `GET /api/games/connect-four` redirects to the game overview. `GET /api/games/connect-four/info` returns catalog metadata and supported modes; `GET /api/games/connect-four/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/connect-four/rooms`, join through `POST /api/games/connect-four/rooms/<code>/join`, read member-visible state through `GET /api/games/connect-four/rooms/<code>`, and submit mutations through `POST /api/games/connect-four/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/connect-four/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:connect-four:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/connect-four`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All modes complete wins and draws on mobile and desktop without registration.
- Verify all four line directions, lines longer than four, full-column rejection, and correct placement into partially filled columns.
- Verify a winning 42nd move is not classified as a draw; no move is accepted after a result.
- Two browser profiles agree on placement and turn, with no duplicate token or score after retries.
- Refresh, local handover, rematch, and online reconnect preserve correct seat ownership.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/connect-four`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/connect-four` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Retro Toybox presentation clearly distinguishes empty slots, both players' discs, legal/full columns, the actual landing cell, and every winning line on mobile and desktop; decorative drops never change accepted placement.

## 7. Detailed 2D visual direction — Retro Toybox

### 7.1. Mood and palette

The game should feel like a familiar childhood board game with cheerful colours and a tidy, modern composition.

- Use a warm cream background, a muted blue frame, coral discs for one player, and mustard discs for the other.
- Keep lettering rounded and friendly, with small colour accents on controls and player labels.
- Leave the surrounding page open so the slot grid and its two player colours dominate.
- The frame, slots, and discs are flat graphics. Do not imply depth through hole shadows, bevels, raised plastic, or a perspective stand.

### 7.2. Board, discs, and column selection

- Render exactly seven columns and six rows as a clear rectangular frame containing evenly spaced circular slots.
- Empty slots use a pale neutral fill. Occupied slots contain a clearly bounded coral or mustard disc.
- Add a small ring or centre symbol to distinguish ownership independently of colour; carry the same symbols into player labels.
- Show a subtle preview above a legal selected column and make the entire column target usable on touch devices.
- Full columns have a clear unavailable state and readable feedback; their selection cannot consume a turn.
- After placement, outline the actual contiguous winning run reported by the game. Preserve longer-than-four winning lines and distinguish a draw from a win.

### 7.3. Pages, typography, and layout

- Carry the cream, blue, coral, and mustard palette through the overview, difficulty setup, rules, board, and result screens.
- Use a rounded display title with readable live text for names, difficulty, scores, turn status, and room controls.
- Place two compact player badges above the board, with an active-player underline and a small session score row.
- Keep the board and column controls centred on phones. Preserve its seven-by-six proportions and provide comfortable column targets without adding narrow ornamental controls.
- On wide screens, retain the same arrangement and spacing; room and rematch controls remain secondary to the board.

### 7.4. Modes and gameplay states

- Computer, pass-and-play, and private rooms share the same frame and disc styling.
- Computer setup shows Easy, Medium, or Hard and the opening-player choice. A quiet thinking label identifies a pending computer move.
- Pass-and-play uses player names and the active disc symbol, with the handover prompt placed on the same cream page.
- Keep disc ownership, opening-player alternation, current actor, and session wins/draws readable after a rematch.
- Show column previews only for valid current-player input. Finish states keep the final board visible and disable further placement.
- A resignation or forfeit has its own result text rather than a fabricated four-disc highlight.

### 7.5. Animation and feedback

- An accepted disc drops vertically into its computed lowest empty slot, followed by one small settling bounce.
- The bounce stays within the landing slot and is decorative; it cannot imply a second placement, rearrange existing discs, or change the accepted landing row.
- Fade in a simple outline around the winning run. Use brief underline transitions for player changes and gentle feedback for unavailable columns.
- Keep placement, turn advancement, and result evaluation independent of decorative motion. Drawing feedback must not add an artificial computer delay or hold up handover.
- Respect reduced-motion preferences by showing discs in their accepted slots immediately and using static selection and winning outlines.
- Cancel stale previews and animations when a round is restarted or left.

### 7.6. Planned artwork handoff

Prepare a flat frame/slot treatment, two patterned disc symbols, player badges, column-preview indicators, and winning outlines. Build the board with lightweight HTML/SVG graphics and accessible live text controls. The theme needs simple reusable shapes rather than elaborate background artwork.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
