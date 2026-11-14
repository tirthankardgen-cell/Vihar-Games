import { NextResponse } from "next/server";
// Sudoku has no room/session service; reject room requests explicitly.
function unavailable() {
  return NextResponse.json({ error: { code: "MODE_NOT_SUPPORTED", message: "Sudoku is a local solo puzzle and does not support rooms.", requestId: crypto.randomUUID() } }, { status: 422 });
}
export const GET = unavailable;
export const POST = unavailable;
export const PUT = unavailable;
export const PATCH = unavailable;
export const DELETE = unavailable;
