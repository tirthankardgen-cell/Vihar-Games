import { RULES_VERSION, ticTacToeModes } from "@/games/tic-tac-toe/rules";
import { CHESS_RULES_VERSION, chessModes, computerPersona } from "@/games/chess/rules";
import { CARROM_RULES_VERSION, carromModes } from "@/games/carrom/rules";
import { PAPERWING_RULES_VERSION, paperwingModes } from "@/games/paperwing/rules";
import { SUDOKU_RULES_VERSION, sudokuModes } from "@/games/sudoku/rules";
import { MONSOON_RULES_VERSION, monsoonModes } from "@/games/monsoon-blocks/rules";
import { DUNE_DASH_RULES_VERSION, duneDashModes } from "@/games/dune-dash/rules";

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
  category: "Strategy" | "Tabletop" | "Puzzle" | "Arcade";
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
  solo: "Solo play",
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
const plannedSolo = {
  plannedModes: ["solo"] as const,
  playerLimits: soloLimits,
  availability: "planned" as const,
  presentation: "2d" as const,
};
const computerModes = ["computer", "pass-and-play", "online"] as const;

// This explicit registry is the allowlist for pages and APIs.
// Planned modes describe the full design; public metadata lists implemented modes separately.
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
    availability: "playable",
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
    availability: "playable",
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
    availability: "playable",
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
    availability: "playable",
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
  {
    ...plannedSolo,
    id: "silk-trail",
    name: "Silk Trail",
    category: "Arcade",
    description: "Guide a garden snake through silk leaves. Grow carefully and leave room to turn.",
    symbol: "∿",
    playersLabel: "Solo snake game",
  },
  {
    ...plannedSolo,
    id: "monsoon-blocks",
    name: "Monsoon Blocks",
    category: "Arcade",
    description: "Arrange falling blocks into complete rows beneath a rain-washed window.",
    symbol: "▦",
    playersLabel: "Solo falling blocks",
    availability: "playable",
  },
  {
    ...plannedSolo,
    id: "dune-dash",
    name: "Dune Dash",
    category: "Arcade",
    description: "A little desert fox, a long horizon. Jump stones and duck beneath passing birds.",
    symbol: "⌁",
    playersLabel: "Solo endless runner",
    availability: "playable",
  },
  {
    ...plannedSolo,
    id: "paperwing",
    name: "Paperwing",
    category: "Arcade",
    description: "Help a paper swallow find its rhythm and fly through open sky gates.",
    symbol: "⋏",
    playersLabel: "Solo flying bird",
    availability: "playable",
  },
  {
    ...plannedSolo,
    id: "lantern-logic",
    name: "Lantern Logic",
    category: "Puzzle",
    description: "Read the row and column clues. Light a hidden picture, one square at a time.",
    symbol: "▤",
    playersLabel: "Solo nonogram",
  },
  {
    ...plannedSolo,
    id: "mosaic-shift",
    name: "Mosaic Shift",
    category: "Puzzle",
    description: "Slide numbered ceramic tiles into place and restore a miniature mosaic.",
    symbol: "▧",
    playersLabel: "Solo sliding puzzle",
  },
  {
    ...plannedSolo,
    id: "prism-paths",
    name: "Prism Paths",
    category: "Puzzle",
    description: "Turn mirrored tiles and guide a beam of light to every matching receiver.",
    symbol: "◇",
    playersLabel: "Solo light-routing puzzle",
  },
  {
    ...plannedSolo,
    id: "crate-courtyard",
    name: "Crate Courtyard",
    category: "Puzzle",
    description: "Push market crates onto their chalk marks. Think ahead; crates cannot be pulled.",
    symbol: "□",
    playersLabel: "Solo crate-pushing puzzle",
  },
  {
    ...plannedSolo,
    id: "tide-turn",
    name: "Tide Turn",
    category: "Puzzle",
    description: "Fill, pour, and empty brass vessels until their water matches the exact target.",
    symbol: "≈",
    playersLabel: "Solo water-measuring puzzle",
  },
  {
    ...plannedSolo,
    id: "pebble-solitaire",
    name: "Pebble Solitaire",
    category: "Puzzle",
    description: "Jump one river pebble over another. Finish with a single stone in the centre.",
    symbol: "∘",
    playersLabel: "Solo peg solitaire",
  },
  {
    ...plannedSolo,
    id: "rangoli-loops",
    name: "Rangoli Loops",
    category: "Puzzle",
    description: "Follow the numbered clues and draw one unbroken loop around a rangoli grid.",
    symbol: "⌘",
    playersLabel: "Solo loop-drawing puzzle",
  },
  {
    ...plannedSolo,
    id: "orbit-breaker",
    name: "Orbit Breaker",
    category: "Arcade",
    description: "Keep a comet in play with your paddle and clear a field of celestial tiles.",
    symbol: "☄",
    playersLabel: "Solo brick breaker",
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
    availableModes: game.id === "chess" ? chessModes : game.id === "tic-tac-toe" ? ticTacToeModes : game.id === "carrom" ? carromModes : game.id === "paperwing" ? paperwingModes : game.id === "sudoku" ? sudokuModes : game.id === "dune-dash" ? duneDashModes : game.id === "monsoon-blocks" ? monsoonModes : [],
    playerLimits: game.playerLimits,
    rulesVersion: game.id === "chess" ? CHESS_RULES_VERSION : game.id === "tic-tac-toe" ? RULES_VERSION : game.id === "carrom" ? CARROM_RULES_VERSION : game.id === "paperwing" ? PAPERWING_RULES_VERSION : game.id === "sudoku" ? SUDOKU_RULES_VERSION : game.id === "dune-dash" ? DUNE_DASH_RULES_VERSION : game.id === "monsoon-blocks" ? MONSOON_RULES_VERSION : null,
    ...(game.id === "dune-dash" ? { soloPresets: ["endless", "practice"] } : {}),
    ...(["paperwing", "monsoon-blocks"].includes(game.id) ? { soloPresets: ["standard", "practice"] } : {}),
    ...(game.id === "sudoku" ? { soloPresets: ["easy", "medium", "hard"] } : {}),
    ...(game.availability === "playable" ? { embedVersion: 1 } : {}),
    ...(game.id === "chess" ? { computerPersona } : {}),
    roomActions: [],
  };
}

// Stable ordering keeps the familiar order within each availability group.
export function getCatalogGames() {
  return [...games.filter((game) => game.availability === "playable"), ...games.filter((game) => game.availability === "planned")];
}
