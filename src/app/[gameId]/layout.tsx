import { games } from "@/lib/catalog/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return games.map((game) => ({ gameId: game.id }));
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
