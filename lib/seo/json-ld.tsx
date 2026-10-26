// kit:seo@0.1.1 harvested from creativ-astrology-land:components/JsonLd.tsx; Outreach-master:lib/seo/structured-data.ts
import { absoluteUrl, getSiteConfig, type SiteConfig } from "./site";

type JsonLdNode = Record<string, unknown>;

/**
 * Serialises JSON-LD for inline <script> use. JSON.stringify can emit a literal
 * `</script>` inside a string value, which would close the tag early and let the rest
 * run as HTML. Escaping `<`, `>` and `&` as unicode escapes (valid JSON, same value) and
 * the JS line separators U+2028/2029 closes that hole.
 */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: JsonLdNode }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function organizationJsonLd(config: SiteConfig = getSiteConfig(), extra: JsonLdNode = {}): JsonLdNode {
  return { "@context": "https://schema.org", "@type": "Organization", name: config.name, url: absoluteUrl(config, "/"), ...extra };
}

export function websiteJsonLd(config: SiteConfig = getSiteConfig(), extra: JsonLdNode = {}): JsonLdNode {
  return { "@context": "https://schema.org", "@type": "WebSite", name: config.name, url: absoluteUrl(config, "/"), ...extra };
}

export interface ArticleInput {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
}

export function articleJsonLd(input: ArticleInput, config: SiteConfig = getSiteConfig()): JsonLdNode {
  const org = { "@type": "Organization", name: config.name, url: absoluteUrl(config, "/") };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: absoluteUrl(config, input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: input.authorName ? { "@type": "Person", name: input.authorName } : org,
    publisher: org,
    ...(input.image ? { image: absoluteUrl(config, input.image) } : {}),
  };
}
