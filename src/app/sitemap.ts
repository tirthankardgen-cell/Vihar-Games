import type { MetadataRoute } from "next";
import { games } from "@/lib/catalog/registry";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Rules pages join the sitemap when real rules are published with a game.
  return ["/", ...games.map((game) => `/${game.id}`)].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
