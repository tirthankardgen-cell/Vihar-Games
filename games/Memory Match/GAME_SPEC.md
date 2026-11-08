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
