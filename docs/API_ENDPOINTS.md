**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Page and API contract

**Status:** Planned endpoints; no handlers have been implemented.  
**Application:** One Vihar Games website and one Vercel project.  
**API origin:** `https://games.vihar.online`  
**Game page pattern:** `/<game-id>`  
**Game API pattern:** `/api/games/<game-id>`

**Presentation:** All game pages are 2D only. API metadata declares `presentation: "2d"`; API behavior, game rules, and room authority remain independent of decorative artwork.

## 1. Game pages and endpoint namespaces

All twelve games are separate pages within the same website. Their API namespaces are also within that website. Selecting a catalog entry opens the page directly; opening the launch API redirects to that page.

| Game | Page | Play page | Launch API / API base |
| --- | --- | --- | --- |
| Chess | `/chess` | `/chess/play` | `/api/games/chess` |
| Carrom | `/carrom` | `/carrom/play` | `/api/games/carrom` |
| Billiards | `/billiards` | `/billiards/play` | `/api/games/billiards` |
| Tic-Tac-Toe | `/tic-tac-toe` | `/tic-tac-toe/play` | `/api/games/tic-tac-toe` |
| Ludo | `/ludo` | `/ludo/play` | `/api/games/ludo` |
| Snakes and Ladders | `/snakes-and-ladders` | `/snakes-and-ladders/play` | `/api/games/snakes-and-ladders` |
| Connect Four | `/connect-four` | `/connect-four/play` | `/api/games/connect-four` |
| Checkers | `/checkers` | `/checkers/play` | `/api/games/checkers` |
| Reversi | `/reversi` | `/reversi/play` | `/api/games/reversi` |
| Sudoku | `/sudoku` | `/sudoku/play` | `/api/games/sudoku` |
| Minesweeper | `/minesweeper` | `/minesweeper/play` | `/api/games/minesweeper` |
| Memory Match | `/memory-match` | `/memory-match/play` | `/api/games/memory-match` |

Each game also has `/<game-id>/how-to-play`. A private invite uses `/<game-id>/play?room=ABC234`. Bap Ka Rasta, Game 3, and Gulam Chor have no entries, pages, or endpoints in this registry.

## 2. Public endpoints

| Method and path | Behavior | Authentication |
| --- | --- | --- |
| `GET /api/games` | Return the twelve registered games, page URLs, rules URLs, API bases, supported modes, player limits, rules versions, 2D presentation, and implementation availability | None |
| `GET /api/games/<game-id>` | Return HTTP 307 with `Location: /<game-id>` so the clicked endpoint opens the game page | None |
| `GET /api/games/<game-id>/info` | Return metadata for this game, including its available room actions | None |
| `GET /api/games/<game-id>/rules` | Return this game's exact rules text and `rulesVersion`, consistent with its rules page | None |

Public `GET` endpoints do not create rooms, roll dice, start matches, change settings, or submit moves. JSON consumers use `/info` instead of the redirect endpoint. Unknown IDs return 404 rather than redirecting to arbitrary destinations. API responses send `X-Robots-Tag: noindex`.

Metadata exposes an `availability` field. During incremental implementation, an unfinished game remains a catalog entry with `planned` availability and a truthful page; only `playable` games accept live match creation. This document's routes are future requirements and are not currently live.

Chess metadata also exposes its local computer persona: `id: "acharya-dev"`, English/Hindi display names, a planned avatar reference, and difficulty IDs `easy`, `medium`, and `hard`. This is public presentation information; solo search and moves stay in the browser. It does not introduce a computer room member or require online authentication for solo play.

## 3. Online room endpoints

These endpoints apply to the ten multiplayer games. Sudoku and Minesweeper expose public launch/info/rules endpoints only; any recognized room request for them returns `422 MODE_NOT_SUPPORTED`.

| Method and path | Request or behavior |
| --- | --- |
| `POST /api/games/<game-id>/rooms` | Create a room using `actionId`, nickname, capacity, and game settings; return room code, invite URL, seat, public state, and revision |
| `POST /api/games/<game-id>/rooms/<code>/join` | Join an available lobby using `actionId` and nickname, or recover the authenticated guest's existing seat |
| `GET /api/games/<game-id>/rooms/<code>` | Return a room member's current permitted state, own seat, settings, status, and revision; never return the private authoritative snapshot |
| `POST /api/games/<game-id>/rooms/<code>/actions` | Validate and commit a lobby, turn, result, or room-lifecycle action |
| `GET /api/games/<game-id>/rooms/<code>/actions/<action-id>` | Return the requesting guest's accepted action receipt for lost-response recovery, without resubmitting the action |

