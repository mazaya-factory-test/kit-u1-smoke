import type { Metadata } from "next";
import { site } from "../../content/site";
import { buildMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = buildMetadata({ title: "About", description: site.about[0] ?? site.tagline, path: "/about/" });

export default function AboutPage() {
  return (
    <>
      <h1>About</h1>
      {site.about.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </>
  );
}
