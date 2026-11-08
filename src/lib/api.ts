import { NextResponse } from "next/server";

export function unknownGameResponse() {
  return NextResponse.json(
    {
      error: {
        code: "UNKNOWN_GAME",
        message: "This game is not in the Vihar Games collection.",
        requestId: crypto.randomUUID(),
      },
    },
    { status: 404 },
  );
}
