import { games } from "@/lib/catalog/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return games.filter((game) => game.id !== "tic-tac-toe").map((game) => ({ gameId: game.id }));
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
