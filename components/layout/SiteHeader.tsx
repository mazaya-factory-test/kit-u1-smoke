"use client";
// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/SiteHeader.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ariaCurrent, BRAND, NAV_LINKS, type NavLink } from "../../lib/site/nav";
import { ExternalLink } from "./ExternalLink";
import { MobileNav } from "./MobileNav";
import styles from "./layout.module.css";

type HeaderProps = {
  brand?: { readonly name: string; readonly href: string };
  links?: readonly NavLink[];
};

/** Presentational half: takes the pathname as a prop so it renders (and tests) without a router. */
export function SiteHeaderView({
  brand = BRAND,
  links = NAV_LINKS,
  pathname,
}: HeaderProps & { pathname: string | null }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={brand.href}>
          {brand.name}
        </Link>
        <nav aria-label="Primary">
          <div className={styles.desktopNav}>
            <ul className={styles.navList}>
              {links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <ExternalLink href={link.href} className={styles.navLink}>
                      {link.label}
                    </ExternalLink>
                  ) : (
                    <Link
                      className={`${styles.navLink} ${link.primary ? styles.primary : ""}`}
                      href={link.href}
                      aria-current={ariaCurrent(pathname, link.href)}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <MobileNav links={links} pathname={pathname} />
        </nav>
      </div>
    </header>
  );
}

export function SiteHeader(props: HeaderProps) {
  return <SiteHeaderView {...props} pathname={usePathname()} />;
}
