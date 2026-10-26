// kit:seo@0.2.0 harvested from creativ-astrology-land:lib/seo.ts; AV-Events:lib/site-url.ts
/**
 * Site identity. `createSiteConfig` is pure so tests can inject values; the
 * `Kit U1 Smoke` / `https://mazaya-factory-test.github.io/kit-u1-smoke` tokens are replaced by `kit add`.
 *
 * `getSiteConfig()` is LAZY on purpose: while the tokens are still unresolved
 * (inside the kit, or a project that skipped --set), merely importing this
 * module must not throw. It throws on first use instead, with a clear message.
 *
 * URL resolution: NEXT_PUBLIC_SITE_URL (read literally, so Next inlines it)
 * overrides the token. The result is an ORIGIN (`url`: scheme and host, no
 * trailing slash) plus a BASE PATH (`basePath`). The base path is the path of the
 * given URL, so `https://owner.github.io/repo` gives origin `https://owner.github.io`
 * and basePath `/repo` (a GitHub Pages project site). A bare origin gives basePath "".
 * Query and fragment are always dropped. A non-http(s) value throws, never silently
 * becomes a host.
 *
 * `basePath` must equal next.config's `basePath` (it is what Next prefixes onto every
 * asset and `<Link>`); every URL this module builds then carries it.
 */
export interface SiteConfig {
  name: string;
  /** Origin, e.g. https://example.com (no trailing slash, no path). */
  url: string;
  /** "" at a domain root, else "/repo": leading slash, no trailing slash. Mirror next.config's `basePath`. */
  basePath: string;
  /** Mirror Next's `trailingSlash` setting so canonicals match the served URLs. */
  trailingSlash: boolean;
}

export interface SiteConfigInput {
  name: string;
  /** An origin, or a full URL whose path becomes the base path (https://owner.github.io/repo). */
  url: string;
  /** Overrides `url` when non-blank (and brings its own path). Defaults to process.env.NEXT_PUBLIC_SITE_URL. */
  envUrl?: string;
  /** Overrides the path of `url` when non-blank. Default: that path, else "". */
  basePath?: string;
  trailingSlash?: boolean;
}

/** "/repo/" and "repo" become "/repo"; "" and "/" become "". Throws on a query, fragment, space, scheme or dot segment. */
export function normalizeBasePath(raw: string): string {
  const trimmed = raw.trim();
  if (/[?#\s\\]/.test(trimmed) || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    throw new Error("Base path must be a plain path (no query, fragment, space, backslash or scheme)");
  }
  const segments = trimmed.split("/").filter(Boolean);
  if (segments.some((s) => s === "." || s === "..")) throw new Error("Base path must not contain . or .. segments");
  return segments.length > 0 ? `/${segments.join("/")}` : "";
}

/** Split an absolute http(s) URL into its origin and its base path. */
export function parseSiteUrl(raw: string): { origin: string; basePath: string } {
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
  return { origin: parsed.origin, basePath: normalizeBasePath(parsed.pathname) };
}

/** The origin of an absolute http(s) URL (path, query and fragment dropped). */
export function normalizeOrigin(raw: string): string {
  return parseSiteUrl(raw).origin;
}

export function createSiteConfig(input: SiteConfigInput): SiteConfig {
  const name = input.name.trim();
  if (!name) throw new Error("Site name is empty");
  const override = input.envUrl?.trim();
  const parsed = parseSiteUrl(override ? override : input.url);
  const explicit = input.basePath?.trim();
  return {
    name,
    url: parsed.origin,
    basePath: explicit ? normalizeBasePath(explicit) : parsed.basePath,
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
      // An origin, or origin plus base path for a GitHub Pages project site.
      url: "https://mazaya-factory-test.github.io/kit-u1-smoke",
      envUrl: process.env.NEXT_PUBLIC_SITE_URL,
      // Must equal next.config's `trailingSlash`, or the sitemap and canonicals disagree.
      trailingSlash: TRAILING_SLASH === "true",
    });
  }
  return cached;
}

/** origin + basePath as a URL: what `metadataBase` wants, so Next resolves relative metadata URLs under the base path. */
export function siteBaseUrl(config: SiteConfig): URL {
  return new URL(`${config.url}${config.basePath}`);
}

/**
 * Join origin, base path and a path without double slashes. `path` is app-relative (no base path),
 * the same shape `<Link href>` takes. `/` becomes the site root: the bare origin plus base path
 * (with a trailing slash when `trailingSlash` is set).
 */
export function absoluteUrl(config: SiteConfig, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  let p = pathOrUrl.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  const hasExt = /\.[a-z0-9]+$/i.test(p);
  if (p !== "/" && !hasExt) {
    p = config.trailingSlash ? (p.endsWith("/") ? p : `${p}/`) : p.replace(/\/+$/, "");
  }
  const base = `${config.url}${config.basePath}`;
  if (p === "/") return config.trailingSlash ? `${base}/` : base;
  return `${base}${p}`;
}
