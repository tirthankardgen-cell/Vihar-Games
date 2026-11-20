import type { Metadata } from "next";
import LanternPlay from "@/components/lantern-logic/play";
export const metadata: Metadata = { title: "Play Lantern Logic", robots: { index: false, follow: true } };
export default function LanternPlayPage() { return <LanternPlay />; }
