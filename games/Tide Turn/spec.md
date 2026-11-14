# Tide Turn

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `tide-turn` · **Category:** Puzzle · **Players:** One  
**Page:** `/tide-turn` · **API base:** `/api/games/tide-turn`  
**Style:** Brass Water Study · **Inspiration:** Water-jug measuring puzzles

## 1. Identity and experience

Measure an exact amount of water using small brass vessels. Clean silhouettes, visible litre labels, and gently drawn waterlines turn a classic mathematical puzzle into a quiet tabletop study.

Target session: 1–8 minutes. One player, unlimited source/drain, discrete whole-litre states, and no speed requirement. This is measuring logic, not a liquid-sorting colour puzzle or fluid simulation.

## 2. Exact rules

- Each authored level defines two or three labelled vessels, positive integer capacities, an initial volume vector, and an exact target volume vector. Every volume lies between zero and its vessel's capacity.
- **Fill:** Set one selected vessel to full capacity using the source. Filling an already full vessel is illegal/no change.
- **Empty:** Set one selected vessel to zero using the drain. Emptying an already empty vessel is illegal/no change.
- **Pour A→B:** Transfer `min(volume A, capacity B - volume B)` litres. Continue until the source is empty or the destination is full. Partial arbitrary pours are not allowed.
- A pour with no available water or destination space, or a vessel pouring into itself, is illegal and changes no state/count.
- The source is unlimited and draining is allowed at any time. A pour conserves the combined volume of its two vessels; Fill and Empty may change total water.
- Each accepted state-changing fill, empty, or pour is one cumulative action. Animation frames and selecting vessels do not count as actions.
- Victory requires the complete ordered volume vector to equal the target vector. Matching only one vessel is insufficient unless every other target is also satisfied.
- Example: capacities A=3 L, B=5 L, starting `(0, 0)`, target `(0, 4)`. A valid route is Fill B, Pour B→A, Empty A, Pour B→A, Fill B, Pour B→A, Empty A.

## 3. Levels, hints, and records

| Preset | Vessels | Capacities | Challenge |
| --- | --- | --- | --- |
| First measure | 2 | 2–5 litres | Short fill/pour sequences |
| Balance | 2 | 3–9 litres | More precise remainders |
| Water study | 3 | 2–12 litres | Several exact final volumes |

Publish authored levels with stable IDs, capacities, initial/target vectors, and a validated solution. All target vectors must be reachable through the exact operations above; verify with a bounded search over discrete states. Initial state must not already equal target.

Show current/target values and cumulative actions; active time is optional. A Hint describes one valid next action from a solved search of the current state, increases hint count, and marks assistance. Undo/redo restore vectors without reducing cumulative actions/time. Results record level, actions, hints, time, and assistance; compare personal records only for the same level/version.

## 4. Controls and interruption

- Each vessel has explicit Fill and Empty buttons. Pour uses a selected source and selected destination, with a visible **Pour A into B** confirmation action. A selection alone does not transfer water.
- Keyboard users navigate the same controls; vessel labels include capacity, current volume, and target volume. Do not require dragging water to play.
- Optional drag-to-pour must resolve into exactly the same full-transfer command and show the destination before acceptance.
- Commit volume changes immediately; decorative waterline movement cannot accept a duplicate operation or block a subsequent valid action.
- Pause freezes active time and decorative movement. Resize retains vessel ordering and labels. A restart restores the level's initial vector.

## 5. Detailed 2D visual direction — Brass Water Study

- Palette: warm ivory `#F5EDDC`, dark umber `#493D2F`, matte brass `#B49351`, water teal `#5B959A`, pale blue `#D7E5E1`.
- Draw vessels as flat outlined measuring silhouettes with no 3D cylinder, reflected room, or physical fluid rendering. Capacity and current litres are live numerals outside the outline.
- Water is one flat teal region with a crisp horizontal level; add fine litre tick marks and a target notch with a letter/symbol so correctness does not depend on colour alone.
- Distinguish vessel A/B/C with stable labels and different top silhouettes while keeping capacity proportions readable. No hidden volume rounding or ambiguous perspective waterline.
- Overview resembles an original brassware catalogue plate. Setup presents numbered study cards. Play lays vessels in a stable row on desktop or a labelled wrapping row on phones; the complete target vector remains visible.
- Results show a simple balanced-water seal. Pour feedback uses a brief planar line between vessels and waterline transition; reduced motion updates the values immediately.
- Optional sound: soft single pour and dry drain notes, muted initially; no continuous water loop.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Store level ID/version, current vector, undo/redo action transactions, cumulative actions, hints, active time, and assistance. Validate integer volumes/capacities and derive completion from the actual vector. Persist no intermediate animation volume.

## 7. Future asset handoff

Two/three original vessel silhouettes, capacity ticks, source/drain symbols, study cards, exact reachable level vectors with solutions, water seal, and optional sounds. Engines, artwork, and fluid-like transitions remain future work.

## 8. Acceptance when implemented

- Fill/Empty/Pour handle boundary/no-op cases and transfer the exact maximum legal integer amount.
- Pour conserves water; victory checks every target entry.
- Every authored target is reachable and hints return legal current-state actions.
- Selection, animation, undo, save restoration, and all input methods preserve one-action semantics.
