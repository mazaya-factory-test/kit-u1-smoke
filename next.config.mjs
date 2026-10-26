/** U1 static site (FACTORY-SPEC.md §9.3): static export for GitHub Pages, no server, no image optimizer. */

// "" at a domain root (a custom domain, or a <owner>.github.io repo); "/repo" on a GitHub Pages
// project site (https://<owner>.github.io/<repo>/). Rendered from the base_path placeholder and
// equal to the path of site_url: content/base-path.test.ts fails the build if the two disagree.
const BASE_PATH = "/kit-u1-smoke";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Next prefixes every asset, <Link> and route with the base path; the export itself still sits at out/ root.
  ...(BASE_PATH ? { basePath: BASE_PATH, assetPrefix: BASE_PATH } : {}),
};

export default nextConfig;
