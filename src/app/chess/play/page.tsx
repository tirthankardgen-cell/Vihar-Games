import type { Metadata } from "next";
import ChessPlay from "@/components/chess/play";
export const metadata: Metadata = { title: "Play Chess", robots: { index: false, follow: true } };
export default async function Page({ searchParams }: { searchParams: Promise<{ room?: string | string[] }> }) {
  const query = await searchParams, room = Array.isArray(query.room) ? query.room[0] : query.room;
  return <ChessPlay initialRoom={room === undefined ? undefined : room.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6)} />;
}
