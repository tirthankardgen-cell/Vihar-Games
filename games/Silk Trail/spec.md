# Silk Trail

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `silk-trail` · **Category:** Arcade · **Players:** One  
**Page:** `/silk-trail` · **API base:** `/api/games/silk-trail`  
**Style:** Silk Garden · **Inspiration:** Classic snake

## 1. Identity and experience

A slender illustrated garden snake gathers mulberry leaves across a silk-patterned square. The pleasure comes from clean turns, deliberate routes, and growing into the space. Keep the classic snake rules immediately understandable.

Target session: 1–5 minutes. Every run has a defined end through collision or filling the garden. No opponent, combat, levels, power-ups, or online mode.

## 2. Exact rules

- The logical garden has 20 columns and 20 rows, indexed from zero. Walls are solid; there is no edge wrapping or obstacle inside the grid.
- Start with the head at `(10, 10)` and body cells `(9, 10)` and `(8, 10)`, facing right. The first leaf occupies a uniformly sampled empty cell using the run's seeded generator.
- Each simulation tick moves the head exactly one orthogonal cell. Without a leaf, remove the old tail after moving. With a leaf, retain the tail, grow by one cell, and add one point.
- Moving beyond the board or into an occupied body cell ends the run immediately. Moving into the old tail cell is legal only on a non-growing move, because that tail vacates in the same tick.
- Spawn exactly one new leaf on an empty cell after eating. A leaf cannot move, expire, or appear under the snake.
- At length 400 the player wins **Garden complete**. Do not try to sample another leaf from the full board. Starting length three means the maximum score is 397.
- Never reverse directly into the neck. Apply at most one accepted turn per simulation tick. A two-turn queue may buffer rapid input; validate each queued turn against the direction preceding it and ignore overflow/repeated/reverse turns.

## 3. Presets, score, and results

| Preset | Movement rate | Purpose |
| --- | --- | --- |
| Calm | 5 cells/second | A slower introduction |
| Flow | 8 cells/second | Default classic rhythm |
| Swift | 11 cells/second | Short reflex challenge |

Speed stays fixed throughout a run. Score counts leaves only. Results show leaves, final length, active time, ending reason, and that preset's local best. No time bonus or extra life. Play again starts a fresh seed with the same preset.

## 4. Controls and interruption

- Arrow keys or WASD choose direction; touch offers a four-way pad and optional deliberate swipes; pointer users use the same labelled pad.
- Space or Escape pauses while running. Starting and resuming follow the deliberate Ready/countdown flow in the shared standards.
- Swipes belong to the play surface and must not intercept page navigation outside it. Ignore diagonal ambiguity and very short accidental gestures.
- Resizing preserves the 20×20 grid, direction, queue, leaf, and score. Pausing freezes the tick accumulator and clears the input queue.

## 5. Detailed 2D visual direction — Silk Garden

- Palette: parchment `#F5EFDC`, deep mulberry `#304B3B`, sage `#A8BA97`, copper `#A45E47`; use dark ink for readable controls.
- Frame the play surface like a flat silk panel with a fine woven border. Grid marks remain faint and consistent; decorative leaf printing belongs in the margins.
- Draw the snake as connected rounded green segments with a distinct head, small eyes, and a subtle repeating stitch mark. Keep all collision cells exactly square despite rounded artwork.
- Leaves use a copper stem and light veining, visibly distinct from both snake and empty cells through silhouette and outline. The head direction remains readable without relying on colour.
- Overview: one curled snake illustration and a short invitation. Setup: three swatches for the movement presets. Play: score and pause above the framed garden. Results: a flat stitched ribbon with the achieved length.
- Necessary movement is a short planar step or interpolation between authoritative ticks; eating adds a brief outline. No elastic stretching that conceals occupied cells, particle shower, or flashing loss screen.
- Phone layout keeps the entire garden visible with the direction pad below. Wider screens centre the panel with generous paper margins. Provide an optional larger grid view without changing coordinates.
- Optional sound: soft leaf rustle and one dry wooden end note, with visible score/end feedback.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). A future save contains the ordered distinct body cells, direction, tick remainder, leaf or completed flag, seed/generator state, preset, score, and active time. Validate adjacency, bounds, length/score agreement, and that the leaf is unoccupied. Restore paused with an empty input queue.

## 7. Future asset handoff

Original snake head/segment SVGs, mulberry leaf, silk border repeat, preset marks, completion ribbon, and two optional sounds. These are planned assets; no engine or custom play interface ships with this specification.

## 8. Acceptance when implemented

- Tail-vacating moves work; neck reversal, queued reversal, wall contact, and true self-collision behave exactly as above.
- Leaves always occupy a valid empty cell; growth and score advance once per leaf.
- A full board ends cleanly at length 400/score 397.
- Input, pause, save restoration, and movement rate agree across keyboard, touch, resizing, and different refresh rates.
