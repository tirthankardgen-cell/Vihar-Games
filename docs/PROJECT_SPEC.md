**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Project specification

**Project:** Vihar Games  
**Updated:** 8 November 2026  
**Scope:** Consolidated documentation and organization for twelve planned games.  
**Deployment target:** One Next.js application, one Vercel project, one domain.  
**Implementation status:** Not started.

## 1. Project boundary

The shared application contains exactly the twelve entries in the [catalog](../GAME_CATALOG.md). The earlier Bap Ka Rasta, Game 3, and Gulam Chor folders remain outside the project. Their game pages, routes, code, dependencies, backend data, and deploy configurations are not imported into Vihar Games.

Use `https://games.vihar.online` for the whole project. Chess is `/chess`, Carrom is `/carrom`, and every other module uses its catalog game ID as its page path. Remove the previous individual game subdomains from this project's canonical URLs, invitations, metadata, and deployment requirements.

The rule specifications remain the source of truth for gameplay. This consolidated plan defines how those games share routing, infrastructure, guest access, and deployment.

## 2. Shared page contract

| Path | Purpose |
| --- | --- |
| `/` | List the twelve Vihar Games entries and let a visitor open one |
| `/<game-id>` | Explain the chosen game and provide Play and How to Play |
| `/<game-id>/play` | Choose its supported modes, resume local play, or create/join an online room |
| `/<game-id>/how-to-play` | Publish the exact shipped rules for that game |
| `/<game-id>/play?room=ABC234` | Join or recover that game's private room |
| `/api/games` | Return the catalog as JSON |
| `/api/games/<game-id>` | Redirect a browser/API visit to `/<game-id>` |
| `/api/games/<game-id>/...` | Serve that game's metadata, rules, and supported room actions |

Unknown game IDs return 404. The shared registry is an explicit allowlist of twelve IDs, not a filesystem path supplied by a visitor. Deep links must resolve on a fresh browser visit without first opening the catalog.

A catalog entry opens its page directly. The launch API also opens the page through a 307 redirect. A room code is always interpreted together with the game ID in the URL; the same six characters in another game refer to another namespace.

## 3. Shared player flow

- **Local solo and practice:** Select a game, choose a supported mode and settings, and start immediately. Use that game's pure engine in the browser. Computer opponents belong to the local solo mode. No room or anonymous-auth network request is required.
- **Pass-and-play:** Set optional nicknames and start the local game. Complete the game's whole turn, including extra shots, extra rolls, or forced jumps, before the next person accepts handover. All participants use the same device.
- **Online:** Choose Create Room or Join Room, enter a nickname, and automatically obtain a persistent anonymous guest identity. The host shares a six-character code or the full game-specific invite URL. Friends use separate devices or browser profiles. Start with the exact supported human seat count.
- **Finishing:** Explain the result, retain the relevant session score, and offer a rematch or return to the lobby. Every continuing player accepts before an online rematch starts; a roster or settings change invalidates old rematch acceptance.
- **Switching games:** A local save remains under its game ID. Leaving an online game explicitly uses the game's leave or resignation flow; simply closing or navigating away starts the disconnect grace period. Stop old listeners and pending workers/timers before activating another game.

No email address, password, visible sign-in, or installation is required. Touch, mouse, and keyboard must support setup and gameplay. Documentation covers rules and behavior without prescribing visual design.

## 4. One application with separate game modules

At implementation time, use one root `package.json`, one root lockfile, one Next.js App Router application, shared TypeScript configuration, shared Tailwind setup, and one Vercel configuration. Individual game folders are specification folders and do not become independently deployed applications.

The future source structure should include:

- `src/app/page.tsx` for the shared catalog and `src/app/[gameId]/...` for game, play, and rules routes.
- `src/app/api/games/...` for catalog and game API route handlers, including the game ID in every per-game path.
- `src/games/<game-id>/` for each game's pure rules, local sessions, computer logic or puzzle utilities, and game-specific interactions.
- `src/lib/catalog/` for the central allowlisted registry of names, paths, modes, player limits, rules version, and availability.
- `src/lib/rooms/` for shared API validation, room lifecycle, membership, idempotency, state serialization, and database operations.
- `src/lib/storage/` for game-scoped local save helpers, and workers for bounded computer searches or physics simulations.

These are documented future paths, not source files to create in this phase. Dynamic App Router parameters and framework APIs must follow the documentation of the version installed when coding starts.

The registry maps public IDs such as `tic-tac-toe` to explicit modules. Lazy-load the selected game's browser bundle; opening Chess must not load every game's engine or physics dependencies. Share infrastructure without sharing mutable match state.

## 5. Shared APIs and durable online state

Implement the [API contract](./API_ENDPOINTS.md) through Next.js Node.js route handlers hosted in the same Vercel project. Each supported game has its own endpoint namespace even if the handlers reuse a shared dispatcher.

Use Firebase anonymous authentication for guest identity and Firebase Realtime Database for durable room state and realtime subscriptions. The Node.js API verifies guest ID tokens and uses server credentials for authoritative transactions. All match commands run in this shared API layer; no per-game Cloud Functions deployment is required.

Keep records beneath `games/<game-id>/rooms/<room-code>`, with separate membership, public state, and private authoritative state. Related owner and action records also include the game ID. Room state must survive API instance replacement and deploys; do not store it only in process memory. Online clients may publish tightly scoped connection presence, but cannot write moves, dice, shots, hidden decks, revisions, or results directly.

