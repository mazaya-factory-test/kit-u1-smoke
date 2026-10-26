// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/SkipLink.tsx
import styles from "./layout.module.css";

/** The id the skip link targets. Put `<main id="main" tabIndex={-1}>` on every page. */
export const MAIN_ID = "main";

/** First focusable element in <body>. Visible only while focused. */
export function SkipLink({ label = "Skip to content" }: { label?: string }) {
  return (
    <a className={styles.skip} href={`#${MAIN_ID}`}>
      {label}
    </a>
  );
}
