import type { Metadata } from "next";
import TicTacToePlay from "@/components/tic-tac-toe/play";

export const metadata: Metadata = { title: "Play Tic Tac Toe", robots: { index: false, follow: true } };

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ room?: string | string[] }> }) {
  const query = await searchParams;
  const room = Array.isArray(query.room) ? query.room[0] : query.room;
  const code = room === undefined ? undefined : room.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6);
  return <TicTacToePlay initialRoomCode={code} />;
}
