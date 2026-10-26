"use client";
// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/MobileNav.tsx
import Link from "next/link";
import { useEffect, useId, useReducer, useRef } from "react";
import { ariaCurrent, type NavLink } from "../../lib/site/nav";
import { ExternalLink } from "./ExternalLink";
import { initialMobileNavState, mobileNavReducer } from "./mobile-nav-state";
import styles from "./layout.module.css";

/**
 * Disclosure menu for narrow screens. The button owns aria-expanded and aria-controls;
 * opening moves focus to the first link, Escape closes and returns focus to the button,
 * and a route change closes it. Without JS the links render inside <noscript>.
 */
export function MobileNav({
  links,
  pathname,
  label = "Menu",
}: {
  links: readonly NavLink[];
  pathname: string | null;
  label?: string;
}) {
  const [state, dispatch] = useReducer(mobileNavReducer, initialMobileNavState);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    dispatch({ type: "route-change" });
  }, [pathname]);

  useEffect(() => {
    if (!state.open) return;
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "escape" });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.open]);

  useEffect(() => {
    if (state.returnFocus) buttonRef.current?.focus();
  }, [state.returnFocus]);

  const items = links.map((link) => (
    <li key={link.href}>
      {link.external ? (
        <ExternalLink href={link.href} className={styles.panelLink}>
          {link.label}
        </ExternalLink>
      ) : (
        <Link
          className={`${styles.panelLink} ${link.primary ? styles.primary : ""}`}
          href={link.href}
          aria-current={ariaCurrent(pathname, link.href)}
        >
          {link.label}
        </Link>
      )}
    </li>
  ));

  return (
    <div className={styles.mobileWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={state.open}
        aria-controls={panelId}
        onClick={() => dispatch({ type: "toggle" })}
      >
        {state.open ? "Close" : label}
      </button>
      <div id={panelId} ref={panelRef} className={styles.panel} hidden={!state.open}>
        <ul className={styles.panelList}>{items}</ul>
      </div>
      <noscript>
        <ul className={styles.panelList}>{items}</ul>
      </noscript>
    </div>
  );
}
