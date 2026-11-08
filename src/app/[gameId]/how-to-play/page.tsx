import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { getGame } from "@/lib/catalog/registry";

type Props = { params: Promise<{ gameId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGame((await params).gameId);
  if (!game) notFound();
  return {
    title: `${game.name} rules · Coming soon`,
    robots: { index: false, follow: true },
  };
}

export default async function RulesPage({ params }: Props) {
  const game = getGame((await params).gameId);
  if (!game) notFound();
  return <ComingSoon game={game} rules />;
}
