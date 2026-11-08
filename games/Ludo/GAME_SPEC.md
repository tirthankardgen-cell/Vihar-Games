**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/ludo](https://games.vihar.online/ludo)  
**Open endpoint:** `GET /api/games/ludo` → `/ludo`  
**API base:** `/api/games/ludo`  
**Project:** Vihar Games; one shared Vercel deployment.

# Ludo — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** 2–4 seats; solo uses one human and 1–3 computer players.  
**Required modes:** Computer opponents, pass-and-play, and private online room.  
**Match format:** Individual play with four tokens per player and the fixed house rules below.

## 1. Game and objective

Players roll a six-sided die, bring tokens out of their yard, travel along a shared track, and enter their own home path. The first player to bring all four tokens home wins. Other household variants are not silently mixed into this ruleset.

## 2. Exact rules

- Support two, three, or four active seats in a fixed clockwise order. For a two-seat game use opposite starting positions. Assign each player four tokens in their yard.
- Define a 52-cell shared track indexed 0–51. The four starts are 0, 13, 26, and 39. Safe cells are exactly 0, 8, 13, 21, 26, 34, 39, and 47; use these same indices in every mode.
- A token needs a six to leave its yard. Entering places it on its start cell and consumes the roll; it does not also advance six cells.
- For each token, progress 0 is its start cell and progress 0–50 maps to `(start + progress) mod 52`. It then enters its six private home cells at progress 51–56; progress 56 is finished. This definition skips the shared cell immediately before its own start when entering home.
- After rolling, move exactly one eligible token by the rolled number. If several moves are legal, choose one. If none is legal, consume the roll automatically. Finished tokens cannot move, and a roll cannot overshoot progress 56.
- A legal six grants another roll, even if no token could move. Three consecutive sixes in one turn forfeit the third roll and end the turn; keep the moves already made using the first two sixes.
- Landing on a non-safe shared cell containing an opponent's token captures it and returns it to the yard. If several opposing tokens occupy that cell, capture all of them.
- Safe shared cells allow tokens from different players to coexist without captures. Same-player tokens can share any cell, but stacks do not form blockades and do not prevent another token from passing.
- Capturing at least one token or bringing a token home grants another roll. Multiple extra-turn reasons from one move grant one extra roll, not multiple queued turns.
- Only sixes count toward the consecutive-six count. Any accepted non-six roll resets that count, even if a capture or home finish extends the turn. Ending the turn also resets it.
- No capture is required before entering the home path. Private home paths cannot contain opponents and cannot be captured.
- Check for a winner immediately after a legal move: bringing the fourth token home ends the match before any extra roll. The first release stops at the first winner rather than continuing for ranks.
- Online dice are generated on the server. A roll is committed once and cannot be discarded or rerolled after refresh. Local dice use browser randomness; computer players receive no special dice advantage.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Ludo, or visit `/ludo` directly. Choose Play or How to Play.
2. Solo: choose a total of two, three, or four seats and a computer difficulty. Fill remaining seats with bots and start locally.
3. Pass-and-play: enter optional names for 2–4 people, assign starting positions, and begin on one device. Finish all extra rolls before the next person accepts the handover.
4. Online: enter a nickname, create a room with capacity 2–4, and share its six-character code or `https://games.vihar.online/ludo/play?room=ABC234`. Friends join on their own devices. The host starts with 2–4 present human players within the selected capacity.
5. Roll only when no prior roll is awaiting a move. Select a legal token, or let the engine consume a no-move roll. Resolve captures, home arrivals, extra rolls, and three-sixes handling.
6. Repeat until one player finishes all four tokens. Show the winner or forfeit reason, then offer a new local match or online Rematch/Return to Lobby. All continuing online players accept before the host starts again.

## 4. Sessions, rooms, and interruptions

- Solo and pass-and-play require no online services. Save token progress, actor, any pending die roll, and consecutive-six count locally when storage allows; refresh must not erase a rolled value.
- Online uses automatic persistent anonymous guest identities and human-only rooms. The same browser restores its seat, pending roll, and accepted state after reconnect.
- A connected participant can request abandonment after 120 seconds of a seat's disconnect, or current-turn inactivity since its last accepted action or turn start. Explicit departure during play does the same immediately. Remove that seat's tokens, consume its pending roll, and advance to the next active seat.
- With two active seats, abandonment awards the other player a forfeit win. In a larger match, continue among the remaining seats; a sole remaining active player wins by forfeit. Departed seats cannot re-enter the active match.
- Lobby host departure transfers hosting. During play, connected members can request host transfer after the grace period. New seats and settings changes require returning to the lobby.
- Rooms expire after 24 inactive hours. If everyone disconnects, the match is recoverable until expiry and no winner is manufactured.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Keep track mapping, token legality, captures, roll consumption, extra-turn calculation, abandonment, and result in a pure TypeScript engine shared by all modes. Computer difficulty changes token choice, never die outcomes.
- Store seat assignments, four token progress values per seat, active/inactive status, actor, pending die value, roll sequence, consecutive sixes, round status, result, action IDs, and revision.
- Use Firebase anonymous identity, Realtime Database listeners, and Vihar Games Node.js API route handlers at `/api/games/ludo/rooms/<code>/actions`. Roll and move are separate server-validated commands; prevent rolling while a legal token choice is pending.
- Generate online dice with server-side uniform randomness. Validate membership, actor, expected revision, and legal token progress atomically. Retried rolls return the accepted roll rather than drawing again.
- Mount the game overview at `/ludo`, mode selection and play at `/ludo/play`, and rules at `/ludo/how-to-play`. Selecting the game in the shared catalog opens `/ludo`.
- `GET /api/games/ludo` redirects to the game overview. `GET /api/games/ludo/info` returns catalog metadata and supported modes; `GET /api/games/ludo/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/ludo/rooms`, join through `POST /api/games/ludo/rooms/<code>/join`, read member-visible state through `GET /api/games/ludo/rooms/<code>`, and submit mutations through `POST /api/games/ludo/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/ludo/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:ludo:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/ludo`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All modes work for two, three, and four seats without sign-in; online rooms enforce capacity.
- Verify six-to-enter, exact home entry, overshoot rejection, all safe-cell indices, captures, same-player stacks, and no-blockade passage.
- Verify no-move sixes, three consecutive sixes, count reset after a non-six, capture/home extra rolls, and immediate victory on the fourth home token.
- A pending roll survives refresh and duplicate requests cannot reroll or move two tokens.
- Two to four independent browser profiles agree on turns and token state. Abandonment removes only the departed seat and advances legally.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/ludo`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/ludo` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
