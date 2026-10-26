// kit:seo@0.1.1 harvested from Card Centering Scanner:src/app/robots.ts; mazaya-studios:app/robots.ts
import type { MetadataRoute } from "next";
import { nonIndexableRoutes, routes, type RouteEntry } from "../lib/seo/routes";
import { absoluteUrl, getSiteConfig, type SiteConfig } from "../lib/seo/site";

// REQUIRED under `output: "export"`: a metadata route is a Route Handler, dynamic by
// default, and the static build fails ("export const dynamic = force-static not
// configured") without this line. Harmless on a normal Next app.
export const dynamic = "force-static";

export function buildRobots(config: SiteConfig, registry: readonly RouteEntry[]): MetadataRoute.Robots {
  const disallow = nonIndexableRoutes(registry).map((r) => r.path);
  return {
    rules: [{ userAgent: "*", allow: "/", ...(disallow.length > 0 ? { disallow } : {}) }],
    sitemap: absoluteUrl(config, "/sitemap.xml"),
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getSiteConfig(), routes);
}
