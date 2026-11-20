# Lantern Logic release verification

Verified 20 November 2026 with Node.js 26.13.1, npm 11.20.0, and Playwright CLI / Chromium 157.

## Automated release checks

- Shared lint and TypeScript checks passed.
- The full test suite passed: 184 tests, including 10 Lantern Logic engine, persistence, uniqueness, and audio checks.
- The optimized Next.js production build passed. After the short-screen board adjustment, the production build and its TypeScript check passed again.
- Each authored stencil (`ll-s01`, `ll-w01`, `ll-f01`) has derived row/column clues and exactly one solution, independently counted by exhaustive line search. The validator also detects ambiguous and impossible test cases.
- Engine checks cover ordered runs, separators, zero lines, incomplete-line checks, explicit classification of every cell, result input rejection, drag transactions, undo/redo, cumulative hints, paused time, corrupt saves, saved mute choices, and deduplicated assisted/unassisted records.
- Audio checks cover enabled defaults, delayed clocks, separate mute switches, source/timer cleanup, suspended contexts, and recoverable device failures.

The release was built in an ignored isolated snapshot to preserve another game's concurrent work in the shared checkout. No alternate deployment or application was added.

## Browser presentation and play

| Layout viewport | Verified use |
| --- | --- |
| 1440 × 900 | Desktop |
| 390 × 844 | Phone portrait |
| 320 × 568 | Narrow phone |
| 667 × 375 | Short landscape |
| 640 × 360 | Short player layout |
| 720 × 450 | Reduced layout viewport equivalent to 200% zoom on a 1440 × 900 display |

Overview, setup, active Festival board, pause, zoom, audio settings, twelve paged rules notes, results, records, and confirmations fit without browser-page scrolling. Essential actions stay within the viewport. Dense boards pan inside their fixed area. Cells have a minimum size; Larger cells uses 44-pixel cells and pinned row/column clues. Very short screens use compact clue gutters.

Production-browser checks passed for pointer marking in all six layouts, enlarged-cell pointer marking, keyboard navigation and editing, orientation changes without state reset, pause, and enabled audio defaults. A separate touch context verified Lit and Empty tools on a phone. Mouse dragging, one-gesture undo/redo, Check without assistance, selected-cell hints, cumulative assistance, paused reloads, persistent independent mutes, and a complete Small glow picture reveal were also verified through the UI.

Restart and new-puzzle confirmations preserve progress when cancelled and reset the intended run when confirmed. Reduced motion removes the fill animation. A malformed save offers a fresh puzzle instead of blocking play. Before completion, cell labels expose coordinates and player marks only, and the picture title remains concealed.

## Vihar and public routes

A 640 × 360 iframe using simulated production origins and the existing Vihar v1 bridge passed ready, pointer input, larger-cell input, host visibility pause, explicit resume, cross-game message isolation, and Exit. Host pause concealed the board and froze active time. Returning visibility alone did not resume. Guest embedding needs no account or gameplay backend.

Production `/api/games/lantern-logic/info` advertises solo play, all three presets, board sizes 5/10/15, rules `2026-11-20`, embed v1, null multiplayer limits, and no room actions. `/rules` publishes six sections. The rules page is in the sitemap, the play page is noindex, and the play response carries `frame-ancestors 'self' https://vihar.online`.

Local screenshots and CLI QA artifacts are retained in ignored `output/playwright/`. Music and effects are original local Web Audio synthesis; preferences default to enabled after interaction, and saved mute choices persist.
