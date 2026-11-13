import type { Metadata } from "next";
import CarromPlay from "@/components/carrom/play";

export const metadata: Metadata = { title: "Play Carrom", robots: { index: false, follow: true } };

export default async function Page({ searchParams }: { searchParams: Promise<{ room?: string | string[] }> }) {
  const query = await searchParams;
  const room = Array.isArray(query.room) ? query.room[0] : query.room;
  return <CarromPlay initialRoom={room === undefined ? undefined : room.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6)} />;
}
