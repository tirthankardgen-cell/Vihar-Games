import type { Metadata } from "next";
import TicTacToeLanding from "@/components/tic-tac-toe/landing";

export const metadata: Metadata = {
  title: "Tic Tac Toe · A fresh page",
  description: "A little notebook rivalry. Play Tic Tac Toe against the computer or pass the page to a friend. No sign-up, just three in a row.",
  alternates: { canonical: "/tic-tac-toe" },
  openGraph: { title: "Tic Tac Toe | Vihar Games", description: "A blank page. A friendly rivalry. Play in the notebook.", url: "/tic-tac-toe" },
};

export default TicTacToeLanding;
