**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/chess](https://games.vihar.online/chess)  
**Open endpoint:** `GET /api/games/chess` → `/chess`  
**API base:** `/api/games/chess`  
**Project:** Vihar Games; one shared Vercel deployment.

# Chess — Game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, or exactly two humans.  
**Required modes:** Computer opponent, pass-and-play, and private online room.  
**Match format:** Standard chess; untimed in the first release.

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
3. Computer mode: choose Easy, Medium, or Hard and White, Black, or Random. Start a local game; the computer acts only for its assigned side.
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
- Separate the chess engine, computer search, local session, room commands, and React interaction. Use a maintained rules engine that correctly supports the special moves and draw conditions; verify claims rather than relying on an incomplete custom move generator.
- Run computer search in a browser worker. Bound difficulty by search depth or thinking time, and cancel work when a game is reset or left.
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
- Validate castling through check, en passant exposing the king, underpromotion, checkmate, stalemate, and repetition with different castling rights.
- Verify draw claims, automatic draws, resignation, and forfeit. A finished game accepts no further moves.
- Two independent browser profiles stay synchronized; refresh preserves the side; duplicate and out-of-turn commands cannot move a piece.
- Touch, mouse, and keyboard can complete setup and legal moves. Handover prevents the next local move until the next person accepts.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/chess`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/chess` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
