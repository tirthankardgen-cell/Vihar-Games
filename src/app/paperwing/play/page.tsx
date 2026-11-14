import type { Metadata } from "next";
import PaperwingPlay from "@/components/paperwing/play";

export const metadata: Metadata = { title: "Play Paperwing", robots: { index: false, follow: true } };
export default function PaperwingPlayPage() { return <PaperwingPlay />; }
