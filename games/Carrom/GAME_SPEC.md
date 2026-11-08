**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/carrom](https://games.vihar.online/carrom)  
**Open endpoint:** `GET /api/games/carrom` → `/carrom`  
**API base:** `/api/games/carrom`  
**Project:** Vihar Games; one shared Vercel deployment.

# Carrom — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, two humans, or one-person practice.  
**Required modes:** Computer opponent, practice, pass-and-play, and private online room.  
**Match format:** Singles, one board, with the explicit casual rules below.

## 1. Game and objective

Players take turns striking coins into pockets. Each player owns nine coins of one color. A shared queen must be pocketed and covered. The first player to clear their nine coins after the queen is covered wins the board. This is a defined casual variant rather than a claim to implement every tournament rule.

## 2. Exact rules

- Begin with nine coins for each side, one queen, and one striker. Use a standard carrom starting arrangement. Assign the two coin sets before the board begins; choose the opening player randomly, then alternate opening players on rematches.
- The active player places the striker on their baseline, chooses direction and power, and confirms one shot. Between the end circles, the striker must touch both baseline lines; when placed on an end circle, it must cover that circle completely and avoid the diagonal arrow line. Placement cannot overlap a coin. No shot begins while objects from the previous shot are moving.
- A shot resolves only when all objects have stopped and its coin pockets and fouls have been classified. Reposition the striker for each new shot.
- Pocketing at least one own coin in a legal shot earns another turn. Pocketing only an opponent's coin leaves it pocketed and passes the turn. Pocketing nothing also passes the turn.
- A player can pocket the queen only after they have already pocketed at least one own coin in an earlier legal shot and still have at least one own coin remaining.
- Pocketing the queen with at least one own coin retained after debt repayment in the same legal shot covers it immediately. Pocketing the queen without a retained own coin grants one immediate cover attempt; the next shot must legally pocket and retain at least one own coin after debt repayment.
- If the cover attempt fails or is a foul, return the queen to the center, or the nearest unoccupied legal spot, and end the turn. After a successful cover, the queen stays pocketed and is recorded as covered by that player; either player can then win by clearing their own set.
- Pocketing the queen before becoming eligible returns it and ends the turn. Own coins from that shot also return; opponent coins remain pocketed unless needed to prevent a premature result.
- Pocketing the last own coin while the queen remains uncovered does not win. Return that last coin and end the turn. If the queen and last own coin are legally pocketed together while eligible, the queen is covered and the player wins.
- Pocketing the striker or sending any coin or striker out of bounds is a foul. Return all own coins and any queen pocketed in that shot, return ejected coins, and end the turn. Opponent coins legally pocketed during the shot stay down, subject to the uncovered-queen rule.
- A foul additionally returns one previously pocketed own coin as a penalty. If no previously pocketed own coin is available, record a one-coin debt; the next own coin pocketed is returned to pay it. Debts accumulate. In a legal shot, return as many newly pocketed own coins as needed to repay outstanding debt before checking queen cover, extra turns, or victory. A shot that only pays debt earns no extra turn unless it grants the queen's one cover attempt.
- If an opponent's final coin is pocketed while the queen is covered, the opponent wins after fouls and penalties resolve, unless a legal shot also completes the shooter's set; in that simultaneous completion case, the shooter wins. If the queen is uncovered, return any would-be final coin and continue.
- Returned pieces use a deterministic nearest-free placement procedure, starting at the center, without overlap. A foul never grants a win before penalties are applied.
- Keep the first release to singles and one-board matches. Doubles and tournament point scoring are separate future variants.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Carrom, or visit `/carrom` directly. Choose Play or How to Play.
2. Computer mode: choose Easy, Medium, or Hard, accept a coin assignment, and begin locally. Practice mode allows repeated shots without an opponent, turn limit, or win/loss result.
3. Pass-and-play: enter optional names and begin a two-person local board. The current player takes any earned extra shots before handing over; the next player accepts the handover.
4. Online: create a room with a nickname, share its six-character code or `https://games.vihar.online/carrom/play?room=ABC234`, and wait for one friend. The host starts when both seats are filled.
5. On each turn, place the striker, aim, choose power, and confirm. Wait for the complete accepted shot result before the next action.
6. Apply own-coin progress, queen eligibility and cover, fouls, debts, and the next turn automatically. Explain the rule reason for each foul or returned coin.
7. End with the winning player or forfeit reason. Offer another board, or return to the online lobby. Both online players accept before the host begins a rematch.

## 4. Sessions, rooms, and interruptions

- Computer, practice, and shared-device modes run locally with no room code or online identity. Save only settled positions; refreshing during a local shot restores the preceding settled state and permits that shot to be retaken.
- Online uses automatic persistent anonymous guest identities, two human seats, and server-owned settled state. Restoring the same browser restores the same seat.
- If a player disconnects after submitting a shot, the server still completes that accepted shot once. The player recovers its outcome on reconnect; a lost response cannot authorize a second shot.
- A connected opponent can claim forfeit after 120 seconds of disconnect, or 120 seconds of current-turn inactivity since the last accepted action or turn start. Explicit resignation ends the board immediately; no random shot is played for an absent person.
- Transfer the lobby host when they leave. During a match, the remaining player may request host transfer after the grace period. Settings and seat replacement are lobby-only.
- Rooms expire after 24 inactive hours. If both people disconnect, retain the recoverable board until expiry rather than assigning a winner.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Separate a pure rules engine from a deterministic physics engine. Store settled positions, coin ownership, pocketed sets, queen status, cover claimant, penalty debts, actor, round, revision, and result.
- Physics uses a fixed timestep and the same parameters for collisions, cushions, friction, and pocket detection in every mode. Bound each simulation. If a shot cannot settle within the defined simulation limit, restore its prior state and reject it without consuming the turn.
- For online play use Firebase anonymous identity, Realtime Database, and Vihar Games Node.js API route handlers at `/api/games/carrom/rooms/<code>/actions`. Submit striker placement, direction, power, action ID, and expected revision; the server validates and simulates the complete shot and atomically commits the final result. Client-submitted pocket lists are not authoritative.
- Use workers for browser physics and computer shot search. Bound server simulation to fit the configured Vercel Node.js function duration. Send shot commands and settled results rather than continuous network updates for every moving object.
- Keep online operations retry-safe; no new shot is accepted against an unsettled or stale state. No spin controls or complex tournament fouls are added without defining their rules.
- Mount the game overview at `/carrom`, mode selection and play at `/carrom/play`, and rules at `/carrom/how-to-play`. Selecting the game in the shared catalog opens `/carrom`.
- `GET /api/games/carrom` redirects to the game overview. `GET /api/games/carrom/info` returns catalog metadata and supported modes; `GET /api/games/carrom/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/carrom/rooms`, join through `POST /api/games/carrom/rooms/<code>/join`, read member-visible state through `GET /api/games/carrom/rooms/<code>`, and submit mutations through `POST /api/games/carrom/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/carrom/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. For shot simulation, calculate outside the transaction and commit only if its input revision is still current. An accepted shot means its complete settled outcome has been committed; after a lost response, recover that result by action ID before attempting another shot.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:carrom:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/carrom`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- Practice, computer, local two-player, and online two-player boards are playable on mobile and desktop without registration.
- Verify own-coin extra turns, opponent pockets, queen eligibility, same-shot cover, failed next-shot cover, uncovered final coins, striker fouls, and accumulated penalty debt.
- Verify simultaneous final coins, queen-plus-final-own-coin, legal returned-piece placement, debt repayment before queen cover, and penalty-before-winner resolution.
- Identical shot input and settled state produce matching outcomes in browser and backend. No overlapping pieces or duplicate pocket events remain after resolution.
- Two browsers agree on each settled result, and reconnect or retry cannot replay a committed shot.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/carrom`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/carrom` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
