# Game sound and music

All eight playable games default to sound and music on. Saved mute choices are preserved. Playback begins after a player interacts, following browser autoplay rules. Missing, damaged, or blocked settings recover to the enabled defaults without preventing play.

Chess, Carrom, and Tic Tac Toe use the shared local Web Audio player in `src/lib/game-audio.ts`. Their original loops are Neem Shade, Veranda Evening, and Notebook Waltz. The speaker button opens independent Sound and Music switches. Chess cues accepted moves, captures, checks, undo and results; Carrom cues the animated strike, pockets and results; Tic Tac Toe cues marks, new rounds and results. Restored positions do not replay old effects.

Sudoku uses its own soft bell cues and slow journal loop, with separate switches, volume and Mute all. Paperwing retains its combined speaker control, airmail waltz and paper effects. Dune Dash and Monsoon Blocks retain independent switches and their original desert/glass soundtracks.

Silk Trail uses original **Mulberry Thread** plucked music, a synthesized mulberry leaf rustle, and one dry wooden end note. Sound and Music have independent switches under `vihar-games:silk-trail:settings:v1`. Audio starts after deliberate interaction and active play, pauses with the garden, and releases sources, scheduling timers, and its context on Exit or navigation. The seeded game generator is independent of audio noise and scheduling.

Each game's preferences stay on this device under its own storage key. Chess, Carrom, Tic Tac Toe and Sudoku use `vihar-games:<game>:audio:v1`; the arcade games keep their existing settings keys. Audio stops on pause, hidden tabs, focus loss, Exit or navigation. Unmounting releases sources, listeners, scheduling timers and the audio context. Audio scheduling never drives game simulation or active-time accounting.

`npm run check` covers preference defaults and saved mutes, independent switches, cleanup, delayed clocks, suspended-context races, device failure, all game engine tests, lint, types and the production build. Browser checks also cover gameplay controls and narrow-screen navigation.
