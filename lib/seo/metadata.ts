// kit:seo@0.1.1 harvested from creativ-astrology-land:lib/seo.ts
import type { Metadata } from "next";
import { isNonIndexable, routes, type RouteEntry } from "./routes";
import { absoluteUrl, getSiteConfig, type SiteConfig } from "./site";

export interface BuildMetadataInput {
  title: string;
  description: string;
  /** Route path, e.g. /work/alpha */
  path: string;
  /** Root-relative or absolute image URL. */
  image?: string;
  /** Force noindex. A route registered with `indexable: false` is noindex automatically. */
  noindex?: boolean;
  type?: "website" | "article";
}

/**
 * Metadata for one page: canonical, OpenGraph, Twitter and robots. All URLs are
 * absolute. Call from `generateMetadata` or `export const metadata`.
 */
export function buildMetadata(
  input: BuildMetadataInput,
  config: SiteConfig = getSiteConfig(),
  registry: readonly RouteEntry[] = routes,
): Metadata {
  const url = absoluteUrl(config, input.path);
  const images = input.image ? [{ url: absoluteUrl(config, input.image) }] : undefined;
  const noindex = input.noindex === true || isNonIndexable(input.path, registry);

  return {
    metadataBase: new URL(config.url),
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      siteName: config.name,
      type: input.type ?? "website",
      url,
      title: input.title,
      description: input.description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
