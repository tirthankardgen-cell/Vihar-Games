**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games

**One project, twelve browser games, one Vercel deployment.** The homepage lists every included game. Selecting Chess opens `/chess`; selecting Carrom opens `/carrom`. The other games use their documented paths on the same domain.

**Status:** Documentation only, updated 8 November 2026. No game code, package scaffold, API handlers, or deployment configuration has been created.

**Presentation:** All twelve games are 2D only. Boards, pieces, cards, dice, and transitions use flat graphics; 3D, semi-3D, raised or tilted boards, and perspective effects are excluded.

## Included games

Chess, Carrom, Billiards, Tic-Tac-Toe, Ludo, Snakes and Ladders, Connect Four, Checkers, Reversi, Sudoku, Minesweeper, and Memory Match.

The [game catalog](./GAME_CATALOG.md) maps every game to its page, API base, supported modes, and detailed specification.

## Player experience

1. Open `https://games.vihar.online` and select a game from the catalog.
2. Read its rules or choose a play mode.
3. Play solo, against the computer, in practice, or with people sharing one device, according to that game's specification.
4. For online multiplayer, create or join that game's private room and share a code or invite URL. For example: `https://games.vihar.online/chess/play?room=ABC234`.
5. Finish the match and choose a rematch, the game lobby, or the main catalog. Keep each game's local progress separate when switching games.

No account registration, visible sign-in, or download is required. All ten multiplayer games support both pass-and-play and private rooms. Sudoku and Minesweeper are single-player puzzles.

## Page paths and API endpoints

| Purpose | Chess example | Carrom example |
| --- | --- | --- |
| Open the game | `/chess` | `/carrom` |
| Choose a mode and play | `/chess/play` | `/carrom/play` |
| Read the rules | `/chess/how-to-play` | `/carrom/how-to-play` |
| Open through a clickable API endpoint | `GET /api/games/chess` redirects to `/chess` | `GET /api/games/carrom` redirects to `/carrom` |
| Read game metadata | `GET /api/games/chess/info` | `GET /api/games/carrom/info` |
| Create an online room | `POST /api/games/chess/rooms` | `POST /api/games/carrom/rooms` |
| Submit a room or game action | `POST /api/games/chess/rooms/<code>/actions` | `POST /api/games/carrom/rooms/<code>/actions` |

Page routes open browser experiences. JSON APIs supply metadata and perform online actions. The launch API provides the requested click-to-open behavior without making a `GET` request start or mutate a match.

## Current documentation structure

```text
Vihar Games/
  README.md
  GAME_CATALOG.md
  docs/
    PROJECT_SPEC.md
    API_ENDPOINTS.md
    DEPLOYMENT.md
  games/
    Chess/GAME_SPEC.md
    Carrom/GAME_SPEC.md
    Billiards/GAME_SPEC.md
    Tic-Tac-Toe/GAME_SPEC.md
    Ludo/GAME_SPEC.md
    Snakes and Ladders/GAME_SPEC.md
    Connect Four/GAME_SPEC.md
    Checkers/GAME_SPEC.md
    Reversi/GAME_SPEC.md
    Sudoku/GAME_SPEC.md
    Minesweeper/GAME_SPEC.md
    Memory Match/GAME_SPEC.md
```

Each game folder contains one Markdown specification. Application source directories described in the architecture document are future implementation plans.

## Documents and authority

- [Game catalog](./GAME_CATALOG.md): game list, canonical paths, modes, and implementation order.
- [Project specification](./docs/PROJECT_SPEC.md): shared architecture, player flow, room behavior, and module boundaries.
- [API contract](./docs/API_ENDPOINTS.md): endpoint methods, game actions, payloads, errors, and isolation.
- [Deployment plan](./docs/DEPLOYMENT.md): one Vercel project, one domain, shared environment settings, and checks.
- Each `GAME_SPEC.md`: that game's exact rules and acceptance criteria.

The current instructions and these consolidated documents supersede the earlier per-game-subdomain and per-game-deployment plan. Preserve the game rules when implementing the shared application.

## Approved 2D artwork direction

Chess, Carrom, and Ludo adapt the Indian courtyard artwork style inspected in Gulam Chor: terracotta and ochre architecture, neem greens, cream Hindi lettering, block-print details, quiet paper controls, and painterly 2D texture.

| Game | Required presentation | Detailed handoff |
| --- | --- | --- |
| Chess | Flat top-down 2D board with recognizable illustrated chess symbols | [Chess visual direction](./games/Chess/GAME_SPEC.md#7-detailed-2d-visual-direction--indian-courtyard-chess) |
| Carrom | Flat top-down 2D board, discs, striker, aiming, and planar shot motion | [Carrom visual direction](./games/Carrom/GAME_SPEC.md#7-detailed-2d-visual-direction--indian-courtyard-carrom) |
| Ludo | Flat 2D board, tokens, and die faces with planar movement | [Ludo visual direction](./games/Ludo/GAME_SPEC.md#7-detailed-2d-visual-direction--indian-courtyard-ludo) |

Each handoff covers palette, artwork, text, board/piece treatment, pages, interaction states, animation, responsive layout, accessibility, and planned asset requirements. The other nine games also carry the mandatory 2D presentation requirement in their own specifications. The earlier 3D/semi-3D request is superseded by the latest 2D-only direction.

Chess solo mode offers **Easy, Medium, and Hard** against **Acharya Dev (आचार्य देव)**, Vihar's fictional Indian chess mentor. He has a dedicated flat 2D portrait and a consistent identity at all levels. The [Chess computer-opponent handoff](./games/Chess/GAME_SPEC.md#8-solo-computer-opponent--acharya-dev) defines his avatar, level behavior, and local play flow.

## Projects kept outside

`../Bap Ka Rasta`, `../Game 3`, and `../Gulam Chor` remain sibling projects in the workspace. They are excluded from the Vihar Games catalog, source modules, API registry, and Vercel root directory. Their existing documents and implementations remain in those folders.
