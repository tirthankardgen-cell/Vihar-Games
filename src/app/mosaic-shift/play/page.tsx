import type { Metadata } from "next";
import MosaicPlay from "@/components/mosaic-shift/play";
export const metadata: Metadata = { title: "Play Mosaic Shift", robots: { index: false, follow: true } };
export default function MosaicPlayPage() { return <MosaicPlay />; }
