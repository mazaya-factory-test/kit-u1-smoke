// kit:seo@0.2.0 harvested from Card Centering Scanner:src/app/robots.ts
import { describe, expect, it } from "vitest";
import type { RouteEntry } from "../lib/seo/routes";
import { createSiteConfig } from "../lib/seo/site";
import { buildRobots } from "./robots";

const config = createSiteConfig({ name: "T", url: "https://example.com" });
const registry: RouteEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, indexable: true },
  { path: "/thanks", changeFrequency: "never", priority: 0, indexable: false },
];

describe("buildRobots", () => {
  it("disallows non-indexable routes and points at the sitemap", () => {
    const r = buildRobots(config, registry);
    expect(r.rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/thanks"] }]);
    expect(r.sitemap).toBe("https://example.com/sitemap.xml");
  });
  it("carries the base path on a project site, in the disallow rules and the sitemap line", () => {
    const project = createSiteConfig({ name: "T", url: "https://owner.github.io/repo" });
    const r = buildRobots(project, registry);
    expect(r.rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/repo/thanks"] }]);
    expect(r.sitemap).toBe("https://owner.github.io/repo/sitemap.xml");
  });
  it("omits disallow when every route is indexable", () => {
    const r = buildRobots(config, [registry[0]!]);
    expect(JSON.stringify(r.rules)).not.toContain("disallow");
  });
});
