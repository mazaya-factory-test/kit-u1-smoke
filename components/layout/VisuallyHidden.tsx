// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/ExternalLink.tsx (visually-hidden text pattern)
import type { ReactNode } from "react";
import styles from "./layout.module.css";

/** Text for screen readers only. Still in the accessibility tree, invisible on screen. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}
