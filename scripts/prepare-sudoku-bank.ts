// Run with Node 26: node --experimental-strip-types scripts/prepare-sudoku-bank.ts
// Reproducible offline preparation; no generation or search ships in the player.
import { writeFileSync } from "node:fs";
import { solve, ratePuzzle, type Difficulty } from "../src/games/sudoku/solver.ts";

let seed = 0x514a2026;
const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
const shuffle = <T,>(values: T[]): T[] => {
  for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
  return values;
};
const bank: { id: string; difficulty: Difficulty; clues: string; solution: string; techniques: string[] }[] = [];
const counts = { easy: 0, medium: 0, hard: 0 };
for (let attempt = 0; attempt < 3000 && Object.values(counts).some((n) => n < 6); attempt++) {
  const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const rows = shuffle([0, 1, 2]).flatMap((b) => shuffle([0, 1, 2]).map((r) => b * 3 + r));
  const cols = shuffle([0, 1, 2]).flatMap((b) => shuffle([0, 1, 2]).map((c) => b * 3 + c));
  const solution = rows.flatMap((r) => cols.map((c) => ds[(r * 3 + Math.floor(r / 3) + c) % 9]));
  const board = [...solution];
  for (const i of shuffle(Array.from({ length: 81 }, (_, i) => i))) {
    const old = board[i]; board[i] = 0;
    const result = solve(board.join(""));
    if (result.exhausted || result.solutions.length !== 1) board[i] = old;
    const rating = ratePuzzle(board.join(""));
    if (rating && board.filter(Boolean).length < 44 && counts[rating.difficulty] < 6 && !bank.some((p) => p.clues === board.join(""))) {
      counts[rating.difficulty]++;
      bank.push({ id: `journal-${rating.difficulty}-${String(counts[rating.difficulty]).padStart(2, "0")}`, ...rating, clues: board.join(""), solution: solution.join("") });
      break;
    }
  }
}
if (Object.values(counts).some((n) => n !== 6)) throw new Error(`Bank incomplete: ${JSON.stringify(counts)}`);
bank.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(new URL("../src/games/sudoku/bank.ts", import.meta.url), `// Prepared by scripts/prepare-sudoku-bank.ts; all puzzles uniquely solvable.\nimport type { Difficulty, Technique } from "./solver.ts";\nexport type Puzzle = { id: string; difficulty: Difficulty; clues: string; solution: string; techniques: readonly Technique[] };\nexport const puzzleBank: readonly Puzzle[] = ${JSON.stringify(bank, null, 2)};\n`);
console.log(`Validated journal bank: ${JSON.stringify(counts)}`);
