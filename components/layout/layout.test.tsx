import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FOOTER_COLUMNS, ariaCurrent, normalisePath } from "../../lib/site/nav";
import { ExternalLink } from "./ExternalLink";
import { MobileNav } from "./MobileNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeaderView } from "./SiteHeader";
import { SkipLink } from "./SkipLink";
import { initialMobileNavState, mobileNavReducer } from "./mobile-nav-state";
import { shouldMoveFocus } from "./route-focus-logic";

const links = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact", primary: true },
];

describe("SkipLink", () => {
  it("points at #main", () => {
    expect(renderToStaticMarkup(<SkipLink />)).toContain('href="#main"');
  });
});

describe("aria-current", () => {
  it("is set only on the link matching the current path, ignoring trailing slash", () => {
    expect(ariaCurrent("/about", "/about/")).toBe("page");
    expect(ariaCurrent("/about/", "/about/")).toBe("page");
    expect(ariaCurrent("/about/team", "/about/")).toBeUndefined();
    expect(ariaCurrent("/", "/about/")).toBeUndefined();
    expect(ariaCurrent(null, "/")).toBeUndefined();
    expect(ariaCurrent("/", "https://example.org/")).toBeUndefined();
    expect(normalisePath("/a/?x=1#y")).toBe("/a");
  });

  it("renders aria-current on exactly the active links in header (desktop and mobile lists)", () => {
    const html = renderToStaticMarkup(<SiteHeaderView links={links} pathname="/about/" />);
    const hits = html.match(/aria-current="page"/g) ?? [];
    expect(hits.length).toBe(3); // About only: desktop list, mobile panel, noscript copy
    expect((html.match(/aria-current="page"[^>]*>About</g) ?? []).length).toBe(3);
    expect(renderToStaticMarkup(<SiteHeaderView links={links} pathname="/nowhere/" />)).not.toContain("aria-current");
  });
});

describe("MobileNav", () => {
  it("renders a closed disclosure button wired to its panel", () => {
    const html = renderToStaticMarkup(<MobileNav links={links} pathname="/" />);
    expect(html).toContain('aria-expanded="false"');
    const controls = /aria-controls="([^"]+)"/.exec(html)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain(`id="${controls}"`);
    expect(html).toMatch(/id="[^"]+"[^>]*hidden/);
  });

  it("reducer: toggle opens and closes, Escape closes and returns focus, route change closes quietly", () => {
    const opened = mobileNavReducer(initialMobileNavState, { type: "toggle" });
    expect(opened.open).toBe(true);
    expect(mobileNavReducer(opened, { type: "escape" })).toEqual({ open: false, returnFocus: true });
    expect(mobileNavReducer(opened, { type: "route-change" })).toEqual({ open: false, returnFocus: false });
    expect(mobileNavReducer(opened, { type: "toggle" }).open).toBe(false);
    // closed state is returned unchanged (no re-render)
    expect(mobileNavReducer(initialMobileNavState, { type: "escape" })).toBe(initialMobileNavState);
    expect(mobileNavReducer(initialMobileNavState, { type: "route-change" })).toBe(initialMobileNavState);
  });
});

describe("RouteFocus logic", () => {
  it("skips first load and unchanged paths, moves on a real navigation", () => {
    expect(shouldMoveFocus(null, "/")).toBe(false);
    expect(shouldMoveFocus("/", "/")).toBe(false);
    expect(shouldMoveFocus("/", "/about/")).toBe(true);
  });
});

describe("ExternalLink", () => {
  it("opens in a new tab safely and says so to screen readers", () => {
    const html = renderToStaticMarkup(<ExternalLink href="https://example.org/">Docs</ExternalLink>);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("(opens in a new tab)");
  });
});

describe("SiteFooter", () => {
  it("renders data-driven columns and the children slot", () => {
    const html = renderToStaticMarkup(
      <SiteFooter columns={[{ heading: "Col A", links: [{ href: "/a/", label: "Link A" }] }]}>
        <p>SLOT-CONTENT</p>
      </SiteFooter>,
    );
    expect(html).toContain("Col A");
    expect(html).toMatch(/href="\/a\/?"/);
    expect(html).toContain("SLOT-CONTENT");
  });

  it("renders no bottom strip without children, and the defaults come from nav.ts", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain(FOOTER_COLUMNS[0]!.heading);
    expect(html).not.toContain("SLOT-CONTENT");
  });
});

describe("block isolation", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const ownDirs = ["components/layout", "components/form", "lib/a11y", "lib/site"];
  const allowedBare = /^(react|react-dom(\/.*)?|next\/(link|navigation))$/;

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) return sources(p);
      return /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
    });
  }

  it("imports only its own directories, react and next", () => {
    const bad: string[] = [];
    for (const d of ownDirs) {
      for (const file of sources(join(root, d))) {
        const text = readFileSync(file, "utf8");
        for (const [, spec] of text.matchAll(/from\s+["']([^"']+)["']/g)) {
          if (spec!.startsWith(".")) {
            const rel = relative(root, resolve(dirname(file), spec!)).split("\\").join("/");
            if (!ownDirs.some((o) => rel === o || rel.startsWith(o + "/"))) bad.push(`${file}: ${spec}`);
          } else if (!allowedBare.test(spec!)) bad.push(`${file}: ${spec}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
