import { NextResponse } from "next/server";
import { getGame, getGameInfo } from "@/lib/catalog/registry";
import { unknownGameResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const game = getGame((await params).gameId);
  if (!game) return unknownGameResponse();
  return NextResponse.json(getGameInfo(game));
}
