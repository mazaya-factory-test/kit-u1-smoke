import type { Metadata } from "next";
import { site } from "../../content/site";
import { buildMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = buildMetadata({ title: "What we do", description: site.services[0]?.body ?? site.tagline, path: "/services/" });

export default function ServicesPage() {
  return (
    <>
      <h1>What we do</h1>
      {site.services.map((s) => (
        <section key={s.title} aria-labelledby={`svc-${s.title}`}>
          <h2 id={`svc-${s.title}`}>{s.title}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </>
  );
}
