// kit:seo@0.1.1 harvested from creativ-astrology-land:lib/seo.ts; AV-Events:lib/site-url.ts
/**
 * Site identity. `createSiteConfig` is pure so tests can inject values; the
 * `Kit U1 Smoke` / `https://mazaya-factory-test.github.io/kit-u1-smoke` tokens are replaced by `kit add`.
 *
 * `getSiteConfig()` is LAZY on purpose: while the tokens are still unresolved
 * (inside the kit, or a project that skipped --set), merely importing this
 * module must not throw. It throws on first use instead, with a clear message.
 *
 * Origin resolution: NEXT_PUBLIC_SITE_URL (read literally, so Next inlines it)
 * overrides the token. The result is an ORIGIN only: no path, query, fragment or
 * trailing slash. A non-http(s) value throws, never silently becomes a host.
 */
export interface SiteConfig {
  name: string;
  /** Origin, e.g. https://example.com (no trailing slash). */
  url: string;
  /** Mirror Next's `trailingSlash` setting so canonicals match the served URLs. */
  trailingSlash: boolean;
}

export interface SiteConfigInput {
  name: string;
  url: string;
  /** Overrides `url` when non-blank. Defaults to process.env.NEXT_PUBLIC_SITE_URL. */
  envUrl?: string;
  trailingSlash?: boolean;
}

export function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Site URL is not a valid absolute URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Site URL must be http(s)");
  }
  return parsed.origin;
}

export function createSiteConfig(input: SiteConfigInput): SiteConfig {
  const name = input.name.trim();
  if (!name) throw new Error("Site name is empty");
  const override = input.envUrl?.trim();
  return {
    name,
    url: normalizeOrigin(override ? override : input.url),
    trailingSlash: input.trailingSlash ?? false,
  };
}

let cached: SiteConfig | undefined;


/** Rendered by `kit add --set trailing_slash=...`; typed as string so tsc accepts the raw token. */
const TRAILING_SLASH: string = "true";
export function getSiteConfig(): SiteConfig {
  if (!cached) {
    cached = createSiteConfig({
      name: "Kit U1 Smoke",
      url: "https://mazaya-factory-test.github.io/kit-u1-smoke",
      envUrl: process.env.NEXT_PUBLIC_SITE_URL,
      // Must equal next.config's `trailingSlash`, or the sitemap and canonicals disagree.
      trailingSlash: TRAILING_SLASH === "true",
    });
  }
  return cached;
}

/** Join an origin and a path without double slashes. `/` becomes the bare origin (or origin + "/" with trailingSlash). */
export function absoluteUrl(config: SiteConfig, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  let p = pathOrUrl.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  const hasExt = /\.[a-z0-9]+$/i.test(p);
  if (p !== "/" && !hasExt) {
    p = config.trailingSlash ? (p.endsWith("/") ? p : `${p}/`) : p.replace(/\/+$/, "");
  }
  if (p === "/") return config.trailingSlash ? `${config.url}/` : config.url;
  return `${config.url}${p}`;
}
