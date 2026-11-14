# Carrom — the Veranda Club

The November 2026 refresh gives Carrom its own evening setting while keeping Vihar's warm Indian illustration style. The original flat SVG veranda uses teal plaster, arched cane windows, a brass lamp, patterned tiles, plants, and a small chai table. It replaces the Gulam Chor courtyard backdrop for Carrom. The board stays square, flat, and directly overhead.

## Screens and controls

- The cover has one invitation to play and one How to play link in navigation.
- Three playable tables lead to computer, practice, and pass-and-play setup. Private room is a non-interactive group marked Coming soon, with a conversation icon and no create/join actions. A room URL returns to these available tables with an explanatory message.
- Setup uses compact radio cards, labelled icons, editable player names, and clear coin selections. Layouts use the available viewport height as well as width; decorative material is reduced on short screens.
- Every Carrom screen fits one viewport. On phones, the board uses the space left by the controls, including handovers and results. Short phone screens use compact mode rows; rules and longer shot reports have page controls.
- Keep the original shot gesture: slide the striker along the baseline, pull back to aim and set power, then release to shoot. Sliding alone never fires. Returning to the striker, pointer cancellation, or losing capture cancels the pull. A second touch cannot replace the active gesture.
- The segmented force meter shows the current shot from 0% to 100%, with a numeric value and gentle/steady/strong descriptions. Zero disables Strike. Adjust aim and Board options retain keyboard-accessible controls. These are optional alternatives to the original gesture.
- Ravi Mehta is an illustrated, fictional computer opponent at all three difficulties. His expressions and local comments respond to thinking, shots, fouls, queen cover, and the winner. Old computer saves gain his name without changing the human player or match.
- Pocket rings and a brief result celebration add feedback. Reduced motion disables decoration and immediately displays the accepted settled shot. Commentary and animation never change the rules or the physics.

## Board geometry

`src/games/carrom/geometry.ts` owns the playing edges, pocket radius, and four pocket centers. The circular openings meet both neighboring rails. Rendering, simulation, computer targeting, persistence bounds, and the aiming guide use those same values. The darker wood, fine grain, red baseline centers, and central compass are flat artwork.

## Interaction references checked on 14 November 2026

- [8 Ball Billiards Classic on CrazyGames](https://www.crazygames.com/game/8-ball-billiards-classic): its published controls describe dragging backward to set power and releasing to shoot, with a visual aiming guide. This supports preserving the familiar pull-and-release gesture.
- [Carrom Multiplayer on Poki](https://poki.com/en/g/carrom-multiplayer): its published controls also use direction selection followed by dragging and releasing for shot strength. Its separate solo, local, and online modes informed the clear separation between playable local tables and unavailable private rooms.
- Vihar's Chess opponent supplied the precedent for a consistent named, illustrated character. Carrom has its own portrait, identity, reactions, and background.

The meter, artwork, and interface are original to this project; no third-party game assets are bundled.

## Verification

The engine suite includes all four corrected pocket openings, real simulated potting, matching guide endpoints, old-save migration, and correct commentary for either coin color. Browser checks cover viewport bounds, setup selections, retained drag gestures, zero/full power, computer turns, handover, saved boards, results, keyboard controls, and reduced motion.

Verified on 14 November 2026 with Node 26: repository lint, route generation, TypeScript, all 68 engine tests, and the production build pass. Browser verification passed 272 layout checks across nine viewport sizes from 320 × 568 to 1920 × 948, plus 44 gameplay checks with no browser errors. A full-power pull on the smallest phone viewport also keeps the board stationary and every action in view.
