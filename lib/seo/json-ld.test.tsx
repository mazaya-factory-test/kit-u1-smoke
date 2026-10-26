// kit:seo@0.2.0 harvested from creativ-astrology-land:components/JsonLd.tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd, articleJsonLd, organizationJsonLd, serializeJsonLd, websiteJsonLd } from "./json-ld";
import { createSiteConfig } from "./site";

const config = createSiteConfig({ name: "Test Site", url: "https://example.com" });

describe("JsonLd", () => {
  it("escapes a </script> injection so the tag cannot close early", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("\\u003c/script\\u003e");
  });
  it("round-trips: the escaped JSON parses back to the original value", () => {
    const data = { name: "a < b & c > d \u2028" };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
  it("renders type application/ld+json", () => {
    expect(renderToStaticMarkup(<JsonLd data={{ a: 1 }} />)).toContain('type="application/ld+json"');
  });
});

describe("builders", () => {
  it("organization and website use the site config", () => {
    expect(organizationJsonLd(config)).toMatchObject({ "@type": "Organization", name: "Test Site", url: "https://example.com" });
    expect(websiteJsonLd(config)).toMatchObject({ "@type": "WebSite", url: "https://example.com" });
  });
  it("organization url is the site root including the base path on a project site", () => {
    const project = createSiteConfig({ name: "Test Site", url: "https://owner.github.io/repo" });
    expect(organizationJsonLd(project)).toMatchObject({ url: "https://owner.github.io/repo" });
    expect(articleJsonLd({ headline: "H", description: "D", path: "/blog/x/", datePublished: "2026-01-01" }, project)).toMatchObject({
      mainEntityOfPage: "https://owner.github.io/repo/blog/x",
    });
  });
  it("article has absolute urls and defaults dateModified", () => {
    const a = articleJsonLd({ headline: "H", description: "D", path: "/blog/x/", datePublished: "2026-01-01", image: "/i.png" }, config);
    expect(a).toMatchObject({ mainEntityOfPage: "https://example.com/blog/x", dateModified: "2026-01-01", image: "https://example.com/i.png" });
  });
});
