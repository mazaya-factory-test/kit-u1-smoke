import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { FooterCredit } from "../components/footer-credit/FooterCredit";
import { RouteFocus } from "../components/layout/RouteFocus";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { MAIN_ID, SkipLink } from "../components/layout/SkipLink";
import { JsonLd, organizationJsonLd } from "../lib/seo/json-ld";
import { getSiteConfig, siteBaseUrl } from "../lib/seo/site";
import "./globals.css";

const site = getSiteConfig();

// A meta-tag CSP (FACTORY-SPEC.md §9.3): GitHub Pages cannot send response headers.
// Next's static export inlines its bootstrap scripts, hence 'unsafe-inline' for scripts.
// U1 sites load no third-party scripts, so nothing else is allowed.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
].join("; ");

// Stamped by deploy-pages.yml with the commit sha; monitor.yml asserts it on every page.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "0000000";

export const metadata: Metadata = {
  metadataBase: siteBaseUrl(site),
  title: { default: site.name, template: `%s | ${site.name}` },
  other: { "build-id": BUILD_ID },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body>
        <SkipLink />
        <SiteHeader />
        <main id={MAIN_ID} tabIndex={-1}>
          {children}
        </main>
        <SiteFooter>
          <FooterCredit />
        </SiteFooter>
        <RouteFocus />
        <JsonLd data={organizationJsonLd(site)} />
      </body>
    </html>
  );
}
