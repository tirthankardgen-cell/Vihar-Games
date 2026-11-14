import type { Metadata } from "next";
import MonsoonPlay from "@/components/monsoon-blocks/play";
export const metadata: Metadata = { title: "Play Monsoon Blocks", robots: { index: false, follow: true } };
export default function MonsoonPlayPage() { return <MonsoonPlay />; }
