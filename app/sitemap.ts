// kit:seo@0.1.1 harvested from Card Centering Scanner:src/app/sitemap.ts; mazaya-studios:app/sitemap.ts
import type { MetadataRoute } from "next";
import { indexableRoutes, routes, type RouteEntry } from "../lib/seo/routes";
import { absoluteUrl, getSiteConfig, type SiteConfig } from "../lib/seo/site";

// REQUIRED under `output: "export"` (see robots.ts).
export const dynamic = "force-static";

export function buildSitemap(config: SiteConfig, registry: readonly RouteEntry[]): MetadataRoute.Sitemap {
  return indexableRoutes(registry).map((r) => ({
    url: absoluteUrl(config, r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...(r.lastModified ? { lastModified: r.lastModified } : {}),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(getSiteConfig(), routes);
}
