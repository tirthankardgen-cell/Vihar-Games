**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Project specification

**Project:** Vihar Games  
**Updated:** 15 November 2026\
**Scope:** Shared deployment scaffold and consolidated plans for twenty-four 2D games, including an approved detailed visual direction for every game.

**Deployment target:** One Next.js application, one Vercel project, one domain.  
**Implementation status:** Chess, Tic Tac Toe, Carrom, Sudoku, Paperwing, Dune Dash, Monsoon Blocks, and Silk Trail local gameplay, local saves, rules and Vihar embedding are implemented. The other 16 engines and all online rooms remain planned.

## 1. Project boundary

The shared application contains the 24 entries in the [catalog](../GAME_CATALOG.md). The earlier Bap Ka Rasta, Game 3, and Gulam Chor folders remain outside the project. Their game pages, routes, code, dependencies, backend data, and deploy configurations are not imported into Vihar Games.

Use `https://games.vihar.online` for the whole project. Chess is `/chess`, Carrom is `/carrom`, and every other module uses its catalog game ID as its page path. Remove the previous individual game subdomains from this project's canonical URLs, invitations, metadata, and deployment requirements.

The rule specifications remain the source of truth for gameplay. This consolidated plan defines how those games share routing, infrastructure, guest access, and deployment.

### Current scaffold

The shared homepage, twenty-four overviews, public catalog API, launch redirects, and metadata APIs are implemented. Chess and Tic Tac Toe have computer/pass-and-play setup, local persistence, computer workers and published rules/JSON. Chess includes legal-move selection, promotion, draw claims/offers, resignation and practice undo; its computer opponent is Acharya Dev. Tic Tac Toe keeps its full-screen notebook and session scores. Carrom adds practice, drag shots, deterministic worker physics, contact guides and settled-state saves. All eight use the existing Vihar v1 embed and activity SDKs; only visible active rounds report gameplay, and pausing/hiding stops computer workers. The other 16 entries remain planned. Local play needs no Firebase configuration. Private rooms and game-host authentication remain deferred.

## 2. Shared page contract

| Path | Purpose |
| --- | --- |
| `/` | List the twenty-four Vihar Games entries and let a visitor open one |
| `/<game-id>` | Explain the chosen game and provide Play and How to Play |
| `/<game-id>/play` | Choose its supported modes, resume local play, or create/join an online room |
| `/<game-id>/how-to-play` | Publish the exact shipped rules for that game |
| `/<game-id>/play?room=ABC234` | Join or recover that game's private room |
| `/api/games` | Return the catalog as JSON |
| `/api/games/<game-id>` | Redirect a browser/API visit to `/<game-id>` |
| `/api/games/<game-id>/...` | Serve that game's metadata, rules, and supported room actions |

Unknown game IDs return 404. The shared registry is an explicit allowlist of twenty-four IDs, not a filesystem path supplied by a visitor. Deep links must resolve on a fresh browser visit without first opening the catalog.

A catalog entry opens its page directly. The launch API also opens the page through a 307 redirect. A room code is always interpreted together with the game ID in the URL; the same six characters in another game refer to another namespace.

## 3. Shared player flow

- **Local solo and practice:** Select a game, choose a supported mode and settings, and start immediately. Use that game's pure engine in the browser. Computer opponents belong to the local solo mode. No room or anonymous-auth network request is required.
- **Chess computer:** Solo Chess offers Easy, Medium, and Hard against Acharya Dev (आचार्य देव), the fictional Vihar chess mentor with a dedicated flat 2D portrait. Keep his identity consistent across levels and keep computer search local in a worker; private online rooms remain human-only.
- **Pass-and-play:** Set optional nicknames and start the local game. Complete the game's whole turn, including extra shots, extra rolls, or forced jumps, before the next person accepts handover. All participants use the same device.
- **Online:** Choose Create Room or Join Room, enter a nickname, and automatically obtain a persistent anonymous guest identity. The host shares a six-character code or the full game-specific invite URL. Friends use separate devices or browser profiles. Start with the exact supported human seat count.
- **Finishing:** Explain the result, retain the relevant session score, and offer a rematch or return to the lobby. Every continuing player accepts before an online rematch starts; a roster or settings change invalidates old rematch acceptance.
- **Switching games:** A local save remains under its game ID. Leaving an online game explicitly uses the game's leave or resignation flow; simply closing or navigating away starts the disconnect grace period. Stop old listeners and pending workers/timers before activating another game.

