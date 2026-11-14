import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
import { getCatalogGames } from "@/lib/catalog/registry";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function HomePage() { return <Catalog games={getCatalogGames()} />; }
