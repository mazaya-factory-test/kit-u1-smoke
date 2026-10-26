// kit:seo@0.2.0 harvested from creativ-astrology-land:lib/seo.ts
import { describe, expect, it } from "vitest";
import { buildMetadata } from "./metadata";
import type { RouteEntry } from "./routes";
import { createSiteConfig } from "./site";

const config = createSiteConfig({ name: "Test Site", url: "https://example.com/" });
const registry: RouteEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, indexable: true },
  { path: "/thanks", changeFrequency: "never", priority: 0, indexable: false },
];

describe("buildMetadata", () => {
  it("emits absolute canonical and og urls with no double slashes", () => {
    const m = buildMetadata({ title: "T", description: "D", path: "/work//alpha/", image: "/img/og.png" }, config, registry);
    expect(m.alternates?.canonical).toBe("https://example.com/work/alpha");
    expect((m.openGraph as { url: string }).url).toBe("https://example.com/work/alpha");
    expect((m.openGraph as { images: Array<{ url: string }> }).images[0]?.url).toBe("https://example.com/img/og.png");
    expect((m.twitter as { images: string[] }).images[0]).toBe("https://example.com/img/og.png");
    expect(String(m.metadataBase)).toBe("https://example.com/");
  });
  it("on a project site, canonical, og and image URLs and metadataBase all carry the base path", () => {
    const project = createSiteConfig({ name: "Test Site", url: "https://owner.github.io/repo", trailingSlash: true });
    const m = buildMetadata({ title: "T", description: "D", path: "/about/", image: "/img/og.png" }, project, registry);
    expect(m.alternates?.canonical).toBe("https://owner.github.io/repo/about/");
    expect((m.openGraph as { url: string }).url).toBe("https://owner.github.io/repo/about/");
    expect((m.openGraph as { images: Array<{ url: string }> }).images[0]?.url).toBe("https://owner.github.io/repo/img/og.png");
    expect(String(m.metadataBase)).toBe("https://owner.github.io/repo");
    expect(buildMetadata({ title: "T", description: "D", path: "/" }, project, registry).alternates?.canonical).toBe("https://owner.github.io/repo/");
  });
  it("indexes by default", () => {
    expect(buildMetadata({ title: "T", description: "D", path: "/x" }, config, registry).robots).toEqual({ index: true, follow: true });
  });
  it("noindex input sets robots", () => {
    expect(buildMetadata({ title: "T", description: "D", path: "/x", noindex: true }, config, registry).robots).toEqual({ index: false, follow: false });
  });
  it("a route registered as non-indexable is noindex without the flag", () => {
    expect(buildMetadata({ title: "T", description: "D", path: "/thanks/" }, config, registry).robots).toEqual({ index: false, follow: false });
  });
});
