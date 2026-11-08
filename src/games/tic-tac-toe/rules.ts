export const RULES_VERSION = "1.0.0";
export const ticTacToeRules = [
  "Two players take turns drawing X and O in the nine empty squares. X always goes first.",
  "Choose one empty square on your turn. A mark stays where it is until the round ends.",
  "Three of your marks in a horizontal row, vertical column, or either diagonal win the round.",
  "A full board without a winning line is a draw. A winning ninth move is still a win.",
  "Play Again swaps who draws X and keeps both players' wins and the number of draws.",
  "In pass-and-play, hand the notebook to the next player and let them confirm they are ready.",
  "Easy computer play can make mistakes. Medium looks for wins and blocks. Hard always chooses an optimal move and cannot lose.",
  "Giving up awards the round to the other player, separately from a three-in-a-row win.",
];

export const ticTacToeModes = ["computer", "pass-and-play"] as const;
