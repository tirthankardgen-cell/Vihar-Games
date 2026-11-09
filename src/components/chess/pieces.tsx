import type { Color, PieceSymbol } from "@/games/chess/engine";

// Original flat silhouettes. Both treatments have contrasting outlines, so
// neither side disappears on cream or teal cells.
export function Piece({ type, color }: { type: PieceSymbol; color: Color }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" fill={color === "w" ? "#F5E6C5" : "#293D35"} stroke={color === "w" ? "#293D35" : "#F5E6C5"} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round">
    {type === "p" && <><circle cx="32" cy="19" r="9" /><path d="M26 28h12l-2 8 7 13H21l7-13z" /><path d="M20 49h24l3 7H17z" /></>}
    {type === "r" && <><path d="M16 10h8v8h5v-8h7v8h5v-8h7v17l-8 7 2 15H22l2-15-8-7z" /><path d="M18 49h28l3 7H15zM22 28h20M25 39h14" /></>}
    {type === "n" && <><path d="m20 50 3-13 11-10-8 2-8 6-8-8 11-13 8-3 2-7 7 8c17 7 14 24 8 38z" /><path d="M18 50h29l3 6H15zM37 20c7 7 2 16-3 21" /><circle cx="27" cy="20" r="1.5" fill="currentColor" stroke="none" /></>}
    {type === "b" && <><path d="M32 7C25 15 19 18 20 25c1 6 7 9 12 9s11-3 12-9C45 18 39 15 32 7zM27 35h10l-1 7 7 8H21l7-8z" /><path d="m35 14-8 12M18 50h28l3 6H15z" /><circle cx="32" cy="6" r="3" /></>}
    {type === "q" && <><path d="m15 19 9 9 8-14 8 14 9-9-7 24H22zM22 43h20l2 7H20zM17 50h30l3 6H14z" /><circle cx="14" cy="16" r="4" /><circle cx="32" cy="11" r="4" /><circle cx="50" cy="16" r="4" /><path d="M23 36h18" /></>}
    {type === "k" && <><path d="M29 5h6v6h6v6h-6v7h-6v-7h-6v-6h6zM19 25c0-6 9-6 13-1 4-5 13-5 13 1 0 7-6 12-6 17H25c0-5-6-10-6-17zM23 42h18l3 8H20zM17 50h30l3 6H14z" /><path d="M26 35h12" /></>}
  </svg>;
}
