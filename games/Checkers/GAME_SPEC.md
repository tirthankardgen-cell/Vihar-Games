**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/checkers](https://games.vihar.online/checkers)  
**Open endpoint:** `GET /api/games/checkers` → `/checkers`  
**API base:** `/api/games/checkers`  
**Project:** Vihar Games; one shared Vercel deployment.

# Checkers — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Required modes:** Computer opponent, pass-and-play, and private online room.  
**Match format:** English draughts / American checkers with explicit casual draw rules.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Block Print Cloth; an indigo-and-cream board with a restrained textile border, flat terracotta and ivory counters, and printed crown symbols.

## 1. Game and objective

Players move diagonally and capture opposing pieces by jumping over them. A player wins when the opponent has no pieces remaining or cannot make a legal move. This release uses an 8 × 8 board; international 10 × 10 draughts has different rules and is a separate variant.

## 2. Exact rules

- Each player starts with 12 uncrowned pieces on the playable alternating squares of their nearest three rows. The middle two rows are empty. The first assigned side moves first; alternate side ownership on rematches.
- An uncrowned piece moves one diagonal square forward into an empty playable square. It cannot make ordinary backward moves.
- An uncrowned piece captures forward by jumping over one adjacent opposing piece to the empty playable square immediately beyond it. Remove the captured piece.
- A king moves one diagonal square forward or backward, and captures by the same adjacent-piece jump in either direction. Kings do not fly across multiple empty squares.
- Captures are mandatory across the entire side: if any piece can capture, no ordinary move is legal.
- If several captures are available, the player may choose any one; capturing the greatest number is not required.
- After a capture, continue with the same piece if another legal capture is available. A multi-jump is one turn and cannot switch to a different piece.
- Reaching the opponent's last row crowns an uncrowned piece. In this variant, reaching that row ends the turn immediately, even if the newly crowned king could capture backward.
- A turn ends only after its forced capture chain ends or crowning ends it. The other player then moves.
- No remaining pieces or no legal moves loses, even if the losing side still owns pieces.
- Use the following product draw rules: automatic draw after the same completed-turn position with the same side to move occurs three times, or after 80 consecutive completed turns, 40 per side, without a capture or an uncrowned-piece move. Reset this counter on either event. These are declared casual rules.
- A win caused by the final move takes precedence over the draw counter. Both players may also agree to a draw. Resignation or online forfeit awards the opponent a win.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Checkers, or visit `/checkers` directly. Choose Play or How to Play.
2. Computer mode: choose Easy, Medium, or Hard and the first or second side, then start locally.
3. Pass-and-play: enter optional names and assign sides. The active player completes the entire forced jump sequence before the next person accepts handover on the same device.
4. Online: enter a nickname, create a two-person room, and share its six-character code or `https://games.vihar.online/checkers/play?room=ABC234`. A friend joins on their own device. The host starts when both seats are occupied.
5. Select a legal piece and move or capture. If continuing jumps are forced, finish them with the same piece. Apply crowning and evaluate legal moves for the next player.
6. End with a win, draw, resignation, or forfeit reason. Offer another local round or online Rematch/Return to Lobby. Both players accept before the host starts a rematch, with sides swapped by default.

## 4. Sessions, rooms, and interruptions

- Local modes require no backend. Save board state, side to move, draw history, and any active capture chain locally when possible; refreshing mid-chain restores the same forced piece.
- Online uses automatic persistent anonymous identities and two human seats. Rejoining in the same browser restores the seat and any unfinished forced jump sequence.
- Disconnect blocks submissions. After 120 seconds disconnected, or 120 seconds of current-turn inactivity since the last accepted action or turn start, the opponent may request a server-validated forfeit. Explicit resignation is immediate.
- Host leaving a lobby transfers hosting. During a match, the remaining player may request host transfer after the grace period. New seats and settings changes require the lobby.
- Rooms expire after 24 inactive hours. If both people disconnect, preserve the recoverable match until expiry without assigning a result.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML/SVG board, flat discs, and flat crown marks. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Use a pure TypeScript engine for global mandatory-capture detection, step validation, forced-chain state, crowning, terminal positions, and draw history. The same rules serve all modes.
- Store playable-square ownership, king status, actor, forced capture piece, completed-turn count, repetition keys, no-progress count, draw offer, result, action IDs, and revision. Record repetition only at completed-turn boundaries.
- Online follows Gulam Chor with Firebase anonymous identity, Realtime Database, and Vihar Games Node.js API route handlers at `/api/games/checkers/rooms/<code>/actions`. Validate each submitted step, actor, and revision atomically; a partial capture chain cannot pass the turn.
- Run stronger computer search in a browser worker and bound its computation. Search must evaluate full legal turn sequences, including mandatory multi-jumps. Cancel it when a game is reset or left.
- Mount the game overview at `/checkers`, mode selection and play at `/checkers/play`, and rules at `/checkers/how-to-play`. Selecting the game in the shared catalog opens `/checkers`.
- `GET /api/games/checkers` redirects to the game overview. `GET /api/games/checkers/info` returns catalog metadata and supported modes; `GET /api/games/checkers/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/checkers/rooms`, join through `POST /api/games/checkers/rooms/<code>/join`, read member-visible state through `GET /api/games/checkers/rooms/<code>`, and submit mutations through `POST /api/games/checkers/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/checkers/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:checkers:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/checkers`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All modes complete matches without sign-in on touch and desktop devices.
- Verify mandatory captures by another piece, alternative jump choices, forced multi-jumps, blocked landings, backward king captures, and forbidden backward uncrowned captures.
- Verify crowning ends the turn, immobilization loses, draw history uses completed turns, and no-progress counters reset correctly.
- Reconnect or refresh mid-chain restores the forced piece; duplicate commands cannot capture a piece twice or skip a jump.
- Both online browser profiles agree on king status, next actor, and result. Shared-device handover occurs only after a full turn.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/checkers`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/checkers` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Block Print Cloth presentation keeps playable squares, piece ownership, crowns, mandatory captures, and multi-jump destinations clear on mobile and desktop; all move and capture feedback follows the exact Checkers rules.

## 7. Detailed 2D visual direction — Block Print Cloth

### 7.1. Mood and palette

The game should feel like a traditional checkerboard printed on a neatly spread cloth. Use a small amount of textile character around a calm, readable strategy board.

- Alternate indigo and cream squares, with terracotta and ivory counters for the two sides.
- Use a restrained block-print border and very faint cloth texture. Patterns belong outside the playable squares.
- Keep outlines and text dark enough to read clearly on cream, and use cream text on indigo where needed.
- The board, counters, crowns, and decorative print remain flat; kings use a symbol rather than a raised stack of pieces.

### 7.2. Board, counters, and kings

- Use the exact 8 × 8 layout, with the darker indigo squares as the playable cells and the starting arrangement from section 2.
- Draw each counter as a simple flat circle with a thin boundary and a small printed detail.
- Give the two sides distinct colour and centre treatments so ownership is readable without colour alone.
- A crowned piece carries a clear small crown icon. Its symbol stays visible when selected and throughout a capture sequence.
- Mark the selected counter with an outline and legal destinations with quiet dots or rings. Keep the original board squares visible beneath these marks.
- During mandatory capture, show the currently legal capturing pieces and destinations. After a jump, continue to identify the same piece when another capture is required.

### 7.3. Pages, typography, and layout

- Carry the indigo, cream, terracotta, and block-print accents through the overview, setup, rules, board, and results.
- Use a modest decorative title with clear live text for names, side ownership, difficulty, scores, and move explanations.
- Place the player/turn row above the board and essential actions beside or below it. Keep the cloth border narrow.
- On phones, preserve comfortably sized cells and clear crown icons. Reduce decorative border width before reducing board legibility.
- Keep the board orientation stable during pass-and-play and identify forward movement and active ownership clearly.
- Provide keyboard focus, selectable-piece labels, legal-destination descriptions, and result text alongside visual highlighting.

### 7.4. Modes and gameplay states

- Computer, pass-and-play, and private rooms use the same cloth board and counters.
- Label the computer and selected difficulty clearly; keep its thinking status compact.
- When captures are available, show a concise "Capture required" message. During a chain, show that the current player must continue with the same piece.
- Crown only when the rules engine reports promotion. In this variant, crowning ends the turn immediately; visual feedback must follow that rule.
- Change the active-player indicator only when a completed turn actually ends. Keep side ownership and session scores attached to player identity on rematches.
- Explain wins by no pieces or no legal moves, normal draws, agreed draws, resignation, and forfeits with the correct text reason.

### 7.5. Animation and feedback

- Ordinary moves slide between diagonal cells. Captures use a short planar jump or movement along the accepted capture path.
- Fade each captured counter after its capture is accepted, and briefly stamp the crown symbol when a piece is promoted.
- Keep multi-jump feedback connected to the same selected piece; animation does not offer an extra move or a choice forbidden by mandatory capture.
- Use a quiet active-player underline and result label. Keep decorative motion brief and independent of rule resolution or computer search.
- Respect reduced-motion preferences by showing accepted positions, removed counters, and crowns immediately, with a concise move summary.
- Clear obsolete move previews and playback when restarting, restoring, or leaving a match.

### 7.6. Planned artwork handoff

Prepare the flat checkerboard, a narrow block-print border, subtle cloth texture, two counter treatments, crown symbols, and selection/capture markers. Use lightweight HTML/SVG or Canvas 2D graphics. Textile artwork is a planned accent and must not obscure the board or resemble additional counters.
