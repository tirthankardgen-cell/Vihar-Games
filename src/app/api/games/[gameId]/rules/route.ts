import { NextResponse } from "next/server";
import { getGame } from "@/lib/catalog/registry";
import { unknownGameResponse } from "@/lib/api";
import { RULES_VERSION, ticTacToeModes, ticTacToeRules } from "@/games/tic-tac-toe/rules";
import { CHESS_RULES_VERSION, chessModes, chessRules } from "@/games/chess/rules";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const game = getGame((await params).gameId);
  if (!game) return unknownGameResponse();
  if (game.id === "chess") return NextResponse.json({ gameId: game.id, rulesVersion: CHESS_RULES_VERSION, rules: chessRules, availableModes: chessModes, plannedModes: ["online"] });
  if (game.id !== "tic-tac-toe") return NextResponse.json({ error: { code: "RULES_NOT_AVAILABLE", message: "The rules for this game are coming soon.", requestId: crypto.randomUUID() } }, { status: 404 });
  return NextResponse.json({ gameId: game.id, rulesVersion: RULES_VERSION, rules: ticTacToeRules, availableModes: ticTacToeModes, plannedModes: ["online"] });
}
