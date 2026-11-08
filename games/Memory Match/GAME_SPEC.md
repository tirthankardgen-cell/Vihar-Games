**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/memory-match](https://games.vihar.online/memory-match)  
**Open endpoint:** `GET /api/games/memory-match` → `/memory-match`  
**API base:** `/api/games/memory-match`  
**Project:** Vihar Games; one shared Vercel deployment.

# Memory Match — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One in solo mode, or 2–4 human players.  
**Required modes:** Solo puzzle, pass-and-play, and private online room.  
**Match format:** Find all matching pairs using memory.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Illustrated Keepsakes; cream picture cards with identical patterned backs, simple everyday-object illustrations, muted colours, and gentle flat face changes.

## 1. Game and objective

An even set of hidden cards contains pairs of identical identities. Reveal two cards per attempt. A matching pair stays matched; a mismatch becomes hidden again. Solo players clear the board using as few attempts and as little active time as possible. Multiplayer players compete for the most matched pairs.

## 2. Exact rules

- Offer Easy with 12 cards / 6 pairs, Medium with 20 cards / 10 pairs, and Hard with 30 cards / 15 pairs. Every identity appears exactly twice; shuffle once at the start.
- An attempt reveals two distinct, currently unmatched cards. A matched card cannot be selected again, and the second selection cannot be the same index as the first.
- Only one attempt can be pending. After the first reveal, allow the second selection; after the second reveal, block a third card until the pair resolves.
- Matching identities become permanently matched. In solo, continue the puzzle; in multiplayer, award one point and keep the same player's turn.
- A mismatch is available for observation for 1.5 seconds before it can be concealed. In multiplayer, after concealment, advance to the next active seat. In solo, the same person continues.
- Multiplayer mismatch timing uses an accepted server timestamp. At or after the deadline, a connected member requests resolution; the server validates the deadline and advances once. Do not depend on an always-running room timer.
- Count one attempt only when the second card is accepted. A partial attempt does not count as a completed attempt.
- Finish when every pair is matched. Solo records attempts and active time. Multiplayer compares point totals; all players tied for the highest score share the win. Do not invent a tiebreaker.
- Keep unmatched identity assignments hidden until legitimately revealed. Previously revealed cards may be remembered; intentionally exposing the full hidden deck to online clients is forbidden.
- No reshuffle, hint, or undo occurs during a competitive multiplayer round. A solo Restart starts a new shuffled run and resets attempts and elapsed time.
- Pause exists in solo mode and conceals unresolved cards until resume without changing their saved identities. Freeze any remaining mismatch-observation time while paused, and restore it on resume. Multiplayer has no private pause that freezes every participant's game.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Memory Match, or visit `/memory-match` directly. Choose Play or How to Play.
2. Solo: choose a difficulty and start immediately without a nickname or room. Reveal pairs until the puzzle is complete.
3. Pass-and-play: enter optional names for 2–4 people, choose difficulty, and start on one device. Matching pairs keep the current person active. After a mismatch resolves, the next person accepts the handover.
4. Online: enter a nickname, create a room with capacity 2–4, choose difficulty, and share its six-character code or `https://games.vihar.online/memory-match/play?room=ABC234`. Friends join from their own devices. The host starts with 2–4 humans present.
5. On your turn, choose a first card and then a different second card. Resolve the pair, update attempts or score, and either keep or pass the turn.
6. Finish with solo attempts/time or multiplayer pair totals and winners. Offer a new solo puzzle or local match; online Rematch requires all continuing players to accept before the host starts a fresh shuffle. Return to Lobby permits settings and player changes.

## 4. Sessions, rooms, and interruptions

- Solo and pass-and-play need no online service or guest identity. Save the shuffle, matched pairs, scores, actor, pending reveal, remaining local observation time, attempts, elapsed solo time, and pause state locally if storage is available. A refresh restores the same layout.
- Online automatically creates persistent anonymous guest identities. Same-browser reconnect restores seat, public matched cards, legitimate current reveals, scores, and actor; unrevealed identities remain private.
- If someone disconnects after the second reveal, the accepted pair still resolves once. If only their first card is revealed, preserve it during the reconnect grace period; on abandonment, conceal it without awarding a point or counting an attempt.
- A connected participant may request abandonment after a 120-second disconnect or current-turn inactivity period since the last accepted action or turn start. An explicit departure acts immediately. Retain earned scores, mark that seat inactive, and advance after any accepted pair resolution.
- With two active players, one abandonment gives the other a forfeit win. In larger matches, continue with remaining seats; if only one remains, they win by forfeit. At a normally completed larger match, compare all recorded scores, including departed seats, and allow tied winners.
- Transfer hosting on lobby departure. During play, connected members can request host transfer after the grace period. New seats and difficulty changes require the lobby.
- Rooms expire after 24 inactive hours. If everyone disconnects, retain the recoverable round until expiry without declaring a result. Solo time counts only while the resumed puzzle is visible; backgrounding pauses until explicit resume.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML/SVG flat cards with immediate face changes or 2D opacity transitions. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Use a pure TypeScript engine for selection legality, pair resolution, scores, turn order, abandonment, and completion. Generate valid pair sets and shuffle uniformly.
- Store the deck mapping privately online. Public room state contains matched identities, indices and identities of legitimately revealed cards, actor, scores, attempt phase, resolution deadline, result, action IDs, and revision. No client-readable snapshot contains every unmatched identity.
- Online uses Firebase anonymous identity, Realtime Database, and Vihar Games Node.js API route handlers at `/api/games/memory-match/rooms/<code>/actions`. The server accepts card indices, verifies actor and revision, reveals only the selected identity, and resolves each pair atomically.
- A mismatch resolver checks server time and deduplicates concurrent requests. Browser timers may trigger a resolution request but cannot authoritatively advance the turn or score.
- Block third selections during resolution. Cancel pending local timers on restart or leave, and restore pending attempts safely after refresh rather than reshuffling.
- Mount the game overview at `/memory-match`, mode selection and play at `/memory-match/play`, and rules at `/memory-match/how-to-play`. Selecting the game in the shared catalog opens `/memory-match`.
- `GET /api/games/memory-match` redirects to the game overview. `GET /api/games/memory-match/info` returns catalog metadata and supported modes; `GET /api/games/memory-match/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/memory-match/rooms`, join through `POST /api/games/memory-match/rooms/<code>/join`, read member-visible state through `GET /api/games/memory-match/rooms/<code>`, and submit mutations through `POST /api/games/memory-match/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/memory-match/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:memory-match:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/memory-match`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- Solo, 2–4 person local, and 2–4 person online modes complete rounds without registration on mobile and desktop.
- Verify every preset has exactly two copies per identity, same-card rejection, matched-card rejection, third-card blocking, matching extra turns, and mismatch turn changes.
- Verify attempt counting, final-pair completion, tied highest scores, and departed-seat scores in a normally completed larger match.
- Online clients cannot read unrevealed deck identities. Two browsers agree on accepted reveals and scores; concurrent mismatch resolvers advance only once.
- Refresh preserves the shuffle; reconnect after one or two reveals restores the correct phase; abandonment clears only an unfinished first reveal.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/memory-match`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/memory-match` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Illustrated Keepsakes presentation keeps all difficulty layouts, identical hidden backs, distinct picture identities, matched pairs, observation timing, and 2–4-player turn/score states clear; card transitions remain 2D and never expose unrevealed identities.

## 7. Detailed 2D visual direction — Illustrated Keepsakes

### 7.1. Mood and palette

The game should feel like opening a small collection of friendly picture cards. Everyday illustrations provide the personality, with a quiet paper layout and warm, muted colours.

- Use cream cards and a warm off-white page, with muted coral, mustard, leaf green, and blue illustration accents.
- Give illustrations simple shapes, a consistent line weight, and a lightly printed or hand-painted flat treatment.
- Use a small repeating pattern on card backs. Every hidden card has exactly the same visible back treatment.
- Keep cards, borders, illustrations, and face changes flat, with no perspective, raised stacks, or 3D flip effect.

### 7.2. Picture identities, card backs, and grid

- Prepare at least 15 clearly distinct picture identities for the Hard preset, using everyday subjects such as mangoes, kites, chai cups, birds, flowers, or umbrellas.
- A pair uses the same illustration twice. Avoid pairs that depend only on a slight colour difference or nearly identical silhouettes.
- Use the exact 12-, 20-, and 30-card presets from section 2, with stable positions for the entire run or round.
- Centre each illustration within a simple cream card outline, leaving enough space for clear selection and matched-state markers.
- Hidden backs, hover styling, loading behaviour, and accessible labels must not reveal the concealed identity.
- Keep matched pairs face up with a gentle outline or small corner checkmark. They remain distinguishable and cannot be selected again.

### 7.3. Pages, typography, and layout

- Carry the cream paper, muted illustration palette, and back pattern through the overview, difficulty setup, rules, board, pause, and results.
- Use a friendly title with readable live text for difficulty, attempts, active time, player names, points, and turn status.
- In solo, place attempts and active time above the cards. In multiplayer, use a compact 2–4-player row with pair totals and an active-player underline.
- On phones, choose a grid arrangement that keeps pictures and touch targets readable. Allow vertical scrolling for larger presets while preserving card order and indices.
- On wider screens, give the grid more columns and generous space; responsive rearrangement must retain each card's identity and logical position.
- Use accessible labels such as "Card 7, face down" until a legitimate reveal makes its picture name available.

### 7.4. Modes and pair states

- Solo, pass-and-play, and private rooms share the same card set and paper styling.
- Show the first revealed card distinctly, permit the second valid selection, then reflect the documented pending-pair state.
- A match receives the gentle matched marker; multiplayer adds one point and keeps the same player active.
- A mismatch keeps both pictures available for the existing 1.5-second observation period, then conceals them and advances the multiplayer turn exactly once.
- Place the pass-and-play handover prompt on the same paper page after pair resolution. Use names and text to identify the next player.
- Solo pause conceals unresolved cards and displays a clear Resume action, preserving identities and remaining observation time.
- Completion shows solo attempts/time or multiplayer pair totals and all tied winners, with no invented tiebreaker.

### 7.5. Animation and feedback

- Reveal and conceal faces through a brief flat fade or immediate 2D face change. Keep card positions and outer outlines stable.
- Matching pairs receive a soft outline or corner checkmark, with a quiet score update.
- First-card animation must not delay the valid second selection. After the second selection, the rules still prevent a third card until resolution.
- Honour the existing mismatch-observation deadline; transitions must not shorten the picture-viewing period or add a separate waiting phase.
- Respect reduced-motion preferences by changing faces and matched markers immediately while preserving the required observation time.
- Keep accepted pair resolution, scoring, and turn advancement independent of decorative feedback, and cancel obsolete transitions on restart or navigation.

### 7.6. Planned artwork handoff

Prepare a consistent set of at least 15 flat illustrations, one universal card-back pattern, cream card outlines, and selection/match markers. Use lightweight SVG illustrations within accessible HTML/SVG card controls. Keep the concealed card-index-to-identity mapping private online; expose a card's identity and accessible picture name only after a legitimate reveal or match. These picture assets remain future production work.
