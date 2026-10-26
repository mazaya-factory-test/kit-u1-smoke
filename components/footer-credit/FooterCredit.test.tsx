import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FooterCredit, creditHref, normaliseDomain } from "./FooterCredit";

describe("FooterCredit", () => {
  it("renders the exact credit line with the brand name as the only link text", () => {
    const html = renderToStaticMarkup(<FooterCredit clientDomain="example.org" />);
    expect(html).toContain("Site by <a ");
    expect(html).toContain(">Mazaya Studios</a>");
    expect(html).toContain(
      'href="https://mazayastudios.com/?utm_source=example.org&amp;utm_medium=footer_credit"',
    );
  });

  it("normalises the client domain before it enters the utm value", () => {
    expect(normaliseDomain("https://www.Example.org/about?x=1")).toBe("example.org");
    expect(normaliseDomain("shop.example.co.uk:8080")).toBe("shop.example.co.uk");
    expect(creditHref("WWW.example.org")).toBe(
      "https://mazayastudios.com/?utm_source=example.org&utm_medium=footer_credit",
    );
  });

  it("refuses anything that is not a domain, including an unrendered placeholder", () => {
    // Split so `kit add` does not render this literal into the real domain.
    const unrendered = "{{" + "client_domain}}";
    for (const bad of ["", "localhost", unrendered, "javascript:alert(1)", "a b.com", "evil.com\"><script>"]) {
      expect(() => normaliseDomain(bad), bad).toThrow(/not a domain/);
    }
  });

  it("appends a caller class without dropping its own", () => {
    const html = renderToStaticMarkup(<FooterCredit clientDomain="example.org" className="mine" />);
    expect(html).toMatch(/class="[^"]*mine"/);
  });
});