Realtime listeners read only the current room's permitted public state and legitimate player-private fields. API snapshots apply the same allowlist. In Memory Match, unrevealed card identities stay server-only; never return the full hidden deck through an API or database subscription.

Generate online dice and shuffles on the server once per accepted action. Transaction callbacks can retry, so they must reuse the action's prepared random seed or resolved input rather than producing different outcomes on each retry.

For Carrom and Billiards, validate the snapshot and shot intent, run bounded deterministic simulation outside the transaction, then conditionally commit the complete settled outcome against the expected revision. A stale simulation cannot overwrite newer state. If simulation fails or exceeds its budget, leave the input state and turn unchanged. A lost response is recovered using the action ID; a command is accepted only after its outcome commits.

Local rule engines use the same move rules as their online counterparts. Local matches and the two solo puzzles must remain playable after resources load without gameplay API calls.

## 6. Shared room lifecycle

1. Generate a unique six-character uppercase room code within the selected game, using `A–H`, `J–N`, `P–Z`, and `2–9`. Reserve it atomically. A collision retries within that game's namespace.
2. Trim nicknames to 1–24 valid characters. Guest UID owns the seat; changing a nickname does not change identity. Browser tabs may share the same persisted guest identity, so distinct people use separate devices or profiles.
3. The creator becomes host. Chess, Carrom, Billiards, Tic-Tac-Toe, Connect Four, Checkers, and Reversi require exactly two online human seats. Ludo, Snakes and Ladders, and Memory Match allow 2–4. Sudoku and Minesweeper have no online rooms. Validate capacity from the registry and the game's specification.
4. Humans join in the lobby. No online bots, spectators, public matchmaking, cross-game lobby, or replacement seats enter an active round in this release.
5. The host changes settings or removes seats only in the lobby, then starts once the game's minimum human count is met. One atomic start creates the game state and side/seat assignment.
6. Apply each accepted command once, increment the revision, and publish allowed state. Reject stale, invalid, out-of-turn, and post-result actions without changing the game.
7. A same-browser reconnect restores the same seat and latest revision. Closing a tab is a disconnect, not immediate resignation. Disallow new commands until the client has recovered current state.
8. Allow a server-validated forfeit/abandonment request after 120 seconds of disconnect, or 120 seconds of current-turn inactivity since the last accepted action or turn start. Explicit resignation/departure applies the game spec immediately. Never select a random legal move for an absent player.
9. Two-person matches award the opponent a forfeit. Ludo and Snakes and Ladders remove abandoned tokens and continue among remaining seats; Memory Match keeps earned scores and follows its pending-pair rules. A sole active seat wins by forfeit. On normal completion of a larger Memory Match round, compare all recorded scores, including abandoned seats.
10. Lobby host departure transfers the role to the earliest remaining seat; an empty lobby closes. During a round, a connected member can request host transfer after the host's grace period. Role changes do not change game authority or player ownership.
11. Once the match ends, offer rematch acceptance or a return to the lobby. Departed seats can participate again only through a fresh lobby round. If all participants disconnect, keep the match recoverable until expiry without manufacturing a winner.
12. Expire a room after 24 hours without an accepted room or game action. Presence updates and rejected requests do not extend expiry. A protected bounded cleanup endpoint removes expired records without removing newly renewed rooms.

## 7. Shared-origin storage and metadata

All games now share one browser origin. Use local keys such as `vihar-games:chess:save:v1` and `vihar-games:carrom:settings:v1`; validate save format and isolate every game's undo history, settings, timer, and scores. A corrupted or unavailable save cannot prevent a fresh local game.

Use one `NEXT_PUBLIC_SITE_URL=https://games.vihar.online`. Each game has its own canonical page beneath it; rules pages append `/how-to-play`. The shared sitemap includes the catalog, twelve overviews, and twelve rules pages. Play pages and all room URLs are `noindex`; APIs are excluded from sitemaps and should send an `X-Robots-Tag: noindex` header. Public metadata never includes participant names or private state.

One Firebase guest identity can be shared across the application, but room memberships and current-game subscriptions remain game-scoped. No local or online progress is moved between games merely because the same person opens another route.

## 8. Technology, deployment, and verification

Use the latest stable compatible Next.js, React, TypeScript, and Tailwind CSS releases and the newest stable Node.js release supported by Vercel at implementation time. Resolve and lock exact compatible versions once for the application. Keep validation, linting, type checking, build, and game-specific meaningful tests in the shared pipeline.

Deploy only the `Vihar Games` directory as the root of one Vercel project. Attach only `games.vihar.online` as the user-facing custom domain. Provider preview URLs are development infrastructure, not additional game domains. Configure shared Firebase credentials and rules according to the [deployment plan](./DEPLOYMENT.md).

Acceptance requires all catalog paths and launch endpoints to resolve, unsupported modes to be rejected, and every game to complete its defined flows inside the same build. Validate same-origin save isolation, cross-game room isolation, concurrent commands, reconnects, and hidden-state permissions in addition to each game's rules.

This phase delivers these documents and the relocated specifications. It does not install dependencies, initialize an application, implement games or APIs, or deploy a site.
