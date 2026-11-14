**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/chess](https://games.vihar.online/chess)  
**Open endpoint:** `GET /api/games/chess` → `/chess`  
**API base:** `/api/games/chess`  
**Project:** Vihar Games; one shared Vercel deployment.

# Chess — Game specification

**Status:** Computer and pass-and-play are implemented, with local saves, published rules, and the courtyard interface. Create/Join Room screens are prepared; Firebase rooms, online authority, forfeit, and online rematches are deferred at the user's request until backend credentials are supplied.

**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Vihar computer:** Acharya Dev (आचार्य देव), a fictional Indian chess mentor with a dedicated flat 2D avatar.  
**Required modes:** Computer opponent and pass-and-play available now; private online room remains the documented next phase.

**Match format:** Standard chess; untimed in the first release.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

## 1. Game and objective

Two players alternate moves, trying to checkmate the opposing king. A checkmate occurs when the king is attacked and there is no legal move that removes the attack. A king is never captured. White moves first.

## 2. Exact rules

- Use an 8 × 8 board and the standard starting position. Each side has one king, one queen, two rooks, two bishops, two knights, and eight pawns.
- A king moves one square in any direction. A queen moves any distance along a rank, file, or diagonal. A rook moves along ranks or files. A bishop moves diagonally. These pieces cannot pass through other pieces.
- A knight moves two squares in one direction and one perpendicular square; it can jump over pieces.
- A pawn moves one square forward into an empty square. From its starting square it may move two if both squares are empty. It captures one square diagonally forward.
- A player may capture an opposing piece by making a legal move to its square. A move cannot land on a friendly piece or leave the moving player's king in check.
- Castling is allowed only if the king and relevant rook have never moved, the squares between them are empty, and the king is not in check and does not cross or end on an attacked square. Queenside castling also requires the square next to the rook to be empty, although the king does not cross that square.
- En passant is allowed only on the move immediately after an adjacent opposing pawn advances two squares, if the capture is otherwise legal.
- A pawn reaching the last rank must promote to a queen, rook, bishop, or knight. The player chooses; promotion is part of the move and must finish before the turn advances.
- Checkmate wins the game. Stalemate, where a player has no legal move but is not in check, draws the game.
- A dead position, in which neither side can checkmate by any legal sequence, is a draw. Do not equate this with a simple piece-count check.
- Either player may offer a draw; it takes effect only when the opponent accepts. Resignation immediately awards the win to the opponent.
- A player can claim a draw on threefold repetition or after 50 moves by each side without a pawn move or capture. Support claims when the condition already holds or a submitted intended legal move would establish it. Fivefold repetition and 75 such moves by each side draw automatically, with checkmate on the final move taking precedence.
- Repetition compares side to move, piece placement, castling rights, and legally available en passant captures. Reset the half-move counter on every pawn move or capture.
- No takebacks in online matches. Local practice may offer undo; it reverses a complete human/computer turn pair in solo mode and is excluded from competitive results.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Chess, or visit `/chess` directly. Choose Play or How to Play.
2. Choose Play Computer, Pass-and-Play, Create Room, or Join Room.
3. Computer mode: meet Acharya Dev (आचार्य देव), choose Easy, Medium, or Hard and White, Black, or Random, then start a local game. His dedicated 2D avatar identifies the Vihar computer; it acts only for its assigned side.
4. Pass-and-play: enter optional names, assign sides, and start. After each completed move, the other person accepts the handover. Both people share the same device and game state.
5. Online: enter a nickname, create a room, and share its six-character code or `https://games.vihar.online/chess/play?room=ABC234`. The second person joins on their own device. The host selects fixed or random sides and starts when both players are present.
6. Submit a legal move, including a promotion choice when necessary. Resolve check, draw conditions, and the next turn from the accepted position.
7. End with the winner or exact draw reason. Offer local Play Again, or online Rematch and Return to Lobby. Both online players accept a rematch; the host starts it with sides swapped by default.

## 4. Sessions, rooms, and interruptions

- Solo and pass-and-play need no backend. Save the current position and full repetition history locally when storage is available; resume the same local match after refresh.
- Online uses an automatically created persistent guest identity. A nickname is not a login. Room capacity is exactly two; no bots or spectators join online games in the first release.
- Rejoining in the same browser restores the player's side and latest server state. Disconnected players cannot submit moves. A closed tab does not immediately resign.
- A connected opponent may request a server-validated forfeit after a 120-second disconnect grace period, or after the current player has been inactive for 120 seconds since their last accepted action or turn start. No automatic chess move is made.
- Host departure in the lobby transfers hosting. During a match, the remaining player can request host transfer after the reconnect grace period. Resignation or a claimed forfeit ends the match permanently.
- Host settings and player removal are lobby-only. New seats cannot enter an active match. Rooms expire after 24 inactive hours; if both disconnect, the room stays recoverable until expiry without assigning a winner.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using HTML/SVG board and flat piece glyphs. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Separate the chess engine, computer search, local session, room commands, and React interaction. Use a maintained rules engine that correctly supports the special moves and draw conditions; verify claims rather than relying on an incomplete custom move generator.
- Run computer search in a browser worker. Bound difficulty by search depth or thinking time, and cancel work when a game is reset or left.
- Keep the same Acharya Dev identity/avatar at all three difficulty levels. Persist selected difficulty, human side, and opponent ID with a local save; changing difficulty for a new game resets the position rather than silently changing an active opponent. Computer play requires no room, account, external AI API, or online bot seat.
- For online play, use Firebase anonymous identities, Realtime Database subscriptions, and Vihar Games Node.js API route handlers at `/api/games/chess/rooms/<code>/actions`. The server validates seat, active side, room revision, move legality, promotion, and result atomically.
- Persist position, castling rights, en passant state, move history, repetition keys, half-move count, side assignment, draw offers, status, result reason, and revision. Deduplicate retried move requests.
- Mount the game overview at `/chess`, mode selection and play at `/chess/play`, and rules at `/chess/how-to-play`. Selecting the game in the shared catalog opens `/chess`.
- `GET /api/games/chess` redirects to the game overview. `GET /api/games/chess/info` returns catalog metadata and supported modes; `GET /api/games/chess/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/chess/rooms`, join through `POST /api/games/chess/rooms/<code>/join`, read member-visible state through `GET /api/games/chess/rooms/<code>`, and submit mutations through `POST /api/games/chess/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/chess/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. After a lost API response, recover the accepted result by action ID before submitting a new turn command.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:chess:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/chess`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All three modes complete a real game without a sign-in step; local modes do not initialize online services.
- Solo setup offers Easy, Medium, and Hard, identifies the opponent as Acharya Dev with his own 2D avatar, and preserves the chosen level and human side after a local resume. Each level plays legal moves and stronger search remains responsive.
- Validate castling through check, en passant exposing the king, underpromotion, checkmate, stalemate, and repetition with different castling rights.
- Verify draw claims, automatic draws, resignation, and forfeit. A finished game accepts no further moves.
- Two independent browser profiles stay synchronized; refresh preserves the side; duplicate and out-of-turn commands cannot move a piece.
- Touch, mouse, and keyboard can complete setup and legal moves. Handover prevents the next local move until the next person accepts.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/chess`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/chess` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.

## 7. Detailed 2D visual direction — Indian courtyard chess

**Approved presentation:** 2D only. Use a flat top-down board and flat illustrated chess-piece symbols. The earlier request for 3D chess is superseded by the user's latest instruction that every game is 2D.

### 7.1 Reference and shared Indian artwork style

Use Gulam Chor's Indian neighborhood courtyard style as the visual reference: ochre and terracotta plaster, neem foliage, muted teal shutters, cotton/block-print details, cream lettering, and the warmth of an evening family gathering. Keep the familiar everyday setting and quiet interface.

The inspected repository currently renders original SVG color studies; its preview screenshots show that artwork. The art handoff describes gouache, dry-brush edges, and paper grain as the intended painted finish. Adopt the observed composition and palette, with those textures in future 2D illustrations; do not claim generated paintings already exist.

| Color | Value | Role |
| --- | --- | --- |
| Neem/shadow green | `#293D35` | Dark text, outlines, shaded courtyard areas |
| Deep cotton teal | `#2B4A42` | Secondary surfaces and restrained accents |
| Terracotta | `#AF6443` | Walls and warm decorative accents |
| Ochre | `#C99558` | Wood-colored details and small emphasis marks |
| Cream | `#F5E6C5` | Paper surfaces, light pieces, and primary lettering |
| Muted brass | `#DFB36D` | Thin borders and active-state accents |
| Dusty sky blue | `#7A929A` | Small background and secondary accents |

Use a static illustrated courtyard backdrop with warm upper-right light painted into the artwork. Place neem leaves, plaster walls, shutters, a charpoy, and chai details near the edges; keep the playing area calm. Gouache texture and block-print motifs are decorative, never encoded game state. The board and every interactive object remain flat and un-tilted.

Use locally bundled Yatra One for Hindi display lettering and Hind for readable Hindi/English interface text, matching Gulam Chor. Render titles, names, room codes, scores, coordinates, and rule messages as accessible text rather than baking them into images. Use flat cream buttons with dark ink, restrained borders, and visible focus; omit raised-button shadows and perspective effects.

Keep the style affectionate and familiar. Avoid neon, glass panels, casino styling, photorealistic stock imagery, palaces, deity-themed pieces, or caricatures. Use this project's own game titles and symbols rather than copying Gulam Chor's Jack, card backs, or branding.

### 7.2 Board and pieces

- Present the complete 8 × 8 board as a flat square with cream and deep-teal cells, a thin ochre frame, and sparse block-print decoration outside the playable grid. Use subtle paper or wood-grain illustration as a flat texture; do not add a raised rim, bevel, tilt, or cast shadow suggesting physical height.
- Use recognizable flat chess silhouettes for king, queen, rook, bishop, knight, and pawn. The knight reads as a horse-head symbol, the bishop has its familiar split-head marker, and the king/queen differ clearly. The Indian influence belongs in linework, texture, colors, and framing, while piece types remain immediately identifiable.
- White uses cream fills with dark outlines; Black uses deep-ink/teal fills with cream line details. Maintain contrast against both cell colors. Labels and accessible piece names remain White/Black even if the artwork uses these warm tones.
- Coordinates stay readable outside the cells. Each piece occupies its canonical square and has a large enough selection target; ornamental patterns cannot resemble pieces or legal-move markers.
- If the local handover flips the board, use a flat 180-degree board orientation change, keep glyphs and text upright, and preserve canonical square names. Online orientation is local to each player and never changes server coordinates.

### 7.3 Pages, controls, and game states

- On `/chess`, reuse the calm courtyard composition, a cream Hindi title such as शतरंज, and the existing Play/How to Play flow. Carry the same colors into computer setup, pass-and-play setup, Create/Join Room, and the lobby.
- On `/chess/play`, make the board the main readable area. Player names, side assignment, current turn, move history, draw/resignation controls, and connection status use quiet flat paper panels around it.
- In solo mode, the opposing player panel shows Acharya Dev's dedicated flat illustrated portrait, his English/Hindi name, the label Vihar Computer, and the chosen difficulty. Human multiplayer seats keep their own names and do not inherit the computer persona.
- Selection uses a thin outline; legal moves use distinct dots/rings, with capture targets differentiated from empty destinations. Last-move and check states use both a marker and text, not color alone.
- Promotion uses an accessible flat choice panel with queen, rook, bishop, and knight symbols; do not finish the move before the player chooses.
- Results use the same paper-and-ink language, state the precise win/draw/forfeit reason, and provide the documented rematch/lobby actions. Decorative celebration must not cover the final position.

### 7.4 Motion, responsive layout, and accessibility

- Animate moves with short 2D translations between cells; captures remove the captured glyph after the accepted move, and castling translates king and rook together. Never rotate a piece in 3D, lift it into depth, or run a camera orbit.
- Respect reduced motion by showing the accepted final squares immediately. Animation cannot delay authoritative turn changes or override a newer room revision.
- Keep every Chess page within one viewport, including the embedded player. For the playing area, use Chess.com's organization as inspiration: a large square board, slim player strips immediately above/below, and a separate right rail for status, move history, and actions. Prioritize board size over decorative headings and footer space. Preserve Vihar's illustrated courtyard identity and flat pieces.
- On phones, use the available width for all eight files and keep labels readable at 360–390 CSS-pixel widths. Place compact status/actions below the board; open move history and secondary actions in accessible dialogs. Short landscape screens use the side rail. Rules and long histories use paging. Allow internal dialog scrolling at unusually constrained sizes or accessibility zoom so every action stays reachable.
- Support tap/click selection and keyboard square navigation. Announce selected pieces, legal destinations, check, promotion, and the result. Flat illustration must not remove focus indicators or accessible text.

### 7.5 Planned asset and implementation handoff

- Prepare a matching flat courtyard illustration/crop, a flat board border/texture, six clear piece silhouettes with two side treatments, Acharya Dev's dedicated flat portrait, and flat state/control icons. All assets use the same palette and line quality.
- Use HTML/SVG for the board and pieces; optional Canvas 2D effects may remain cosmetic. No WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms are needed.
- Keep every piece, cell, coordinate, and rule state separate from the background image. The renderer reads the existing pure chess engine and shared API state without changing chess rules.
- Before implementation is accepted, compare desktop/mobile pages with the inspected Gulam Chor references, verify 2D-only rendering, piece recognition, selection contrast, reduced motion, and identical rules across all modes.
- The current editable cover source is `scripts/make-chess-art.mjs`, producing `/art/chess/courtyard.svg`. It adapts the shared courtyard study with textile/chai details and removes card-game props. The cover uses accessible live Hindi lettering; it is native SVG illustration, not a generated raster painting. See [UI implementation plan](UI_PLAN.md) for the viewport layout and verification targets.

### 7.6 Inspected references

- [Gulam Chor artwork style bible](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/art-direction/README.md)
- [Desktop courtyard preview](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/docs/preview/landing.webp)
- [Desktop table preview](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/docs/preview/table.webp)
- [Mobile table preview](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/docs/preview/table-mobile.webp)
- [Current palette and interface styles](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/src/app/globals.css)
- [Current artwork resolver](https://github.com/tirthankardgen-cell/Gulam-Chor/blob/76bd85b24ea7edce32c0be2f33e89c1a1d481923/src/lib/art.ts)

These links point to the inspected revision of the separate Gulam Chor repository. Future Vihar Games assets and style tokens must live within this shared application; do not introduce runtime imports from the sibling project.

## 8. Solo computer opponent — Acharya Dev

**Display name:** Acharya Dev  
**Hindi name:** आचार्य देव  
**Role:** Vihar Computer / Vihar's chess mentor  
**Stable local opponent ID:** `acharya-dev`  
**Required difficulty choices:** Easy, Medium, Hard.

Acharya Dev is an original fictional Indian chess teacher/master persona, not an impersonation of a real player. Give him a calm, thoughtful face and a simple cotton kurta in the cream, neem-green, and ochre palette. Use the same affectionate illustrated portrait language as Gulam Chor's family avatars, with subtle paper/gouache texture. His avatar is a flat 2D portrait in a simple outlined badge, without a 3D bust, raised frame, perspective lighting, or animated talking head.

His identity stays the same at every difficulty. The opposing-player label can read `Acharya Dev · Medium` with `Vihar Computer` as supporting text. Do not invent a verified rating or official chess title. The portrait is cosmetic: the local rules engine and computer search determine legal moves.

| Level | Intended behavior |
| --- | --- |
| Easy | Beginner-friendly bounded search with occasional legal mistakes; never break move legality or special-move rules |
| Medium | More consistent tactical choices, protecting material and finding immediate threats through a deeper bounded search |
| Hard | Strongest available local search within a responsive thinking-time budget; no promise of perfect or unbeatable chess |

Choose difficulty before starting, along with White, Black, or Random. If the human is Black, Acharya Dev makes the first White move. Changing difficulty during an unfinished match requests confirmation before starting a fresh position. Rematching can keep the selected level or return to setup to change it.

Run searches in a browser worker, cancel obsolete work on restart/navigation, and show a readable computer-thinking state. Accept a computer move only for its assigned side and the current position. Preserve the opponent ID, selected level, and human side when restoring a local game.

The planned portrait asset is `/art/chess/acharya-dev.svg` or an equivalently optimized flat image within Vihar Games. Keep the name in live text and show an accessible initials/name fallback while an asset is unavailable. This document defines the avatar handoff; it does not generate the portrait now.

The public Chess metadata may identify the persona and supported levels. Solo moves remain browser-local; Acharya Dev never occupies a private online-room seat in this release. Verify all levels, both human sides, first-move behavior, save/resume, avatar fallback, and worker cancellation alongside the existing chess rules checks.