No email address, password, visible sign-in, or installation is required. Touch, mouse, and keyboard must support setup and gameplay. All twenty-four games use 2D graphics. Chess, Carrom, and Ludo additionally have detailed Indian courtyard artwork requirements in their game documents, as requested.

## 4. One application with separate game modules

At implementation time, use one root `package.json`, one root lockfile, one Next.js App Router application, shared TypeScript configuration, shared Tailwind setup, and one Vercel configuration. Individual game folders are specification folders and do not become independently deployed applications.

The source structure uses these boundaries:

- `src/app/page.tsx` for the shared catalog and `src/app/[gameId]/...` for game, play, and rules routes.
- `src/app/api/games/...` for catalog and game API route handlers, including the game ID in every per-game path.
- `src/games/<game-id>/` for each game's pure rules, local sessions, computer logic or puzzle utilities, and game-specific interactions.
- `src/lib/catalog/` for the central allowlisted registry of names, paths, modes, player limits, rules version, and availability.
- `src/lib/rooms/` for shared API validation, room lifecycle, membership, idempotency, state serialization, and database operations.
- `src/lib/storage/` for game-scoped local save helpers, and workers for bounded computer searches or physics simulations.

The shared application contains App Router pages, catalog/launch/info handlers, and `src/lib/catalog/registry.ts`. Chess, Tic Tac Toe, Carrom, Sudoku, Paperwing, Dune Dash, Monsoon Blocks, and Silk Trail also have engines, local storage helpers, and rules handlers. Chess, Tic Tac Toe, and Carrom use computer workers; Paperwing's bounded fixed-step flight runs locally without one. Online rooms and the remaining 16 engines are future work. Next.js 16 dynamic route parameters use promises and are awaited by the implemented pages and route handlers.

The registry maps public IDs such as `tic-tac-toe` to explicit modules and declares `presentation: "2d"` for every entry. Lazy-load the selected game's browser bundle; opening Chess must not load every game's engine or physics dependencies. Share infrastructure without sharing mutable match state.

## 5. Shared APIs and durable online state

Implement the [API contract](./API_ENDPOINTS.md) through Next.js Node.js route handlers hosted in the same Vercel project. Each supported game has its own endpoint namespace even if the handlers reuse a shared dispatcher.

Use Firebase anonymous authentication for guest identity and Firebase Realtime Database for durable room state and realtime subscriptions. The Node.js API verifies guest ID tokens and uses server credentials for authoritative transactions. All match commands run in this shared API layer; no per-game Cloud Functions deployment is required.

Keep records beneath `games/<game-id>/rooms/<room-code>`, with separate membership, public state, and private authoritative state. Related owner and action records also include the game ID. Room state must survive API instance replacement and deploys; do not store it only in process memory. Online clients may publish tightly scoped connection presence, but cannot write moves, dice, shots, hidden decks, revisions, or results directly.

Realtime listeners read only the current room's permitted public state and legitimate player-private fields. API snapshots apply the same allowlist. In Memory Match, unrevealed card identities stay server-only; never return the full hidden deck through an API or database subscription.

Generate online dice and shuffles on the server once per accepted action. Transaction callbacks can retry, so they must reuse the action's prepared random seed or resolved input rather than producing different outcomes on each retry.

For Carrom and Billiards, validate the snapshot and shot intent, run bounded deterministic simulation outside the transaction, then conditionally commit the complete settled outcome against the expected revision. A stale simulation cannot overwrite newer state. If simulation fails or exceeds its budget, leave the input state and turn unchanged. A lost response is recovered using the action ID; a command is accepted only after its outcome commits.

Local rule engines use the same move rules as their online counterparts. Local matches and all exclusively solo games must remain playable after resources load without gameplay API calls.

## 6. Shared room lifecycle

1. Generate a unique six-character uppercase room code within the selected game, using `A–H`, `J–N`, `P–Z`, and `2–9`. Reserve it atomically. A collision retries within that game's namespace.
2. Trim nicknames to 1–24 valid characters. Guest UID owns the seat; changing a nickname does not change identity. Browser tabs may share the same persisted guest identity, so distinct people use separate devices or profiles.
3. The creator becomes host. Chess, Carrom, Billiards, Tic-Tac-Toe, Connect Four, Checkers, and Reversi require exactly two online human seats. Ludo, Snakes and Ladders, and Memory Match allow 2–4. Sudoku, Minesweeper, and the twelve new solo designs have no online rooms. Validate capacity from the registry and the game's specification.
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

