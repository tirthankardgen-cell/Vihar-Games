**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/snakes-and-ladders](https://games.vihar.online/snakes-and-ladders)  
**Open endpoint:** `GET /api/games/snakes-and-ladders` → `/snakes-and-ladders`  
**API base:** `/api/games/snakes-and-ladders`  
**Project:** Vihar Games; one shared Vercel deployment.

# Snakes and Ladders — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** 2–4 seats; solo uses one human and 1–3 computer players.  
**Required modes:** Computer opponents, pass-and-play, and private online room.  
**Match format:** Race to square 100 on one fixed board.

## 1. Game and objective

Players roll a die and move along numbered squares. Landing on a ladder moves a player forward; landing on a snake moves them backward. The first player to land exactly on 100 wins. There is no strategy advantage for computer players: all seats follow the same random dice rules.

## 2. Exact rules

- Begin every token at position 0, outside the numbered path. Any die value allows entry: a first roll of four moves directly to square 4. No six-to-enter rule applies.
- Use a fair six-sided die. Each active player rolls once per turn in fixed seat order.
- Move forward by the rolled number. If the destination would exceed 100, remain on the current square and end the turn. Do not bounce backward.
- Landing exactly at a ladder's bottom moves immediately to its top. Landing exactly at a snake's head moves immediately to its tail. Passing over an endpoint does nothing.
- Use this fixed ladder map: `1→38`, `4→14`, `9→31`, `21→42`, `28→84`, `36→44`, `51→67`, `71→91`, and `80→100`.
- Use this fixed snake map: `16→6`, `47→26`, `49→11`, `56→53`, `62→19`, `64→60`, `87→24`, `93→73`, `95→75`, and `98→78`.
- All endpoints must be valid and non-conflicting. In this fixed map, a destination is never another snake head or ladder bottom, so each roll causes at most one snake or ladder traversal.
- Multiple players may occupy the same square. There are no captures, blockades, or movement restrictions caused by another token.
- Rolling six does not grant an extra turn. Snakes and ladders also do not grant extra turns.
- Reaching 100, including by the `80→100` ladder, wins immediately. Stop at the first winner.
- Online rolls are generated and fully resolved on the server as one atomic turn. A retry or refresh cannot change an accepted die value.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Snakes and Ladders, or visit `/snakes-and-ladders` directly. Choose Play or How to Play.
2. Computer mode: choose 2–4 total seats; one is human and the rest are bots. Start locally. Bots roll automatically on their turn without receiving favorable dice.
3. Pass-and-play: enter optional names for 2–4 people and start a local match. The current player rolls, movement resolves, and the next person accepts the handover.
4. Online: create a room with a nickname and capacity 2–4, then share its six-character code or `https://games.vihar.online/snakes-and-ladders/play?room=ABC234`. Friends join on their own devices. The host starts with 2–4 human players present.
5. On your turn, roll once. Resolve forward movement, any overshoot, one snake or ladder, and the next player.
6. On reaching 100, announce the winner. Offer another local match or online Rematch/Return to Lobby. Every continuing online player accepts before the host starts again.

## 4. Sessions, rooms, and interruptions

- Solo and shared-device matches require no backend or guest identity. Save positions, actor, and accepted roll history locally where storage is available; local storage failure must not block a match.
- Online automatically creates persistent anonymous guests. The same browser restores the same seat and the already accepted roll result on reconnect.
- A connected player may request abandonment after a 120-second disconnect or current-turn inactivity period since the last accepted action or turn start. An explicit departure abandons immediately. Remove that token and skip the seat on future turns.
- In a two-seat game, the other player wins by forfeit. In larger games, continue with remaining seats; a sole remaining seat wins by forfeit. Abandoned seats cannot re-enter until the lobby.
- Transfer host duties on lobby departure; connected members may request transfer after a host's mid-game disconnect grace period. Settings and seat replacement are lobby-only.
- Expire rooms after 24 hours without accepted activity. If all seats disconnect, leave the match recoverable until expiry without declaring a winner.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Implement a pure TypeScript turn resolver with the exact numbered path, endpoint maps, overshoot policy, seat order, and result. Use it in local and online modes.
- Store positions, active seats, actor, most recent accepted die, traversal reason, turn number, board-rules version, result, action IDs, and revision.
- Online uses Firebase anonymous identity, Realtime Database subscriptions, and Vihar Games Node.js API route handlers at `/api/games/snakes-and-ladders/rooms/<code>/actions`. The server generates uniform dice and atomically resolves the whole turn, validating actor and expected revision.
- Bots run locally with bounded delays and cancel pending rolls when a match ends or is left. Local gameplay needs no network requests after load.
- Mount the game overview at `/snakes-and-ladders`, mode selection and play at `/snakes-and-ladders/play`, and rules at `/snakes-and-ladders/how-to-play`. Selecting the game in the shared catalog opens `/snakes-and-ladders`.
- `GET /api/games/snakes-and-ladders` redirects to the game overview. `GET /api/games/snakes-and-ladders/info` returns catalog metadata and supported modes; `GET /api/games/snakes-and-ladders/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/snakes-and-ladders/rooms`, join through `POST /api/games/snakes-and-ladders/rooms/<code>/join`, read member-visible state through `GET /api/games/snakes-and-ladders/rooms/<code>`, and submit mutations through `POST /api/games/snakes-and-ladders/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/snakes-and-ladders/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:snakes-and-ladders:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/snakes-and-ladders`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All three modes complete matches for 2–4 seats on touch and desktop devices without registration.
- Verify first-roll entry, exact-100 victory, overshoot staying put, every map endpoint, passing an endpoint, and multiple tokens sharing a square.
- Verify that sixes and traversals do not create extra turns and that the ladder to 100 wins immediately.
- Duplicate requests do not produce another roll, and same-browser refresh restores the same seat and current state.
- Three- and four-person abandonment continues in the correct seat order; two-person abandonment awards a forfeit.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/snakes-and-ladders`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/snakes-and-ladders` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
