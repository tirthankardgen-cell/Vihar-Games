**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Single-project deployment plan

**Status:** Chess, Tic Tac Toe, Carrom, and Paperwing's local modes and Vihar embedded integration are implemented. Private rooms and game-host Firebase setup remain deferred. The existing Vihar account service supplies optional scoped activity launches; direct guest play needs no backend configuration.

**Project name:** Vihar Games  
**Suggested Vercel project slug:** `vihar-games`  
**Production custom domain:** `games.vihar.online`

**Presentation:** All twenty-four games are 2D only; the single website does not require a 3D rendering engine or modeled gameplay assets.

## Deploy the current scaffold

1. With Node.js 26.13.0 (or a newer stable 26.x patch), run `npm ci` and `npm run check` in the Vihar Games directory.
2. Push this repository to a Git provider and import it into Vercel as one Next.js project.
3. The current Git root is this directory. Keep Vercel's Root Directory at the repository root (`.`). If you instead use a repository containing the whole Games workspace, select `Vihar Games`.
4. Select Node.js **26.x**, install with **`npm ci`**, build with **`npm run build`**, and keep Next.js's default output. `vercel.json` supplies the framework and commands; `package.json` supplies the Node.js major.
5. Deploy and attach `games.vihar.online`. Add the exact DNS record Vercel shows for that hostname and confirm HTTPS.

The scaffold needs no secrets, Firebase project, or cron. `NEXT_PUBLIC_SITE_URL` is optional and defaults to `https://games.vihar.online`; `.env.example` documents it. Public metadata uses the production canonical URL on provider previews as well. Configure the variables in sections 4–6 when online gameplay is implemented.