Use one `NEXT_PUBLIC_SITE_URL=https://games.vihar.online`. Each game has its own canonical page beneath it; rules pages append `/how-to-play`. The current sitemap includes the catalog, all 24 overviews, and the eight published rules pages. Future rules pages join only when their rules are published; planned rules placeholders remain `noindex`. Play pages and all room URLs are `noindex`; APIs are excluded from sitemaps and should send an `X-Robots-Tag: noindex` header. Public metadata never includes participant names or private state.

One Firebase guest identity can be shared across the application, but room memberships and current-game subscriptions remain game-scoped. No local or online progress is moved between games merely because the same person opens another route.

## 8. Technology, deployment, and verification

Use the latest stable compatible Next.js, React, TypeScript, and Tailwind CSS releases and the newest stable Node.js release supported by Vercel at implementation time. Resolve and lock exact compatible versions once for the application. Keep validation, linting, type checking, build, and game-specific meaningful tests in the shared pipeline.

Deploy only the `Vihar Games` directory as the root of one Vercel project. Attach only `games.vihar.online` as the user-facing custom domain. Provider preview URLs are development infrastructure, not additional game domains. Configure shared Firebase credentials and rules according to the [deployment plan](./DEPLOYMENT.md).

Acceptance requires all catalog paths and launch endpoints to resolve, unsupported modes to be rejected, and every game to complete its defined flows inside the same build. Validate same-origin save isolation, cross-game room isolation, concurrent commands, reconnects, and hidden-state permissions in addition to each game's rules.

The current application includes pinned dependencies, local fonts, lint/type/test/build scripts, metadata, Vercel configuration, and Chess/Tic Tac Toe's local modules. Its sitemap contains the homepage, twenty-four overviews, and all eight published rules pages; other rules placeholders remain `noindex`. Gameplay acceptance checks apply as modules are implemented. Remote backend resources are not provisioned by this work.

## 9. Mandatory 2D presentation and approved visual styles

Every game is 2D only, including Chess, Carrom, Ludo, and Billiards. Use flat HTML/SVG graphics or Canvas 2D and ordinary 2D position/opacity transitions. Do not use WebGL, Three.js, React Three Fiber, 3D models, isometric boards, extruded pieces, raised rims, modeled dice, CSS perspective, or 3D transforms. Painted texture is allowed as flat artwork; it cannot imply raised or tilted gameplay objects. The prior 3D and semi-3D directions are superseded.

Carrom and Billiards still use deterministic collisions and shot simulation, but coordinates, movement, cushions, and pockets stay in the x/y plane. Render the games from above with flat discs/balls. Chess uses a flat square board and identifiable piece symbols; Ludo uses a flat track, token symbols, and die faces. Memory Match changes card faces through a flat state change or 2D opacity transition, without a 3D card-flip effect.

The three approved Indian artwork adaptations are:

| Game | Visual requirements |
| --- | --- |
| [Chess](../games/Chess/GAME_SPEC.md) | Flat cream/teal grid, recognizable illustrated symbols, quiet courtyard framing, and paper-based controls |
| [Carrom](../games/Carrom/GAME_SPEC.md) | Flat illustrated household board, clearly outlined coins/queen/striker, and readable 2D aiming and pocket events |
| [Ludo](../games/Ludo/GAME_SPEC.md) | Flat cream/cotton board, earthy player colors plus symbols, flat tokens/die, and readable safe/home paths |

Adapt the [Gulam Chor artwork handoff](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/art-direction/README.md), [desktop courtyard preview](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/docs/preview/landing.webp), and [table preview](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/docs/preview/table.webp). The inspected implementation currently uses original SVG studies; the handoff's gouache and paper-grain direction guides future 2D asset preparation. Do not describe those ungenerated paintings as existing assets.

Keep Yatra One/Hind typography, the neem-green/terracotta/ochre/cream palette, block-print accents, and the warm everyday courtyard mood coherent across the three games. Titles, scores, labels, room codes, and rules stay accessible live text. Decoration stays outside active board areas and cannot resemble extra game pieces or safe cells.

The other nine approved visual directions are:

