import { NextResponse } from "next/server";
function unavailable() {
  return NextResponse.json({ error: { code: "MODE_NOT_SUPPORTED", message: "Monsoon Blocks is a local solo game and does not support rooms.", requestId: crypto.randomUUID() } }, { status: 422 });
}
export const GET = unavailable;
export const POST = unavailable;
export const PUT = unavailable;
export const PATCH = unavailable;
export const DELETE = unavailable;