Next.js **16.4.5** and stable Node.js **26.13.0** were verified online on **8 November 2026**. Vercel lists **26.x** as its default supported runtime. Exact Next.js/React/TypeScript/Tailwind/ESLint versions are locked in the package and lockfile; see [the version table and sources](../README.md#versions-verified-online). Node.js 27 alpha is excluded as a prerelease. Hind and Yatra One are bundled with their font licenses, so builds do not fetch fonts.

## 1. Vercel project boundary

Chess, Tic Tac Toe, Carrom, and Paperwing play routes send `Content-Security-Policy: frame-ancestors 'self' https://vihar.online`, without conflicting X-Frame-Options. Their public manifests advertise `embedVersion: 1`. The shared `useViharPlay` hook uses unchanged copies of Vihar's public `/sdk/vihar-id.js` and `/sdk/vihar-embed.js` under `src/lib/vihar-sdk/`; keep these synchronized when the Vihar protocol changes. Menus, handovers, paused/hidden rounds and chess practice do not credit play time. Exiting flushes the game-owned session; Vihar bounds the wait. Credentials stay in the existing SDK and never cross UI messages. Record releases and verification in the Vihar website's single `development.md`.

Create one Vercel project for the entire website. In a repository containing the whole workspace, set the project root to `Vihar Games`. If that directory is the repository root, use the repository root directly.

The root contains one Next.js application, one `package.json`, one lockfile, one Tailwind CSS 4/PostCSS configuration, and one build pipeline. The twenty-four game specifications and future source modules belong to that application. None of the individual game folders receives its own Vercel project or package installation.

Keep the sibling `Bap Ka Rasta`, `Game 3`, and `Gulam Chor` directories outside the build root. Their existing deployments, packages, environment files, and data do not become dependencies of Vihar Games.

## 2. Domain and page routing

- Attach only `games.vihar.online` as the production user-facing custom domain for Vihar Games.
- Configure the DNS record that Vercel supplies for that single hostname, then confirm HTTPS.
- Route Chess to `/chess`, Carrom to `/carrom`, and the other ten games to their catalog paths. Every game is a page within this website.
- Serve `/<game-id>/play`, `/<game-id>/how-to-play`, private invites, and `/api/games/<game-id>/...` from the same origin.
- Do not provision individual game subdomains or redirect game pages to separate deployments. Previously proposed individual hostnames are superseded.
- Provider-generated preview URLs may be used for development checks; they are not additional game domains or production catalog destinations.

## 3. Technology and build settings

The scaffold pins the online-verified stable Next.js App Router, React, TypeScript, and Tailwind CSS releases and the newest stable Node.js major supported by Vercel. Verify Firebase SDK and Admin SDK compatibility when adding multiplayer dependencies.

Vercel settings for the current application:

| Setting | Requirement |
| --- | --- |
| Framework | Next.js |
| Root directory | `Vihar Games` when using the enclosing workspace repository |
| Install | `npm ci` against the shared root lockfile |
| Build | `npm run build` against the shared application |
| Output | Next.js default; do not force a Vite/static output directory |
| API runtime | Node.js for room APIs using Firebase Admin and physics calculations |
| Production custom domain | `games.vihar.online` |

Use shared lint, type-check, rules tests, and build checks before release. Configure bounded function durations after measuring Carrom and Billiards 2D simulations. Use HTML, SVG, or Canvas 2D renderers without WebGL/3D dependencies. Lazy-load game bundles, keep computer searches in browser workers, and avoid loading physics engines on unrelated pages.

## 4. Shared environment configuration

Only `NEXT_PUBLIC_SITE_URL` is used by the current scaffold. The Firebase and scheduler variables below are planned for the multiplayer phase.

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Exactly `https://games.vihar.online` in production |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public web client configuration for guest authentication |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase provider auth configuration |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Shared Vihar Games backend project |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Shared Realtime Database endpoint |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public Firebase web application identifier |
| `FIREBASE_PROJECT_ID` | Server-side Admin SDK project ID |
| `FIREBASE_CLIENT_EMAIL` | Server-only service identity email |
| `FIREBASE_PRIVATE_KEY` | Server-only service identity private key, parsed with correct newlines |
| `CRON_SECRET` | Server-only scheduler authorization secret |

Store server credentials only in server-side Vercel variables or an equivalent managed identity integration. Never prefix administrator credentials with `NEXT_PUBLIC_` or expose them to the browser. Use one environment set per Vercel environment, not separate per-game `.env` files.

Production and preview must use deliberately isolated backend data or separate backend projects; preview checks must not mutate production rooms. Local emulator settings are development-only. Do not copy the existing Gulam Chor service configuration into this project by default.

## 5. Online backend and authority

Use one shared Firebase project for Vihar Games guest authentication and durable Realtime Database room storage. Enable anonymous authentication and authorize `games.vihar.online`; add only controlled development origins as needed.

All per-game room commands are Next.js API handlers in this same Vercel project. They verify guest tokens and apply the correct pure rules engine using Firebase Admin transactions. Firebase provides managed storage and subscription transport; it does not create a second game website. Per-game Cloud Functions deployments are not required by this plan.

Namespace rooms, members, owner records, presence, receipts, and hidden authoritative state by game ID. Rules deny direct client writes to game state and allow reads only for the relevant members and permitted fields. Presence writes, if used, are restricted to the authenticated seat and cannot advance a turn or renew room expiry.

Validate exact player limits, same-browser recovery, ID-token expiration/refresh, host transfer, 120-second deadline requests, and 24-hour inactivity expiry. API instance restarts and website redeploys must not destroy active rooms. Do not rely on a persistent in-memory room server or WebSocket process in a Vercel function.

## 6. Scheduled cleanup

When implementing, schedule one daily call to `GET /api/internal/cleanup-rooms` through the Vercel project's supported scheduler. Require `Authorization: Bearer <CRON_SECRET>`.

Scan at most 500 candidate expired rooms across all games per invocation. Use expiry indexes and a persisted cursor to continue bounded scanning fairly. Recheck each expiry during conditional deletion so a newly renewed room survives. Clean related action/owner records in bounded work as well. Unfinished work resumes on the next scheduled invocation; an expired room is rejected by the API even before physical deletion.

Per-room turn deadlines and Memory Match's mismatch deadlines are evaluated on requests. Do not run a per-second background job for each room.

## 7. Canonical URLs and public indexing

Set the site canonical to `https://games.vihar.online` and each game canonical to its path, including `https://games.vihar.online/chess` and `https://games.vihar.online/carrom`. Rules pages have separate canonical URLs ending in `/how-to-play`.

The current sitemap contains the homepage, twenty-four game overviews, and Chess, Tic Tac Toe, Carrom, and Paperwing's published rules pages. Other rules placeholders are `noindex` and join the sitemap when real rules are published. The completed production sitemap will contain the homepage, twenty-four overviews, and twenty-four rules pages. Exclude play and room URLs, API endpoints, private state, and participant names. Mark play pages `noindex`; send `X-Robots-Tag: noindex` on API responses. Keep metadata and links on the shared production domain.

## 8. Release verification

For the scaffold, verify lint, type checking, production build, all twenty-four overview/play/rules-placeholder paths, catalog and info JSON, launch redirects, unknown-game 404s, API `noindex` headers, canonical URLs, and the initial sitemap. Check the catalog on desktop and phone widths. The gameplay and backend checks below apply as their implementations arrive.

1. Run the shared lint, type-check, meaningful game-engine tests, and production build.
2. Verify the homepage lists all twenty-four games and excludes the three earlier projects.
3. Visit every game path directly, including `/chess` and `/carrom`; verify its Play and How to Play routes work on fresh browser visits.
4. Confirm the twenty-four launch APIs redirect only to their same-site game pages, and metadata/rules APIs match the registry.
5. Complete local games without guest-auth or gameplay API calls. Verify saved Chess, Carrom, and puzzle sessions do not overwrite one another on the shared origin.
6. For the ten multiplayer games, verify create, join, capacity, start, turns, results, rematch, reconnect, and forfeit in independent browser profiles.
7. Verify cross-game room and action isolation, duplicate requests, stale revisions, deterministic settled shots, and private Memory Match identities.
8. Verify the protected cleanup endpoint, expiry rejection, deep-link routing, canonical URLs, and the sitemap.
9. Confirm the only user-facing deployment domain is `games.vihar.online` and no game requires a separate Vercel project.
10. Verify every game is flat 2D, with no 3D/semi-3D board, token, die, or card effect. Compare Chess, Carrom, and Ludo with their Gulam Chor-inspired artwork handoffs and check phone readability, focus, and reduced-motion behavior.

Scaffolding prepares the local application and deployment settings. The user can import and deploy the ready repository to Vercel using the steps above.
