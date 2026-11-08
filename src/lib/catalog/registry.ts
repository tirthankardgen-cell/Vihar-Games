export type PlayMode =
  | "computer"
  | "practice"
  | "pass-and-play"
  | "online"
  | "solo";

type PlayerRange = { min: number; max: number };

export type Game = {
  id: string;
  name: string;
  hindiName?: string;
  category: "Strategy" | "Tabletop" | "Puzzle";
  description: string;
  symbol: string;
  playersLabel: string;
  plannedModes: readonly PlayMode[];
  playerLimits: {
    solo: 1;
    passAndPlay: PlayerRange | null;
    online: PlayerRange | null;
  };
  availability: "planned" | "playable";
  presentation: "2d";
};

export const modeLabels: Record<PlayMode, string> = {
  computer: "Play the computer",
  practice: "Practice",
  "pass-and-play": "Pass-and-play",
  online: "Private online room",
  solo: "Solo puzzle",
};

const twoPlayers = { min: 2, max: 2 };
const fourPlayers = { min: 2, max: 4 };
const twoPlayerLimits = {
  solo: 1 as const,
  passAndPlay: twoPlayers,
  online: twoPlayers,
};
const fourPlayerLimits = {
  solo: 1 as const,
  passAndPlay: fourPlayers,
  online: fourPlayers,
};
const soloLimits = { solo: 1 as const, passAndPlay: null, online: null };
const computerModes = ["computer", "pass-and-play", "online"] as const;

// This explicit registry is the allowlist for pages and APIs.
// Planned modes describe future games; no gameplay is available in this scaffold.
export const games: readonly Game[] = [
  {
    id: "chess",
    name: "Chess",
    hindiName: "शतरंज",
    category: "Strategy",
    description: "Think a move ahead. Guide your pieces and checkmate the king.",
    symbol: "♞",
    playersLabel: "Solo or 2 players",
    plannedModes: computerModes,
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "carrom",
    name: "Carrom",
    hindiName: "कैरम",
    category: "Tabletop",
    description: "Aim, strike, and pocket your coins. A familiar family favourite.",
    symbol: "◎",
    playersLabel: "Solo or 2 players",
    plannedModes: ["computer", "practice", "pass-and-play", "online"],
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "billiards",
    name: "Billiards",
    category: "Tabletop",
    description: "Find your angle, clear your group, and call the winning 8-ball.",
    symbol: "⑧",
    playersLabel: "Solo or 2 players",
    plannedModes: ["computer", "practice", "pass-and-play", "online"],
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    category: "Strategy",
    description: "Nine squares. Two familiar marks. Make your three in a row.",
    symbol: "×○",
    playersLabel: "Solo or 2 players",
    plannedModes: computerModes,
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "ludo",
    name: "Ludo",
    hindiName: "लूडो",
    category: "Tabletop",
    description: "Roll the die and race your four tokens all the way home.",
    symbol: "⚄",
    playersLabel: "Solo or 2–4 players",
    plannedModes: computerModes,
    playerLimits: fourPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "snakes-and-ladders",
    name: "Snakes and Ladders",
    category: "Tabletop",
    description: "Climb a little, slide a little. Let the dice take you to 100.",
    symbol: "↗",
    playersLabel: "Solo or 2–4 players",
    plannedModes: computerModes,
    playerLimits: fourPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "connect-four",
    name: "Connect Four",
    category: "Strategy",
    description: "Drop a token, spot a pattern, and connect four before your rival.",
    symbol: "●",
    playersLabel: "Solo or 2 players",
    plannedModes: computerModes,
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "checkers",
    name: "Checkers",
    category: "Strategy",
    description: "Follow the diagonals, take the jump, and crown your pieces.",
    symbol: "◉",
    playersLabel: "Solo or 2 players",
    plannedModes: computerModes,
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "reversi",
    name: "Reversi",
    category: "Strategy",
    description: "Surround your opponent’s discs and turn the board your way.",
    symbol: "◐",
    playersLabel: "Solo or 2 players",
    plannedModes: computerModes,
    playerLimits: twoPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    category: "Puzzle",
    description: "A quiet challenge. Find where every number belongs.",
    symbol: "9",
    playersLabel: "Solo puzzle",
    plannedModes: ["solo"],
    playerLimits: soloLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    category: "Puzzle",
    description: "Read the clues and uncover the safe squares, one at a time.",
    symbol: "⚑",
    playersLabel: "Solo puzzle",
    plannedModes: ["solo"],
    playerLimits: soloLimits,
    availability: "planned",
    presentation: "2d",
  },
  {
    id: "memory-match",
    name: "Memory Match",
    category: "Puzzle",
    description: "A little attention goes a long way. Remember and match the pairs.",
    symbol: "✳",
    playersLabel: "Solo or 2–4 players",
    plannedModes: ["solo", "pass-and-play", "online"],
    playerLimits: fourPlayerLimits,
    availability: "planned",
    presentation: "2d",
  },
];

export function getGame(gameId: string) {
  return games.find((game) => game.id === gameId);
}

export function getGameInfo(game: Game) {
  return {
    id: game.id,
    name: game.name,
    category: game.category,
    description: game.description,
    path: `/${game.id}`,
    playPath: `/${game.id}/play`,
    rulesPath: `/${game.id}/how-to-play`,
    apiBase: `/api/games/${game.id}`,
    availability: game.availability,
    presentation: game.presentation,
    plannedModes: game.plannedModes,
    availableModes: [],
    playerLimits: game.playerLimits,
    rulesVersion: null,
    roomActions: [],
  };
}
