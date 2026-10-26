// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/SiteFooter.tsx, landing-page:src/components/Footer.tsx (data-driven columns)
import type { ReactNode } from "react";
import Link from "next/link";
import { FOOTER_COLUMNS, type FooterColumn } from "../../lib/site/nav";
import { ExternalLink } from "./ExternalLink";
import styles from "./layout.module.css";

/**
 * Footer driven by `columns`. `children` renders in the bottom strip: the app puts its
 * legal line and the FooterCredit block there. This component imports no other block.
 */
export function SiteFooter({
  columns = FOOTER_COLUMNS,
  children,
}: {
  columns?: readonly FooterColumn[];
  children?: ReactNode;
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <nav aria-label="Footer">
          <div className={styles.footerColumns}>
            {columns.map((column) => (
              <div key={column.heading}>
                <h2 className={styles.footerHeading}>{column.heading}</h2>
                <ul className={styles.footerList}>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <ExternalLink href={link.href} className={styles.footerLink}>
                          {link.label}
                        </ExternalLink>
                      ) : (
                        <Link className={styles.footerLink} href={link.href}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        {children ? <div className={styles.footerBottom}>{children}</div> : null}
      </div>
    </footer>
  );
}
