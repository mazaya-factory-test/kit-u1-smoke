"use client";
// kit:layout-a11y@0.1.0 harvested from Outreach-master:components/a11y/RouteFocus.tsx
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MAIN_ID } from "./SkipLink";
import { shouldMoveFocus } from "./route-focus-logic";

/**
 * App Router navigation swaps the page without moving focus, so keyboard and screen reader
 * users keep stale focus (WCAG 2.4.3). After a client navigation, focus the #main landmark.
 * Needs `<main id="main" tabIndex={-1}>`. Renders nothing.
 */
export function RouteFocus() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (shouldMoveFocus(previous.current, pathname)) {
      document.getElementById(MAIN_ID)?.focus({ preventScroll: true });
    }
    previous.current = pathname;
  }, [pathname]);

  return null;
}