All room endpoints require `Authorization: Bearer <Firebase guest ID token>`. The browser obtains the token automatically through persistent anonymous authentication when online mode is chosen. There is no visible sign-in or registration step. Verify the token server-side; never treat a client-supplied UID or nickname as authority.

Create and join allow authenticated guests who are not yet members. Snapshot, receipt, and action requests require room membership, with extra host/current-actor checks as appropriate. Private room responses use `Cache-Control: no-store`.

Creation and join bodies include an `actionId` so network retries do not create a duplicate room or second seat. Creation returns the original accepted result for the same guest, game ID, and action ID. Join is idempotent for an existing member. Both are subject to registry capacity and lobby/active-match rules.

## 4. Mutation envelope and results

Every existing-room mutation uses:

```json
{
  "actionId": "a-unique-id-for-this-command",
  "expectedRevision": 12,
  "round": 1,
  "action": "move",
  "payload": {}
}
```

`round` is required for active-game commands and identifies the intended round. Lobby commands may omit it. `expectedRevision` must match current state. Limit action IDs to a bounded validated string; the same ID with a different payload is a conflict.

A successful response includes `gameId`, `roomCode`, `actionId`, `revision`, status, and permitted state or a state reference. Return only fields the requesting guest may read. A repeated accepted command returns its original receipt before checking the now-stale revision, and does not advance the game again. The browser then refreshes the current snapshot if the receipt is older than current state.

Keep receipt retention bounded and tied to room lifetime. If an old receipt has been pruned, return `409 RECEIPT_EXPIRED`; stale revisions still prevent the old action from being reapplied. After a timeout, retry the same action ID or recover its receipt, never create a fresh command ID for a move that may already have committed.

Use atomic database transactions for authoritative changes. Prepare random input once per action outside any retrying transaction callback. Physics simulation also runs outside the transaction, then conditionally commits against the input revision. A shot is accepted only after its full settled state commits; failed or stale simulation leaves the turn unchanged.

## 5. Shared lobby and lifecycle actions

| Action | Payload / validation |
| --- | --- |
| `update-settings` | Host only, lobby only; validate capacity, side assignments, and difficulty against this game |
| `remove-player` | Host only, lobby only; payload identifies a current seat other than the host |
| `start` | Host only; valid human seat count and settings; reject another active round |
| `leave` | Apply lobby departure or the active game's explicit departure/forfeit rule |
| `resign` | End a two-player active match in favor of the opponent; reject where that action is unsupported |
| `request-forfeit` | Validate a two-player opponent's 120-second disconnect or turn-inactivity deadline |
| `request-abandonment` | Validate a multi-seat departure deadline, remove/skip that seat according to its game, and preserve required scores |
| `transfer-host` | Validate lobby succession or the host's reconnect grace period; update the role without changing game ownership |
| `accept-rematch` | A continuing member accepts the proposed next round and unchanged settings/roster |
| `start-rematch` | Host only after every continuing participant accepts; create one new round and reset round-scoped state |
| `return-to-lobby` | Host after a finished round; reset rematch acceptance and allow seat/settings changes |

A host cannot discard a live match by invoking `return-to-lobby`. Resolve it through its defined win, draw, departure, or forfeit process. Membership, timing, and result checks use server state; a client cannot assert that another player has timed out.

Presence heartbeats alone do not reset turn inactivity or room expiry. A legitimate accepted game or room action extends room expiry. Deadline claims are evaluated on demand; no per-second room server job is required.

## 6. Game-specific turn actions

All actions below use the envelope and the matching game namespace. Reject an action registered only for another game.

