# Rangoli Loops

**Status:** Planned; catalog and specification only.  
**Updated:** 14 November 2026  
**Game ID:** `rangoli-loops` · **Category:** Puzzle · **Players:** One  
**Page:** `/rangoli-loops` · **API base:** `/api/games/rangoli-loops`  
**Style:** Chalk Threshold · **Inspiration:** Slitherlink-style loop deduction

## 1. Identity and experience

Draw one closed line across a dotted grid using numbered clues. Original threshold-pattern framing and a fine chalk line give the familiar loop puzzle a calm rangoli-inspired identity.

Target session: 3–15 minutes. One player solves a fixed logical layout. Decoration is a margin motif; it never adds rule-relevant edges or clues.

## 2. Exact rules

- An `N×N` cell grid has `(N+1)×(N+1)` vertices. Candidate edges connect only adjacent horizontal/vertical vertices; there are no diagonals.
- Each edge has Unknown, Line, or Crossed-out state. Crossed-out is a player note; only Line edges are part of the candidate solution.
- A cell clue is `0`, `1`, `2`, or `3`, or blank. A numbered cell must have exactly that many Line edges along its four sides. A blank cell imposes no local edge-count constraint.
- All Line edges must form exactly one nonempty closed connected loop. At each vertex the Line degree must be zero or two; endpoints, branching degree three/four, crossings, and separate loops are invalid.
- The loop may touch the outer boundary and need not visit every vertex/cell. It must not cross or share an intersection with itself.
- Victory checks all numbered clues, degree conditions, and connectedness. Unknown unused edges may remain Unknown; every edge outside the completed loop is logically unused regardless of player notes.
- A small closed loop is not automatically a win if another clue is unmet. A degree-four intersection or two independently valid loops is not accepted.
- Optional Check highlights currently exceeded clue counts or vertex degrees above two; it does not fill unknown edges, reveal the solution, or penalize marks. Incomplete counts/endpoints can still be edited and are not a lost game.

## 3. Levels, hints, and ending

| Preset | Cell grid | Intended use |
| --- | --- | --- |
| Doorstep | 5×5 | Introductory clues |
| Courtyard line | 7×7 | Default deduction |
| Festival pattern | 10×10 | Longer reasoning |

Each authored puzzle contains stable ID, dimensions, immutable clue matrix, a single validated solution edge set, and uniqueness validation under these exact rules. Do not assume a picture-shaped loop is unique just because it looks appealing.

Record edit actions, optional active time, and hints. Each edge state change counts as one cumulative edit; illegal/non-edge selection counts nothing. Undo/redo retain cumulative counters. Hint sets one selected edge to Line or Crossed-out using the verified solution and marks assistance. Results show puzzle, time, edits, hints, and assisted/unassisted completion; there is no score for drawing more lines.

## 4. Controls and editing

- Tap/click an edge cycles Unknown→Line→Crossed-out→Unknown. Provide direct Line, Cross, and Erase tools as an accessible alternative.
- Keyboard users navigate candidate edges in a documented horizontal/vertical order; Enter/Space cycles, L sets Line, X crosses, Delete clears. Labels identify both endpoint coordinates and current state.
- Touch targets belong to edge midpoints and must not ambiguously activate adjoining edges. Use optional zoom and an edge-focused magnifier on dense boards; no freehand gesture is required.
- One drag-paint gesture with a selected tool is a single undo transaction while cumulative edits still count changed edges. Never draw unselected diagonal shortcuts.
- Pause freezes time and unfinished decorative chalk motion. Resize/zoom preserves vertex coordinates and clue positions.

## 5. Detailed 2D visual direction — Chalk Threshold

- Palette: muted aubergine `#493D4E`, limestone `#F0E9D9`, chalk white `#FFF9EE`, dusty rose `#B88789`, pale saffron `#C5A367`.
- Keep the grid on light limestone paper with dark live clue numerals and fine dots. The active loop is a crisp dark chalk-like stroke; texture is restrained enough to preserve edge continuity.
- Crossed-out edges use a small X at their midpoint. Unknown edges are faint guide lines. Focus/selection uses a clear contrasting outline rather than a colour-only glow.
- Place original rangoli corner motifs outside the logical grid. They must not connect to vertices or resemble clues, playable edges, or a revealed solution.
- Overview is one small abstract dotted pattern. Setup resembles three threshold study sheets. Play keeps tools below the grid and status above. Results present the completed loop with a quiet decorative border.
- Draw accepted edges with a short planar stroke; reduced motion is immediate. No confetti, pulsing background, camera movement, or animated clue disappearance.
- Dense phone boards pan/zoom with persistent tool access and visible clue labels. Desktop centres a larger sheet with generous clue clearance.
- Optional sound: a light chalk tap and one soft finishing note, with no compulsory drawing noise.

## 6. State and shared requirements

Follow [solo game standards](../../docs/SOLO_GAME_STANDARDS.md). Store puzzle ID/version, edge-state arrays, undo/redo transactions, cumulative edits, active time, hints, and assistance. Validate array geometry and immutable clue data. Derive victory through graph traversal/counts, not saved completion flags or matching decorative artwork.

## 7. Future asset handoff

Original dotted-grid/chalk styles, cross and focus marks, three corner-pattern families, authored unique clue grids, completion border, and optional sounds. Rules engine and custom screens remain future work.

## 8. Acceptance when implemented

- Number counts, degree rules, single-loop connectivity, blanks, and boundary edges obey the published rules.
- Separate loops, endpoints, intersections, and unmet clues cannot report completion.
- Each shipped clue layout has exactly one verified loop solution.
- Touch edge selection, keyboard navigation, drag undo, hints, pause, and save validation preserve the graph.
