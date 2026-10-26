/** U1 static site (FACTORY-SPEC.md §9.3): static export for GitHub Pages, no server, no image optimizer. */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