| Game | Action | Payload / authoritative resolution |
| --- | --- | --- |
| Chess | `move` | `{from, to, promotion?}` using chess square names; validate legality, promotion, check, and result |
| Chess | `offer-draw`, `accept-draw`, `claim-draw` | Validate offer ownership, repetition or move-count claim, and any intended move supplied for a claim |
| Carrom | `shot` | `{strikerPosition: {x, y}, direction, power}`; validate placement, then simulate and resolve coins, queen, debt, and actor |
| Billiards | `shot` | `{cueBallPosition?, direction, power, calledPocket?}`; validate ball-in-hand entitlement and 8-ball declaration, then simulate the full shot |
| Tic-Tac-Toe | `move` | `{cell}` with cell index 0–8; place one mark in an empty cell |
| Ludo | `roll` | Empty payload; generate and commit one die value, or consume a no-move roll according to the rules |
| Ludo | `move` | `{tokenIndex}` with index 0–3; consume the pending die, resolve captures/home/extra rolls |
| Snakes and Ladders | `roll` | Empty payload; generate the die and resolve the entire movement and traversal atomically |
| Connect Four | `move` | `{column}` with index 0–6; server calculates the lowest empty row |
| Checkers | `move` | `{from, to}` with validated playable-square indices; accept one step and preserve any forced capture chain |
| Checkers | `offer-draw`, `accept-draw` | Validate the agreed draw; engine handles the documented automatic draws |
| Reversi | `move` | `{cell}` with index 0–63; calculate every flip and any forced pass |
| Memory Match | `reveal` | `{cardIndex}` within the chosen deck; reveal one permitted unmatched card |
| Memory Match | `resolve-mismatch` | Empty payload; any connected member may request resolution after the accepted server deadline |

For shot inputs, direction uses radians, power is in `(0, 1]`, and positions use the game's versioned normalized playing-area coordinates. Pocket IDs and all cell-index mappings are defined by the shipped engine/rules version. Do not accept client-reported pocketed balls, dice, flips, pair scores, or winners.

There are no server gameplay commands for Sudoku or Minesweeper in this phase. Their puzzle sessions, hints, validation, and records remain local; their API endpoints still open their pages and expose public information.

## 7. Error contract and isolation

Return JSON errors with `error.code`, a clear message, and a request ID. Include current revision only when the requester is allowed to read the room. Do not expose tokens, credentials, private decks, or another seat's private data.

| Status | Typical codes |
| --- | --- |
| 400 | `INVALID_REQUEST`, `INVALID_ROOM_CODE`, invalid nickname or settings schema |
| 401 | `GUEST_TOKEN_REQUIRED`, `INVALID_GUEST_TOKEN` |
| 403 | `NOT_A_MEMBER`, `HOST_ONLY`, `NOT_YOUR_TURN` |
| 404 | `UNKNOWN_GAME`, `ROOM_NOT_FOUND`, `ACTION_NOT_FOUND` |
| 405 | `METHOD_NOT_ALLOWED`; include the supported `Allow` methods |
| 409 | `STALE_REVISION`, `ACTION_ID_REUSED`, `RECEIPT_EXPIRED`, `ROOM_FULL`, `ROUND_ALREADY_STARTED` |
| 410 | `ROOM_EXPIRED` |
| 422 | `ILLEGAL_MOVE`, `INVALID_SHOT`, `MODE_NOT_SUPPORTED`, `UNSUPPORTED_ACTION`, `DEADLINE_NOT_REACHED`, `GAME_NOT_PLAYABLE` |
| 429 | `RATE_LIMITED`; supply an appropriate retry interval |
| 503 | `BACKEND_UNAVAILABLE`, `SHOT_SIMULATION_FAILED`; recover a receipt if the client cannot determine commit status |

Game ID scopes database paths, seat permissions, code reservation, action receipts, and room lookup. A Chess room code must never authorize a Carrom action. Reject client-controlled database paths; choose the registered engine on the server.

## 8. Internal maintenance and verification

`GET /api/internal/cleanup-rooms` is a protected scheduled maintenance endpoint on the same website, outside the public game registry. Validate the scheduler's bearer secret, scan a bounded batch across game namespaces, and conditionally remove only records still expired. The endpoint is not a playable game or public catalog entry.

Implementation checks must verify the twelve launch redirects and metadata/rules endpoints; room support for exactly ten games; token, member, and actor checks; concurrency and duplicate actions; stale simulation rejection; and hidden Memory Match data. Verify direct browser visits to `/chess` and `/carrom` open their pages without any cross-domain redirect.
