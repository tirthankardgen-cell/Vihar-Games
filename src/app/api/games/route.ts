import { NextResponse } from "next/server";
import { getCatalogGames, getGameInfo } from "@/lib/catalog/registry";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ games: getCatalogGames().map(getGameInfo) });
}
