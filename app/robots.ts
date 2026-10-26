// kit:seo@0.2.0 harvested from Card Centering Scanner:src/app/robots.ts; mazaya-studios:app/robots.ts
import type { MetadataRoute } from "next";
import { nonIndexableRoutes, routes, type RouteEntry } from "../lib/seo/routes";
import { absoluteUrl, getSiteConfig, type SiteConfig } from "../lib/seo/site";

// REQUIRED under `output: "export"`: a metadata route is a Route Handler, dynamic by
// default, and the static build fails ("export const dynamic = force-static not
// configured") without this line. Harmless on a normal Next app.
export const dynamic = "force-static";

export function buildRobots(config: SiteConfig, registry: readonly RouteEntry[]): MetadataRoute.Robots {
  // Disallow paths are served URLs, so they carry the base path (empty at a domain root). Crawlers
  // only read robots.txt at the host root, so on a project site this file is informational.
  const disallow = nonIndexableRoutes(registry).map((r) => `${config.basePath}${r.path}`);
  return {
    rules: [{ userAgent: "*", allow: "/", ...(disallow.length > 0 ? { disallow } : {}) }],
    sitemap: absoluteUrl(config, "/sitemap.xml"),
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getSiteConfig(), routes);
}
