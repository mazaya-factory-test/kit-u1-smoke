// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/ExternalLink.tsx
import type { ReactNode } from "react";
import { VisuallyHidden } from "./VisuallyHidden";
import styles from "./layout.module.css";

/** Opens in a new tab, safely, and tells screen reader users so. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className ?? styles.externalLink}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
    </a>
  );
}
