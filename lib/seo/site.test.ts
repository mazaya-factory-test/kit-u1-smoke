// kit:seo@0.2.0 harvested from AV-Events:lib/site-url.ts
import { describe, expect, it } from "vitest";
import { absoluteUrl, createSiteConfig, getSiteConfig, normalizeBasePath, normalizeOrigin, siteBaseUrl } from "./site";

describe("createSiteConfig", () => {
  it("strips trailing slash, query and fragment from an origin-only URL; basePath is empty", () => {
    const a = createSiteConfig({ name: "A", url: "https://example.com/" });
    expect(a.url).toBe("https://example.com");
    expect(a.basePath).toBe("");
    const b = createSiteConfig({ name: "A", url: "https://example.com?q=1#h" });
    expect(b).toMatchObject({ url: "https://example.com", basePath: "" });
  });
  it("splits a project-site URL into origin and basePath", () => {
    expect(createSiteConfig({ name: "A", url: "https://owner.github.io/repo" })).toMatchObject({ url: "https://owner.github.io", basePath: "/repo" });
    expect(createSiteConfig({ name: "A", url: "https://owner.github.io/repo/?q=1#h" })).toMatchObject({ url: "https://owner.github.io", basePath: "/repo" });
    expect(createSiteConfig({ name: "A", url: "https://example.com/a//b/" }).basePath).toBe("/a/b");
  });
  it("lets an explicit basePath override the URL's path, and ignores a blank one", () => {
    expect(createSiteConfig({ name: "A", url: "https://example.com", basePath: "docs/" }).basePath).toBe("/docs");
    expect(createSiteConfig({ name: "A", url: "https://example.com/repo", basePath: "/other" }).basePath).toBe("/other");
    expect(createSiteConfig({ name: "A", url: "https://example.com/repo", basePath: "  " }).basePath).toBe("/repo");
  });
  it("rejects ftp: and other non-http(s) schemes", () => {
    expect(() => createSiteConfig({ name: "A", url: "ftp://example.com" })).toThrow(/http\(s\)/);
    expect(() => createSiteConfig({ name: "A", url: "javascript:alert(1)" })).toThrow();
  });
  it("rejects a bare host and an unresolved token", () => {
    expect(() => createSiteConfig({ name: "A", url: "example.com" })).toThrow(/valid absolute URL/);
    expect(() => createSiteConfig({ name: "A", url: "{" + "{site_url}}" })).toThrow();
  });
  it("lets envUrl override (path included) and ignores a blank override", () => {
    expect(createSiteConfig({ name: "A", url: "https://a.com", envUrl: "https://b.com/" }).url).toBe("https://b.com");
    expect(createSiteConfig({ name: "A", url: "https://a.com", envUrl: "  " }).url).toBe("https://a.com");
    const c = createSiteConfig({ name: "A", url: "https://a.com", envUrl: "https://b.io/preview" });
    expect(c).toMatchObject({ url: "https://b.io", basePath: "/preview" });
  });
  it("rejects an empty name", () => {
    expect(() => createSiteConfig({ name: " ", url: "https://a.com" })).toThrow(/name/);
  });
});

describe("normalizeBasePath", () => {
  it("normalises slashes", () => {
    expect(normalizeBasePath("")).toBe("");
    expect(normalizeBasePath("/")).toBe("");
    expect(normalizeBasePath("repo")).toBe("/repo");
    expect(normalizeBasePath("/repo/")).toBe("/repo");
    expect(normalizeBasePath("//a///b//")).toBe("/a/b");
  });
  it("rejects anything that is not a plain path", () => {
    for (const bad of ["/a?b=1", "/a#b", "/a b", "/a/../b", "/./a", "https://evil.test/x", "javascript:alert(1)", "/a\\b"]) {
      expect(() => normalizeBasePath(bad), bad).toThrow();
    }
  });
  it("normalizeOrigin still returns the origin only", () => {
    expect(normalizeOrigin("https://owner.github.io/repo/")).toBe("https://owner.github.io");
  });
});

describe("absoluteUrl", () => {
  const c = createSiteConfig({ name: "A", url: "https://example.com" });
  it("joins without double slashes", () => {
    expect(absoluteUrl(c, "/a//b/")).toBe("https://example.com/a/b");
    expect(absoluteUrl(c, "a")).toBe("https://example.com/a");
    expect(absoluteUrl(c, "/")).toBe("https://example.com");
    expect(absoluteUrl(c, "/sitemap.xml")).toBe("https://example.com/sitemap.xml");
  });
  it("passes absolute URLs through", () => {
    expect(absoluteUrl(c, "https://cdn.test/i.png")).toBe("https://cdn.test/i.png");
  });
  it("honours trailingSlash", () => {
    const t = createSiteConfig({ name: "A", url: "https://example.com", trailingSlash: true });
    expect(absoluteUrl(t, "/work")).toBe("https://example.com/work/");
    expect(absoluteUrl(t, "/")).toBe("https://example.com/");
  });
  it("joins origin, basePath and path on a project site, with no double slashes", () => {
    const p = createSiteConfig({ name: "A", url: "https://owner.github.io/repo/" });
    expect(absoluteUrl(p, "/a//b/")).toBe("https://owner.github.io/repo/a/b");
    expect(absoluteUrl(p, "about")).toBe("https://owner.github.io/repo/about");
    expect(absoluteUrl(p, "/")).toBe("https://owner.github.io/repo");
    expect(absoluteUrl(p, "/sitemap.xml")).toBe("https://owner.github.io/repo/sitemap.xml");
    expect(absoluteUrl(p, "/img/og.png")).toBe("https://owner.github.io/repo/img/og.png");
    expect(absoluteUrl(p, "https://cdn.test/i.png")).toBe("https://cdn.test/i.png");
  });
  it("project site with trailingSlash matches the URLs Next serves", () => {
    const p = createSiteConfig({ name: "A", url: "https://owner.github.io/repo", trailingSlash: true });
    expect(absoluteUrl(p, "/")).toBe("https://owner.github.io/repo/");
    expect(absoluteUrl(p, "/about")).toBe("https://owner.github.io/repo/about/");
    expect(absoluteUrl(p, "/about/")).toBe("https://owner.github.io/repo/about/");
    expect(absoluteUrl(p, "/sitemap.xml")).toBe("https://owner.github.io/repo/sitemap.xml");
  });
});

describe("siteBaseUrl", () => {
  it("is the origin, plus the base path on a project site", () => {
    expect(String(siteBaseUrl(createSiteConfig({ name: "A", url: "https://example.com" })))).toBe("https://example.com/");
    expect(String(siteBaseUrl(createSiteConfig({ name: "A", url: "https://owner.github.io/repo/" })))).toBe("https://owner.github.io/repo");
  });
});

describe("getSiteConfig", () => {
  it("is lazy: importing this module did not throw (a project with resolved tokens returns a config)", () => {
    expect(typeof getSiteConfig).toBe("function");
  });
});
