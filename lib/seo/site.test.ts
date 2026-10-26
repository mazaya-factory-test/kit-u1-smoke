// kit:seo@0.1.1 harvested from AV-Events:lib/site-url.ts
import { describe, expect, it } from "vitest";
import { absoluteUrl, createSiteConfig, getSiteConfig } from "./site";

describe("createSiteConfig", () => {
  it("strips trailing slash, path and query", () => {
    expect(createSiteConfig({ name: "A", url: "https://example.com/" }).url).toBe("https://example.com");
    expect(createSiteConfig({ name: "A", url: "https://example.com/x/?q=1#h" }).url).toBe("https://example.com");
  });
  it("rejects ftp: and other non-http(s) schemes", () => {
    expect(() => createSiteConfig({ name: "A", url: "ftp://example.com" })).toThrow(/http\(s\)/);
    expect(() => createSiteConfig({ name: "A", url: "javascript:alert(1)" })).toThrow();
  });
  it("rejects a bare host and an unresolved token", () => {
    expect(() => createSiteConfig({ name: "A", url: "example.com" })).toThrow(/valid absolute URL/);
    expect(() => createSiteConfig({ name: "A", url: "{" + "{site_url}}" })).toThrow();
  });
  it("lets envUrl override and ignores a blank override", () => {
    expect(createSiteConfig({ name: "A", url: "https://a.com", envUrl: "https://b.com/" }).url).toBe("https://b.com");
    expect(createSiteConfig({ name: "A", url: "https://a.com", envUrl: "  " }).url).toBe("https://a.com");
  });
  it("rejects an empty name", () => {
    expect(() => createSiteConfig({ name: " ", url: "https://a.com" })).toThrow(/name/);
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
});

describe("getSiteConfig", () => {
  it("is lazy: importing this module did not throw (a project with resolved tokens returns a config)", () => {
    expect(typeof getSiteConfig).toBe("function");
  });
});
