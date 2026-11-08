import { getGame } from "@/lib/catalog/registry";
import { unknownGameResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const game = getGame((await params).gameId);
  if (!game) return unknownGameResponse();
  return new Response(null, { status: 307, headers: { Location: `/${game.id}` } });
}
