import { NextResponse } from "next/server";
import { getGame } from "@/lib/catalog/registry";
import { unknownGameResponse } from "@/lib/api";
import { RULES_VERSION, ticTacToeModes, ticTacToeRules } from "@/games/tic-tac-toe/rules";
import { CHESS_RULES_VERSION, chessModes, chessRules } from "@/games/chess/rules";
import { CARROM_RULES_VERSION, carromModes, carromRules } from "@/games/carrom/rules";
import { PAPERWING_RULES_VERSION, paperwingModes, paperwingRules } from "@/games/paperwing/rules";
import { SUDOKU_RULES_VERSION, sudokuModes, sudokuRules } from "@/games/sudoku/rules";
import { MONSOON_RULES_VERSION, monsoonModes, monsoonRules } from "@/games/monsoon-blocks/rules";
import { DUNE_DASH_RULES_VERSION, duneDashModes, duneDashRules } from "@/games/dune-dash/rules";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const game = getGame((await params).gameId);
  if (!game) return unknownGameResponse();
  if (game.id === "monsoon-blocks") return NextResponse.json({ gameId: game.id, rulesVersion: MONSOON_RULES_VERSION, rules: monsoonRules, availableModes: monsoonModes, plannedModes: [], presets: ["standard", "practice"] });
  if (game.id === "dune-dash") return NextResponse.json({ gameId: game.id, rulesVersion: DUNE_DASH_RULES_VERSION, rules: duneDashRules, availableModes: duneDashModes, plannedModes: [], presets: ["endless", "practice"] });
  if (game.id === "sudoku") return NextResponse.json({ gameId: game.id, rulesVersion: SUDOKU_RULES_VERSION, rules: sudokuRules, availableModes: sudokuModes, plannedModes: [], presets: ["easy", "medium", "hard"] });
  if (game.id === "paperwing") return NextResponse.json({ gameId: game.id, rulesVersion: PAPERWING_RULES_VERSION, rules: paperwingRules, availableModes: paperwingModes, plannedModes: [], presets: ["standard", "practice"] });
  if (game.id === "carrom") return NextResponse.json({ gameId: game.id, rulesVersion: CARROM_RULES_VERSION, rules: carromRules, availableModes: carromModes, plannedModes: ["online"] });
  if (game.id === "chess") return NextResponse.json({ gameId: game.id, rulesVersion: CHESS_RULES_VERSION, rules: chessRules, availableModes: chessModes, plannedModes: ["online"] });
  if (game.id !== "tic-tac-toe") return NextResponse.json({ error: { code: "RULES_NOT_AVAILABLE", message: "The rules for this game are coming soon.", requestId: crypto.randomUUID() } }, { status: 404 });
  return NextResponse.json({ gameId: game.id, rulesVersion: RULES_VERSION, rules: ticTacToeRules, availableModes: ticTacToeModes, plannedModes: ["online"] });
}
