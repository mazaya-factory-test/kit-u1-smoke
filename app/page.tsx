import type { Metadata } from "next";
import Link from "next/link";
import { site } from "../content/site";
import { buildMetadata } from "../lib/seo/metadata";

export const metadata: Metadata = buildMetadata({ title: "Kit U1 Smoke", description: site.tagline, path: "/" });

export default function HomePage() {
  return (
    <>
      <h1>{site.tagline}</h1>
      <p>{site.intro}</p>
      <p>
        <Link href="/services/">What we do</Link> or <Link href="/contact/">get in touch</Link>.
      </p>
    </>
  );
}
