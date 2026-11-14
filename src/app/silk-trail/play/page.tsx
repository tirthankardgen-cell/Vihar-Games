import type { Metadata } from "next";
import SilkPlay from "@/components/silk-trail/play";
export const metadata: Metadata = { title: "Play Silk Trail", description: "Choose Calm, Flow, or Swift and guide a garden snake through mulberry leaves.", alternates: { canonical: "/silk-trail/play" }, robots: { index: false, follow: true } };
export default function SilkPlayPage() { return <SilkPlay />; }
