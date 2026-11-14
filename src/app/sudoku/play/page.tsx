import type { Metadata } from "next";
import SudokuPlay from "@/components/sudoku/play";
export const metadata: Metadata = { title: "Play Sudoku", robots: { index: false, follow: true } };
export default function SudokuPlayPage() { return <SudokuPlay />; }
