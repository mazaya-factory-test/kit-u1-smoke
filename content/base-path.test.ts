import { describe, expect, it } from "vitest";
import nextConfig from "../next.config.mjs";
import { absoluteUrl, getSiteConfig } from "../lib/seo/site";

// The base path lives in two places: next.config.mjs (what Next prefixes onto assets and links) and the
// path of site_url (what canonicals, the sitemap and robots.txt carry). If they disagree, the page loads
// but advertises URLs that 404. This test makes the disagreement a failed build.
// (A NEXT_PUBLIC_SITE_URL override in the environment replaces site_url: it must carry the base path too.)
describe("base path", () => {
  const site = getSiteConfig();

  it("next.config basePath and assetPrefix equal the base path of site_url", () => {
    expect(nextConfig.basePath ?? "").toBe(site.basePath);
    expect(nextConfig.assetPrefix ?? "").toBe(site.basePath);
  });

  it("next.config trailingSlash equals the seo config's, so canonicals match the served URLs", () => {
    expect(nextConfig.trailingSlash).toBe(site.trailingSlash);
  });

  it("the home canonical is the live home URL: origin, base path, trailing slash", () => {
    expect(absoluteUrl(site, "/")).toBe(`${site.url}${site.basePath}/`);
  });
});
