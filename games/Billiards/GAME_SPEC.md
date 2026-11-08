**Domain:** [games.vihar.online](https://games.vihar.online)  
**Game URL:** [/billiards](https://games.vihar.online/billiards)  
**Open endpoint:** `GET /api/games/billiards` → `/billiards`  
**API base:** `/api/games/billiards`  
**Project:** Vihar Games; one shared Vercel deployment.

# Billiards — 8-ball pool game specification

**Status:** Documentation for a planned Vihar Games module; implementation has not started.  
**Platform:** Browser on mobile, tablet, and desktop.  
**Access:** No account, visible sign-in, or download.  
**Players:** One human against the computer, two humans, or one-person practice.  
**Required modes:** Computer opponent, practice, pass-and-play, and private online room.  
**Match format:** One rack of casual 8-ball pool, with the exact house rules below.  
**Presentation:** 2D only; flat boards and pieces. No 3D or semi-3D rendering.

**Visual theme:** Vintage Pool Club; an uncluttered overhead pool table with deep green felt, cream labels, flat numbered balls, and restrained club-style accents.

## 1. Game and objective

This project uses pocket billiards, specifically 8-ball pool. One player clears balls 1–7 and the other clears 9–15. After clearing their assigned group, a player wins by legally pocketing the 8-ball in their declared pocket. Carom billiards, snooker, and 9-ball would require separate specifications.

## 2. Exact rules

- Start with a cue ball and 15 object balls. Rack the 8-ball in the center and one solid and one stripe in the two rear corners; randomize the remaining valid positions.
- Choose the opening breaker randomly; alternate the breaker on rematches. The breaker places the cue ball behind the head string, then chooses direction and power.
- A legal break pockets at least one object ball or causes at least four distinct object balls to contact a cushion. If the break is illegal, the incoming player chooses to accept the resulting position with ball in hand, or request a fresh rack and break it themselves.
- The break does not assign groups. An 8-ball pocketed on the break is respotted and is neither an automatic win nor loss. A break scratch gives the incoming player ball in hand. After a legal non-foul break, any pocketed object ball earns another shot.
- While the table is open, the cue ball may first contact a solid or stripe, but not the 8-ball. Groups are assigned after the first legal post-break shot that pockets a solid or stripe.
- When both groups are pocketed on that assigning shot, use the group of the first pocketed non-8 ball; resolve same-timestep pockets by lowest ball number. Clearly record the assignment before the next shot.
- Once groups are assigned, first contact must be with one of the shooter's remaining group balls. When the group is cleared, first contact must be with the 8-ball.
- After first object-ball contact, a ball must be pocketed or at least one ball, including the cue ball, must contact a cushion. Failure is a foul.
- A legal shot pocketing at least one own-group ball earns another shot. A legal shot pocketing none of the shooter's required balls passes the turn. Opponent balls pocketed stay pocketed but do not earn an extra shot.
- Scratching, missing every object ball, first hitting an illegal ball, failing the post-contact cushion/pocket rule, or sending a ball out of bounds is a foul. The opponent receives ball in hand anywhere on the playing surface, with no overlaps. Pocketed solids and stripes stay down; ejected object balls are respotted.
- The 8-ball must be declared for a particular pocket before the winning shot. It is legal only when the shooter's group was already cleared before that shot began. Clearing the last group ball and the 8-ball in one shot loses.
- Pocketing the 8-ball early, in an undeclared or wrong pocket, with any foul, or sending it out of bounds after the break loses the rack immediately. A legal 8-ball pocket in the declared pocket wins. The break's respot rule is the sole exception.
- Other shots do not require declared pockets in this casual variant. Combination shots are allowed when first-contact rules are satisfied. Jump shots and spin controls are outside the first release.
- Resolve the complete shot, including a cue-ball scratch, before awarding a win. No new shot starts until all balls have stopped.

## 3. Player process and flow

1. Open Vihar Games at `https://games.vihar.online` and select Billiards, or visit `/billiards` directly. Choose Play or How to Play.
2. Computer mode: choose Easy, Medium, or Hard and start locally. Practice mode lets one person take repeat shots without group assignment, a turn limit, or competitive results.
3. Pass-and-play: enter optional names, start a rack, and take turns on the same device. Complete all earned extra shots before the other player accepts the handover.
4. Online: enter a nickname and create or join a private two-person room. Share the six-character code or `https://games.vihar.online/billiards/play?room=ABC234`; the host starts when both people have joined.
5. Place the cue ball when entitled, choose aim and power, declare a pocket if shooting the 8-ball, and submit one shot.
6. Resolve the break, group assignment, pockets, foul, ball-in-hand entitlement, and next player automatically. State the rule reason for a foul or loss.
7. Finish the rack with a win or forfeit reason. Offer a new rack, or the online lobby. Both online players accept a rematch before the host starts.

## 4. Sessions, rooms, and interruptions

- Practice, computer, and local two-person matches require no online services. Save settled states locally if storage is available. A local refresh during motion restores the preceding settled state.
- Online guests have automatic persistent anonymous identities and exactly two human seats. Reopen the room in the same browser to recover the same seat and accepted state.
- A submitted online shot resolves on the server even if the shooter disconnects. Rejoining retrieves that outcome; retries cannot submit the shot twice.
- A connected opponent can request forfeit after a 120-second disconnect grace period or 120 seconds of current-turn inactivity since the last accepted action or turn start. Explicit resignation ends immediately. No automatic shot is made for an absent player.
- Host departure transfers hosting in the lobby; during a rack, the remaining player can request transfer after the grace period. Settings and seat changes happen in the lobby only.
- Rooms expire after 24 inactive hours; a room where both people disconnect is recoverable until expiry without an invented result.

## 5. Implementation requirements

- Use the Vihar Games shared stack: latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS, plus the newest stable Node.js supported by Vercel. One root package, lockfile, environment configuration, and Vercel project serve every game. This folder contains this game's specification; it is not a separate application.
- Render this game entirely in 2D using Canvas 2D top-down table, flat ball circles, cue/aim lines, and x/y physics. Do not use WebGL, Three.js, React Three Fiber, 3D models, CSS perspective, or 3D transforms; texture and planar motion must not imply raised or tilted game objects.
- Separate pool rules, deterministic fixed-timestep physics, computer shot search, local persistence, and online authority. Use browser workers for expensive physics and computer search.
- Record ball positions and pocketed status, group assignment, first-contact and cushion events, breaker, turn, ball-in-hand entitlement, declared pocket, revision, and result reason.
- Use Firebase anonymous identity, Realtime Database subscriptions, and Vihar Games Node.js API route handlers at `/api/games/billiards/rooms/<code>/actions` for online play. The server validates cue placement, aim, power, declared pocket, actor, action ID, and expected revision, then simulates and commits the shot atomically.
- Clients submit shot intent, never authoritative pocket counts or results. Replicate accepted shot input and final settled state, avoiding continuous per-frame database writes.
- Bound simulation and compute time. If a shot fails to settle within its defined limit, reject it and restore its prior state without consuming the turn. Use the same collision parameters and event tie-breaks in browser and backend.
- Mount the game overview at `/billiards`, mode selection and play at `/billiards/play`, and rules at `/billiards/how-to-play`. Selecting the game in the shared catalog opens `/billiards`.
- `GET /api/games/billiards` redirects to the game overview. `GET /api/games/billiards/info` returns catalog metadata and supported modes; `GET /api/games/billiards/rules` returns the versioned rules. These public requests do not start a match.
- Create rooms through `POST /api/games/billiards/rooms`, join through `POST /api/games/billiards/rooms/<code>/join`, read member-visible state through `GET /api/games/billiards/rooms/<code>`, and submit mutations through `POST /api/games/billiards/rooms/<code>/actions`. Follow the [shared API contract](../../docs/API_ENDPOINTS.md).
- All game commands execute in the shared Next.js Node.js API layer. Firebase Realtime Database stores durable room state under `games/billiards/rooms/<code>`; realtime listeners receive accepted state. Automatically obtain a Firebase guest ID token for authenticated API requests only when online play is chosen. Game state, room codes, scores, and private information are isolated by the game ID.
- Online authority uses the game's pure rules engine with atomic revision checks and action IDs. For shot simulation, calculate outside the transaction and commit only if its input revision is still current. An accepted shot means its complete settled outcome has been committed; after a lost response, recover that result by action ID before attempting another shot.
- Loaded local modes make no gameplay network requests and tolerate blocked storage. Use versioned local keys prefixed `vihar-games:billiards:`; settings and unfinished games must not overwrite another module's data.
- Use the shared `NEXT_PUBLIC_SITE_URL=https://games.vihar.online` and canonical URL `https://games.vihar.online/billiards`. Index the game overview and rules; exclude play, room URLs, and API routes from the sitemap. Follow the [project plan](../../docs/PROJECT_SPEC.md) and [deployment plan](../../docs/DEPLOYMENT.md).

## 6. Acceptance criteria

- All four modes can complete their intended play flow without a sign-in step on phone and desktop browsers.
- Verify legal and illegal breaks, break scratches, break 8-ball respotting, open-table group assignment, simultaneous assigning pockets, and first-contact rules.
- Verify opponent pockets, ball in hand, cue-ball scratches, early 8-ball, wrong declared pocket, last-group-plus-8 loss, and scratch-on-winning-shot loss.
- Matching browser and backend shot inputs yield matching settled results; results are awarded only after full shot resolution.
- Two browser profiles remain synchronized; duplicate commands and reconnects cannot add shots or change group ownership.
- The game works within the single Vihar Games build and deployment on Vercel; its page and API paths resolve under `games.vihar.online`.
- The catalog entry opens `/billiards`; the launch endpoint redirects there; info and rules endpoints identify this game, and another game's room code or local save cannot affect it.
- Room commands use the documented `/api/games/billiards` namespace, retain guest access without a sign-in form, and reject unsupported game actions.
- All gameplay graphics and transitions remain 2D; verify flat boards/pieces on desktop and mobile, with no raised, extruded, perspective, or semi-3D presentation.
- The Vintage Pool Club presentation keeps balls, solids/stripes, aiming, power, declared pockets, and rule messages readable on mobile and desktop; motion and reduced-motion playback preserve the accepted shot outcome.

## 7. Detailed 2D visual direction — Vintage Pool Club

### 7.1. Mood and palette

The game should feel like a quiet, traditional pool club viewed directly from above. Keep the table central and the surrounding interface compact, with a calm, confident mood.

- Use deep green for the playing surface, a dark charcoal or brown table outline, cream text, and a small amount of muted ochre for active controls.
- A faint felt texture may add character while remaining flat and unobtrusive. Keep the area surrounding the table plain.
- Use the familiar numbered-ball colours together with solid/striped markings. Ball identity must remain clear independently of the surrounding theme palette.
- All artwork stays 2D: the table, cushions, pockets, cue, and balls are flat shapes with no perspective, raised rims, reflections, or spherical shading.

### 7.2. Table, balls, and shot controls

- Draw the overhead table at the physics model's proportions, with six clearly positioned pocket symbols and a thin cushion boundary.
- Render each object ball as a flat numbered circle. Solids and stripes have visibly different fills; the 8-ball is dark with a readable cream number, and the cue ball is plain ivory.
- Keep number labels legible and ball boundaries distinct against the green surface. A simple outline is enough to separate touching balls.
- Use a slim aim line and a flat cue indicator for direction, plus a compact power bar with a readable value or label.
- Highlight the chosen pocket before an 8-ball shot. Show ball-in-hand placement as an outlined cue-ball preview that clearly distinguishes valid and invalid positions.

### 7.3. Pages, typography, and layout

- Carry the green, cream, and understated club accents through the overview, mode setup, rules, table, and result screens.
- Use restrained club-sign lettering for the title and readable live text for player names, difficulty, group assignments, scores, and rule messages.
- Place the player/turn row and remaining-group indicators above the table. Put aim, power, Shoot, and any required pocket declaration controls close to the playing area.
- On narrow screens, place controls below the table and provide a usable landscape layout. Keep the table's proportions and allow 2D magnification when labels or precise cue placement need more room.
- Keep essential controls comfortably sized for touch and expose keyboard focus and accessible shot/status descriptions alongside the drawn table.

### 7.4. Modes and gameplay states

- Computer, practice, pass-and-play, and private rooms share the same table and visual language. Label the opponent and selected difficulty clearly.
- Practice shows its repeat-shot controls without competitive group assignments or an invented win/loss result.
- Show whose turn it is, whether the table is open, each assigned group, ball-in-hand entitlement, and any required pocket declaration using concise text and ball symbols.
- While a shot resolves, retain the table view and show a quiet resolving status. Update pocketed-ball indicators, groups, fouls, and the next player from the settled accepted result.
- Keep foul, scratch, illegal-break choice, respotted 8-ball, and rack-result messages visible beside the table. Pass-and-play handover appears after the shooter's earned shots have ended.

### 7.5. Animation and feedback

- Balls glide along their accepted 2D trajectories. Pocketed balls disappear cleanly at their pockets, and any rule-required respot becomes visible in the settled state.
- The power bar responds directly to adjustment; selection outlines and the active-player underline use brief, gentle transitions.
- Decorative motion never changes shot parameters, physics, group assignment, or scoring. The existing rule that a new shot waits until resolution is complete still applies.
- Respect reduced-motion preferences by simplifying or skipping trajectory playback and showing the accepted settled state with a concise outcome message. Preserve all shot rules and input restrictions.
- Keep menus and status controls responsive during computation and playback, and cancel obsolete visual playback when leaving or restoring the game.

### 7.6. Planned artwork handoff

Prepare flat table/cushion/pocket paths, subtle felt texture, cue and aim indicators, solid/striped numbered ball symbols, group indicators, and simple selection outlines. Use Canvas 2D or equivalent flat graphics for gameplay, with accessible live text for controls and outcomes. These are planned assets; this specification does not claim that artwork or gameplay has already been produced.
