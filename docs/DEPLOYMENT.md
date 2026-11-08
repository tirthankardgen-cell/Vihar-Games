**Domain:** [games.vihar.online](https://games.vihar.online)

# Vihar Games — Single-project deployment plan

**Status:** Future deployment requirements; no application scaffold or deployment has been created.  
**Project name:** Vihar Games  
**Suggested Vercel project slug:** `vihar-games`  
**Production custom domain:** `games.vihar.online`

## 1. Vercel project boundary

Create one Vercel project for the entire website when implementation is requested. In a repository containing the whole workspace, set the project root to `Vihar Games`. If that directory is the repository root, use the repository root directly.

The root contains one Next.js application, one `package.json`, one lockfile, one Tailwind configuration, and one build pipeline. The twelve game specifications and future source modules belong to that application. None of the individual game folders receives its own Vercel project or package installation.

Keep the sibling `Bap Ka Rasta`, `Game 3`, and `Gulam Chor` directories outside the build root. Their existing deployments, packages, environment files, and data do not become dependencies of Vihar Games.

## 2. Domain and page routing

- Attach only `games.vihar.online` as the production user-facing custom domain for Vihar Games.
- Configure the DNS record that Vercel supplies for that single hostname, then confirm HTTPS.
- Route Chess to `/chess`, Carrom to `/carrom`, and the other ten games to their catalog paths. Every game is a page within this website.
- Serve `/<game-id>/play`, `/<game-id>/how-to-play`, private invites, and `/api/games/<game-id>/...` from the same origin.
- Do not provision individual game subdomains or redirect game pages to separate deployments. Previously proposed individual hostnames are superseded.
- Provider-generated preview URLs may be used for development checks; they are not additional game domains or production catalog destinations.

## 3. Technology and build settings

Resolve the latest stable compatible Next.js App Router, React, TypeScript, and Tailwind CSS versions when implementation starts. Choose the newest stable Node.js release supported by Vercel, verify compatibility with the Firebase SDK and Admin SDK, and lock exact versions once for the shared application.

Planned Vercel settings after implementation:

| Setting | Requirement |
| --- | --- |
| Framework | Next.js |
| Root directory | `Vihar Games` when using the enclosing workspace repository |
| Install | `npm ci` against the shared root lockfile |
| Build | `npm run build` against the shared application |
| Output | Next.js default; do not force a Vite/static output directory |
| API runtime | Node.js for room APIs using Firebase Admin and physics calculations |
| Production custom domain | `games.vihar.online` |

Use shared lint, type-check, rules tests, and build checks before release. Configure bounded function durations after measuring Carrom and Billiards simulations. Lazy-load game bundles, keep computer searches in browser workers, and avoid loading physics engines on unrelated pages.

## 4. Shared environment configuration

These are planned variable names, not credentials to populate during this documentation phase.

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

The production sitemap contains the homepage, twelve game overviews, and twelve rules pages. Exclude play and room URLs, API endpoints, private state, and participant names. Mark play pages `noindex`; send `X-Robots-Tag: noindex` on API responses. Keep metadata and links on the shared production domain.

## 8. Release verification

1. Run the shared lint, type-check, meaningful game-engine tests, and production build.
2. Verify the homepage lists all twelve games and excludes the three earlier projects.
3. Visit every game path directly, including `/chess` and `/carrom`; verify its Play and How to Play routes work on fresh browser visits.
4. Confirm the twelve launch APIs redirect only to their same-site game pages, and metadata/rules APIs match the registry.
5. Complete local games without guest-auth or gameplay API calls. Verify saved Chess, Carrom, and puzzle sessions do not overwrite one another on the shared origin.
6. For the ten multiplayer games, verify create, join, capacity, start, turns, results, rematch, reconnect, and forfeit in independent browser profiles.
7. Verify cross-game room and action isolation, duplicate requests, stale revisions, deterministic settled shots, and private Memory Match identities.
8. Verify the protected cleanup endpoint, expiry rejection, deep-link routing, canonical URLs, and the sitemap.
9. Confirm the only user-facing deployment domain is `games.vihar.online` and no game requires a separate Vercel project.

Do not run deployment commands or create remote resources as part of the current documentation-only request.
