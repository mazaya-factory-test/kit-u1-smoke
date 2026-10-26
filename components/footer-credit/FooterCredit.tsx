// kit:footer-credit@0.1.1 written for mazaya-factory DECISIONS.md #48
import styles from "./FooterCredit.module.css";

const STUDIO_URL = "https://mazayastudios.com/";

/** Reduce "https://www.Example.org/path" to "example.org" for the utm_source value. */
export function normaliseDomain(input: string): string {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) {
    throw new Error(`FooterCredit: "${input}" is not a domain`);
  }
  return host;
}

export function creditHref(clientDomain: string): string {
  const url = new URL(STUDIO_URL);
  url.searchParams.set("utm_source", normaliseDomain(clientDomain));
  url.searchParams.set("utm_medium", "footer_credit");
  return url.toString();
}

type Props = {
  /** The client site's own domain, e.g. "example.org". */
  clientDomain?: string;
  className?: string;
};

/**
 * The studio credit every client site carries (DECISIONS #48): one small, muted
 * line at the bottom of the footer. The link text is the brand name only.
 */
export function FooterCredit({ clientDomain = "example.org", className }: Props) {
  return (
    <p className={[styles.credit, className].filter(Boolean).join(" ")}>
      Site by <a href={creditHref(clientDomain)}>Mazaya Studios</a>
    </p>
  );
}
