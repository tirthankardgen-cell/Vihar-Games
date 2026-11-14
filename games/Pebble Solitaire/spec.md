# Pebble Solitaire

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `pebble-solitaire` · **Category:** Puzzle · **Players:** One  
**Page:** `/pebble-solitaire` · **API base:** `/api/games/pebble-solitaire`  
**Style:** Riverstone Tray · **Inspiration:** English peg solitaire

## 1. Identity and experience

Jump smooth river pebbles over each other on a flat cross-shaped tray. Sparse stone outlines, river-paper colours, and an uncluttered board support patient planning.

Target session: 3–15 minutes. One player removes pebbles through jumps; there is no opponent, rolling die, diagonal capture, or time limit.

## 2. Exact rules

- Use a 7×7 coordinate frame with 33 valid holes: columns 2–4 on rows 0, 1, 5, and 6; all seven columns on rows 2, 3, and 4. Other positions are outside the board.
- Classic starts with a pebble in every valid hole except the centre `(3, 3)`, leaving 32 pebbles.
- A legal jump moves one pebble exactly two cells orthogonally into an empty valid hole, over one occupied valid hole midway. Source becomes empty, midpoint pebble is removed, destination becomes occupied.
- Diagonal jumps, longer jumps, jumping over an empty hole, jumping off the board, or landing on another pebble are illegal.
- Each accepted jump removes exactly one pebble. Multi-jump sequences are separate actions, not compulsory captures or a single uncounted chain.
- Victory requires exactly one remaining pebble at the centre. One pebble elsewhere is **One stone, wrong resting place**, not a win.
- If no legal jump exists and victory is unmet, show **No jumps left** with remaining count and Undo/Restart. The puzzle remains recoverable; there is no lost life or automatic reshuffle.
- Selected pebbles and legal landing hints do not change state. A player-selected valid landing performs one jump.

## 3. Presets, progress, and assistance

| Preset | Starting layout | Purpose |
| --- | --- | --- |
| First stones | Authored partial layouts with 4–8 pebbles | Learn small sequences |
| River study | Authored partial layouts with 10–16 pebbles | Plan a central finish |
| Classic cross | Full 32-pebble start | Standard complete challenge |

All presets use the same 33-hole geometry and centre goal. Each authored partial layout and the classic start need a verified solution ending at `(3, 3)`.

Display pebbles remaining, cumulative jumps, and optional active time. A solution from the classic start uses 31 removals; undo may make cumulative jumps greater without changing the victory requirement. Results show layout, remaining pebble position, jumps, time, hints, and assistance. Keep completed layouts and personal times locally; do not imply that faster play changes the rules.

Undo/redo restore full jump transactions while retaining cumulative counters/time. Hint highlights one verified legal source/destination for a current-state solution and marks assistance. Showing all presently legal destinations for a selected pebble is normal move guidance and does not mark assistance.

## 4. Controls and interruption

- Tap/click a pebble, then an outlined legal empty destination. Selecting a different pebble changes selection; selecting an invalid hole performs no move.
- Arrow keys navigate valid holes, Enter/Space selects/lands, Escape clears selection or pauses when nothing is selected. Pause also has its own visible control.
- Labels state coordinates, pebble/empty state, selection, and legal landing. Ignore positions outside the cross.
- After a jump, retain selection at the destination if another legal jump exists, but require a new intentional landing selection for the next jump.
- Pause freezes active time; reload restores the same occupancy. Undo/Restart clears outdated selection and landing markers.

## 5. Detailed 2D visual direction — Riverstone Tray

- Palette: river paper `#EAEFE7`, charcoal stone `#344A4C`, soft grey `#ABB7AD`, reed green `#78917C`, sand `#C6B78F`.
- The cross is a flat ink outline containing thin circular hole marks. Occupied pebbles are dark flat ellipses with one subtle engraved ripple; holes remain identifiable beneath selection.
- Use a distinct centre ring and small centre label. Selected stone has a solid outline; legal destination has a dashed ring plus dot. Removed stones disappear from the board without resembling new holes.
- Decorative reed strokes and river lines stay outside the valid holes. No polished 3D stones, lighting gradients implying depth, raised wooden tray, or shadows masking holes.
- Overview is a sparse pebble arrangement. Setup presents three river-study cards. Play centres the full cross with remaining count above and Undo/Hint below. Results show one flat ripple around the centre or a clear unsolved position.
- Animate jumps by a straight planar slide and a quiet midpoint fade. Reduced motion resolves immediately. Never animate multiple jumps without input.
- Phone layout keeps all 33 holes visible and comfortably selectable; desktop adds quiet margins. Optional sound is a small stone tap and a single completion tone.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Store layout ID/version, valid-hole occupancy, jump undo/redo transactions, cumulative jumps, active time, hints, and assistance. Validate geometry and occupied-count transitions. Derive no-move/victory status from occupancy, never a saved result label.

## 7. Future asset handoff

Original pebble and empty-hole symbols, cross/ripple/reed frame, study cards, authored central-finish solutions, completion mark, and optional sounds. No engine or playable interface is included now.

## 8. Acceptance when implemented

- Valid-hole geometry, midpoint removal, orthogonal jumps, and centre-only victory are exact.
- No-jump positions and a single off-centre stone remain unsolved and recoverable.
- Every initial layout has a verified central-finish solution.
- Selection, repeated jumps, undo, hints, saves, and input methods preserve occupancy and counters.
