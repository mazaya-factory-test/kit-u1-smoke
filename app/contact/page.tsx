import type { Metadata } from "next";
import { site } from "../../content/site";
import { buildMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = buildMetadata({ title: "Contact", description: site.contact.note, path: "/contact/" });

// U1 sites have no write paths (FACTORY-SPEC.md §9.3): contact is a mailto link.
export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>
      <p>{site.contact.note}</p>
      <p>
        Email <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
      </p>
    </>
  );
}
