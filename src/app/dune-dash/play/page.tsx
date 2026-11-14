import type { Metadata } from "next";
import DuneDashPlay from "@/components/dune-dash/play";

export const metadata: Metadata = { title: "Play Dune Dash", robots: { index: false, follow: true } };
export default function DuneDashPlayPage() { return <DuneDashPlay />; }
