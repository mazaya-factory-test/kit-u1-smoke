// Starter override of the seo block's route registry (u1-static-site). kit diff shows locally-modified: expected.
/**
 * The single route registry. robots.ts and sitemap.ts are both derived from it, so
 * registering a page is what advertises it and marking it `indexable: false` is what
 * hides it from the sitemap AND disallows it in robots. Edit this list for your site.
 *
 * `lastModified` is an optional PINNED ISO date. Never use `new Date()` here: a
 * computed date changes the bytes of sitemap.xml on every build and lies to crawlers.
 */
export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface RouteEntry {
  path: string;
  changeFrequency: ChangeFrequency;
  /** 0.0 to 1.0 */
  priority: number;
  indexable: boolean;
  lastModified?: string;
}

export const routes: readonly RouteEntry[] = [
  { path: "/", changeFrequency: "monthly", priority: 1, indexable: true },
  { path: "/about/", changeFrequency: "yearly", priority: 0.7, indexable: true },
  { path: "/services/", changeFrequency: "yearly", priority: 0.8, indexable: true },
  { path: "/contact/", changeFrequency: "yearly", priority: 0.6, indexable: true },
];

export function indexableRoutes(list: readonly RouteEntry[] = routes): RouteEntry[] {
  return list.filter((r) => r.indexable);
}

export function nonIndexableRoutes(list: readonly RouteEntry[] = routes): RouteEntry[] {
  return list.filter((r) => !r.indexable);
}

/** True when `path` is registered as non-indexable (trailing slash ignored). */
export function isNonIndexable(path: string, list: readonly RouteEntry[] = routes): boolean {
  const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  return list.some((r) => !r.indexable && norm(r.path) === norm(path));
}
