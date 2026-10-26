// Starter override of the layout-a11y block's app-owned nav config (u1-static-site).
// kit diff reports this file as locally-modified: that is expected, the site owns it.

export type NavLink = {
  readonly href: string;
  readonly label: string;
  readonly primary?: boolean;
  readonly external?: boolean;
};

export type FooterColumn = {
  readonly heading: string;
  readonly links: readonly NavLink[];
};

export const BRAND = { name: "Kit U1 Smoke", href: "/" } as const;

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/services/", label: "What we do" },
  { href: "/contact/", label: "Contact", primary: true },
];

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Kit U1 Smoke",
    links: [
      { href: "/about/", label: "About" },
      { href: "/services/", label: "What we do" },
      { href: "/contact/", label: "Contact" },
    ],
  },
];

/** "/about/" and "/about" are the same page; query and hash never count. */
export function normalisePath(input: string): string {
  const bare = (input.split("#")[0] ?? "").split("?")[0] ?? "";
  if (bare === "" || bare === "/") return "/";
  return bare.replace(/\/+$/, "");
}

/** `aria-current="page"` only on the link whose path equals the current path. */
export function ariaCurrent(pathname: string | null | undefined, href: string): "page" | undefined {
  if (pathname == null || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) return undefined;
  return normalisePath(pathname) === normalisePath(href) ? "page" : undefined;
}
