import { NextResponse } from "next/server";
import { games, getGameInfo } from "@/lib/catalog/registry";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ games: games.map(getGameInfo) });
}
