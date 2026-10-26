// kit:seo@0.1.1 harvested from Card Centering Scanner:src/app/sitemap.ts
import { describe, expect, it } from "vitest";
import type { RouteEntry } from "../lib/seo/routes";
import { createSiteConfig } from "../lib/seo/site";
import { buildSitemap } from "./sitemap";

const config = createSiteConfig({ name: "T", url: "https://example.com" });
const registry: RouteEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, indexable: true, lastModified: "2026-01-01" },
  { path: "/about", changeFrequency: "monthly", priority: 0.7, indexable: true },
  { path: "/thanks", changeFrequency: "never", priority: 0, indexable: false },
];

describe("buildSitemap", () => {
  it("excludes non-indexable routes", () => {
    const urls = buildSitemap(config, registry).map((e) => e.url);
    expect(urls).toEqual(["https://example.com", "https://example.com/about"]);
    expect(urls.join()).not.toContain("thanks");
  });
  it("carries a pinned lastModified only when given, never a computed date", () => {
    const [home, about] = buildSitemap(config, registry);
    expect(home?.lastModified).toBe("2026-01-01");
    expect(about && "lastModified" in about).toBe(false);
  });
});
