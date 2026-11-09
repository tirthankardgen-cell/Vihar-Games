**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games

**One project, twelve browser games, one Vercel deployment.** The homepage lists every included game. Selecting Chess opens `/chess`; selecting Carrom opens `/carrom`. The other games use their documented paths on the same domain.

**Status:** Chess and Tic Tac Toe support computer play, pass-and-play, saved local games, and published rules. Chess keeps its Indian courtyard and Acharya Dev mentor; Tic Tac Toe keeps its ruled notebook. Both integrate with Vihar's embedded player, Exit, pause and activity SDK. Private online rooms remain coming soon; the other ten games retain their planned pages and visual specifications.

**Presentation:** All twelve games are 2D only. Boards, pieces, cards, dice, and transitions use flat graphics; 3D, semi-3D, raised or tilted boards, and perspective effects are excluded.

Chess uses [chess.js](https://github.com/jhlywa/chess.js); its [BSD license notice](public/licenses/chess-js.txt) ships with the game. Bundled fonts retain their original notices.

## Run locally

Use **Node.js 26.13.0** (or a newer stable 26.x patch). The `.nvmrc` and `.node-version` files pin the verified local release; `package.json` selects Vercel's supported `26.x` runtime. Vercel manages the runtime's minor and patch updates.

From this directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. No environment variables or Firebase credentials are required for the scaffold. To change the canonical site URL, copy `.env.example` to `.env.local` and edit `NEXT_PUBLIC_SITE_URL`.

```sh
npm run check   # ESLint, route types, TypeScript, engine tests, production build
npm start       # Serve the completed production build
```

## Deploy this scaffold to Vercel

1. Push this repository to your Git provider, then import it as one Vercel project.
2. Use **Next.js**, **Node.js 26.x**, install command **`npm ci`**, and build command **`npm run build`**. Keep the default output directory. The current Git repository is rooted in this folder, so use the repository root (`.`). Use `Vihar Games` only if you later commit the enclosing Games workspace as the repository.
3. Deploy, then attach **`games.vihar.online`** and apply the DNS record shown by Vercel. Set `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` if you want it explicit; this is already the application default.

The included `vercel.json` sets the framework, install, and build commands. Firebase setup and scheduled room cleanup belong to the later multiplayer phase. See [deployment details](./docs/DEPLOYMENT.md).

## Versions verified online

Checked on **8 November 2026**, then pinned in `package.json` and `package-lock.json`:

| Technology | Version |
| --- | --- |
| Node.js | 26.13.0, stable LTS; Vercel runtime `26.x` |
| Next.js | 16.4.5 |
| React / React DOM | 19.3.1 |
| TypeScript | 6.0.3, latest compatible with the linting plugins |
| Tailwind CSS / PostCSS plugin | 4.3.5 |
| ESLint / Next.js config | 9.39.5 / 16.4.5 |
| npm | 11.20.0 |

Sources: [Node.js release index](https://nodejs.org/dist/index.json), [Next.js latest stable package](https://registry.npmjs.org/next/latest), [Vercel's supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), and each package's npm `latest` metadata. The Node.js 27 alpha in the release index is a prerelease; Node.js 26.13.0 is the latest stable release and is supported by Vercel.

ESLint 10.14.0 and TypeScript 7.0.2 are newer standalone releases, but Next.js's React/accessibility/import lint plugins require ESLint 9 and `typescript-eslint` requires TypeScript below 6.1. The scaffold pins the latest stable versions within those peer dependency ranges instead of forcing an incompatible installation.

The production dependency audit reports zero vulnerabilities. The full npm audit reports eight moderate advisories in the development-only lint dependency chain; these are separate from the deployed application dependencies.

## Included games

Chess, Carrom, Billiards, Tic-Tac-Toe, Ludo, Snakes and Ladders, Connect Four, Checkers, Reversi, Sudoku, Minesweeper, and Memory Match.

The [game catalog](./GAME_CATALOG.md) maps every game to its page, API base, supported modes, and detailed specification.

## Planned player experience

1. Open `https://games.vihar.online` and select a game from the catalog.
2. Read its rules or choose a play mode.
3. Play solo, against the computer, in practice, or with people sharing one device, according to that game's specification.
4. For online multiplayer, create or join that game's private room and share a code or invite URL. For example: `https://games.vihar.online/chess/play?room=ABC234`.
5. Finish the match and choose a rematch, the game lobby, or the main catalog. Keep each game's local progress separate when switching games.

No account registration, visible sign-in, or download is required. All ten multiplayer games support both pass-and-play and private rooms. Sudoku and Minesweeper are single-player puzzles.

## Page paths and API endpoints

The homepage and all overview, play, and how-to-play paths resolve. Chess and Tic Tac Toe have playable local modes and published rules; the other ten games retain **Coming soon** pages. Catalog, launch, and `/info` APIs are implemented, along with both playable games' `/rules` JSON. Firebase authentication, room creation, online actions, and room cleanup remain later work.

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

## Project structure

```text
Vihar Games/
  package.json
  package-lock.json
  next.config.ts
  postcss.config.mjs
  eslint.config.mjs
  tsconfig.json
  vercel.json
  .env.example
  .nvmrc
  .node-version
  src/
    app/
      layout.tsx
      page.tsx
      globals.css
      fonts/
      [gameId]/
      tic-tac-toe/
      api/games/
      robots.ts
      sitemap.ts
    components/
      tic-tac-toe/
    games/
      tic-tac-toe/
    lib/
      catalog/registry.ts
      api.ts
      site.ts
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

Each `games/` folder contains its Markdown specification. Chess and Tic Tac Toe engines, computer workers, local persistence, rules, and tests live in `src/games/chess/` and `src/games/tic-tac-toe/`. Their interfaces live in matching `src/components/` directories. Other engines will follow the same module boundary. Online room helpers remain deferred. The shared allowlisted registry is `src/lib/catalog/registry.ts`.

Tailwind CSS 4 uses `postcss.config.mjs` and the CSS theme in `src/app/globals.css`; a separate `tailwind.config.js` is not required. Hind, Yatra One, and Tic Tac Toe's handwritten Caveat font are bundled locally from [Google Fonts](https://github.com/google/fonts), with their SIL Open Font License files beside them. Builds and visitors do not need to fetch fonts from Google.

The current sitemap includes the homepage, twelve overview pages, and Chess/Tic Tac Toe's published rules pages. Play URLs are `noindex`. The other ten rules placeholders remain `noindex` until their rules are published. API responses carry `X-Robots-Tag: noindex`.

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
| Tic-Tac-Toe | Minimal notebook page with hand-drawn grid lines, X/O marks, and drawing animations | [Notebook Doodles visual direction](./games/Tic-Tac-Toe/GAME_SPEC.md#7-detailed-2d-visual-direction--notebook-doodles) |
| Billiards | Overhead green pool table, flat numbered solids/stripes, and restrained club accents | [Vintage Pool Club visual direction](./games/Billiards/GAME_SPEC.md#7-detailed-2d-visual-direction--vintage-pool-club) |
| Snakes and Ladders | Cream numbered board, illustrated snakes, bamboo ladders, and earthy folk-art accents | [Folk Art Journey visual direction](./games/Snakes%20and%20Ladders/GAME_SPEC.md#7-detailed-2d-visual-direction--folk-art-journey) |
| Connect Four | Flat blue frame, circular slots, coral/mustard discs, and a cream toybox-style page | [Retro Toybox visual direction](./games/Connect%20Four/GAME_SPEC.md#7-detailed-2d-visual-direction--retro-toybox) |
| Checkers | Indigo/cream cloth board, terracotta/ivory counters, and printed crowns | [Block Print Cloth visual direction](./games/Checkers/GAME_SPEC.md#7-detailed-2d-visual-direction--block-print-cloth) |
| Reversi | Sage grid, flat charcoal/ivory discs, fine lines, and a small leaf accent | [Quiet Garden visual direction](./games/Reversi/GAME_SPEC.md#7-detailed-2d-visual-direction--quiet-garden) |
| Sudoku | Off-white puzzle page, ruled grid, crisp numerals, blue entries, and pencil notes | [Puzzle Journal visual direction](./games/Sudoku/GAME_SPEC.md#7-detailed-2d-visual-direction--puzzle-journal) |
| Minesweeper | Flat grey cells, coloured clues, teal flags, and restrained retro-computer accents | [Retro Desktop visual direction](./games/Minesweeper/GAME_SPEC.md#7-detailed-2d-visual-direction--retro-desktop) |
| Memory Match | Cream picture cards, identical patterned backs, and flat everyday-object illustrations | [Illustrated Keepsakes visual direction](./games/Memory%20Match/GAME_SPEC.md#7-detailed-2d-visual-direction--illustrated-keepsakes) |

All twelve games have an approved visual handoff in their own specifications. Each handoff covers palette, artwork, text, board/piece treatment, pages, interaction states, animation, responsive layout, accessibility, and planned asset requirements. Keep mode selection, player names, turn indicators, scores, and main actions consistently organised across the collection while using each game's theme throughout its screens. Chess's original flat SVG courtyard, pieces, and mentor portrait and Tic Tac Toe's notebook graphics are implemented; the other ten games remain planned. The earlier 3D/semi-3D request is superseded by the latest 2D-only direction.

Chess solo mode offers **Easy, Medium, and Hard** against **Acharya Dev (आचार्य देव)**, Vihar's fictional Indian chess mentor. He has a dedicated flat 2D portrait and a consistent identity at all levels. The [Chess computer-opponent handoff](./games/Chess/GAME_SPEC.md#8-solo-computer-opponent--acharya-dev) defines his avatar, level behavior, and local play flow.

## Projects kept outside

`../Bap Ka Rasta`, `../Game 3`, and `../Gulam Chor` remain sibling projects in the workspace. They are excluded from the Vihar Games catalog, source modules, API registry, and Vercel root directory. Their existing documents and implementations remain in those folders.