| Game | Theme and visual requirements |
| --- | --- |
| [Tic-Tac-Toe](../games/Tic-Tac-Toe/GAME_SPEC.md#7-detailed-2d-visual-direction--notebook-doodles) | Notebook Doodles: mostly empty paper, hand-drawn grid/marks, and brief drawing animations |
| [Billiards](../games/Billiards/GAME_SPEC.md#7-detailed-2d-visual-direction--vintage-pool-club) | Vintage Pool Club: overhead green table, flat numbered solid/striped balls, slim aiming, and cream labels |
| [Snakes and Ladders](../games/Snakes%20and%20Ladders/GAME_SPEC.md#7-detailed-2d-visual-direction--folk-art-journey) | Folk Art Journey: cream numbered path, illustrated snakes, bamboo ladders, and earthy margin motifs |
| [Connect Four](../games/Connect%20Four/GAME_SPEC.md#7-detailed-2d-visual-direction--retro-toybox) | Retro Toybox: flat blue frame, coral/mustard discs, cream page, and short planar drops |
| [Checkers](../games/Checkers/GAME_SPEC.md#7-detailed-2d-visual-direction--block-print-cloth) | Block Print Cloth: indigo/cream squares, terracotta/ivory counters, printed crowns, and clear capture markers |
| [Reversi](../games/Reversi/GAME_SPEC.md#7-detailed-2d-visual-direction--quiet-garden) | Quiet Garden: sage grid, charcoal/ivory discs, legal-move dots, and flat colour-change feedback |
| [Sudoku](../games/Sudoku/GAME_SPEC.md#7-detailed-2d-visual-direction--puzzle-journal) | Puzzle Journal: off-white ruled page, crisp clues, blue entries, pencil notes, and soft selection highlights |
| [Minesweeper](../games/Minesweeper/GAME_SPEC.md#7-detailed-2d-visual-direction--retro-desktop) | Retro Desktop: flat grey grid, coloured clues, teal flags, readable counters, and small pixel accents |
| [Memory Match](../games/Memory%20Match/GAME_SPEC.md#7-detailed-2d-visual-direction--illustrated-keepsakes) | Illustrated Keepsakes: cream cards, identical patterned backs, distinct everyday pictures, and flat face fades |

The original games' detailed visual guidance lives in section 7 of each `GAME_SPEC.md`; the twelve additions use section 5 of their individual lowercase `spec.md`. The global 2D requirement applies to all 24. Keep mode selection, player names, turn indicators, scores, and main actions consistently organised while carrying the selected game's theme through setup, play, rules, and results. Supported local and online modes share that game's visual language; Sudoku and Minesweeper retain solo puzzle interfaces.

Keep decorative animation brief and separate from rule resolution, accepted state, and computer computation. Respect reduced-motion preferences while preserving required physics resolution and Memory Match observation timing. Decoration must not obscure gameplay targets, numbers, or state, and large boards need readable, navigable mobile layouts.

Shared style tokens and local Hind/Yatra One fonts live inside Vihar Games. Tic Tac Toe adds a locally bundled Caveat font and implemented notebook graphics. The other handoffs define future artwork and game presentation, with no runtime dependency on Gulam Chor.

## 10. Solo puzzle and arcade expansion

The twelve new designs and styles are indexed in the [catalog](../GAME_CATALOG.md#new-solo-games-and-original-styles). Each has an individual `games/<name>/spec.md` and follows [shared solo standards](./SOLO_GAME_STANDARDS.md). Five additions are arcade games and seven are logic/spatial puzzles. All twelve are local one-player designs; Paperwing, Dune Dash, Monsoon Blocks, and Silk Trail are now implemented with null multiplayer limits. The original catalog phase registered overview/placeholder/metadata paths and documented rules. These four now supply playable local engines and original artwork; the other eight additions remain planned, and no online rooms are introduced. Existing original-game specifications and multiplayer contracts remain authoritative.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.

Paperwing is now a playable local module with original airmail SVG screens, Standard/Practice, seeded fixed-step flight and swept collisions, pause/resume countdown, validated saves, local mode records, optional synthesized sound, and Vihar embedding. Its own specification is authoritative. Dune Dash ships its local runner and Monsoon Blocks ships its falling-block engine; Silk Trail ships its garden-snake engine; the other eight solo additions remain planned. Catalog paging keeps the entire homepage within a single viewport and sorts playable entries before planned entries.

## Monsoon Blocks local release

Monsoon Blocks follows its Rain Window specification in isolated engine and component modules. Its five-millisecond fixed steps divide the published gravity, input-repeat, and lock intervals. Local state includes all grid, active/held/preview, bag/random, scoring, and timer state; restore is paused. Every screen fits a dynamic viewport, with shorter rules pages and a fixed-shell accessibility-zoom fallback. Original sound and Cloudlight music run independently of simulation and stop on pause, hiding, and exit.


## Silk Trail local release

Silk Trail owns a pure deterministic snake engine, validated local state, and Silk Garden components. A seeded generator uniformly chooses empty leaf cells. Movement uses fixed preset intervals and a bounded frame accumulator; pause clears turns while retaining its remainder. Original audio scheduling is independent of simulation. Vihar activity is active only during visible local play, and host interruption requires deliberate resume.
