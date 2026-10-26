// kit:layout-a11y@0.1.0 harvested from mazaya-studios:lib/motion/prefers-reduced-motion.ts

const QUERY = "(prefers-reduced-motion: reduce)";

type MediaHost = {
  matchMedia(query: string): {
    matches: boolean;
    addEventListener(type: "change", cb: (event: { matches: boolean }) => void): void;
    removeEventListener(type: "change", cb: (event: { matches: boolean }) => void): void;
  };
};

const browserWindow = (): MediaHost | undefined =>
  typeof window === "undefined" ? undefined : (window as unknown as MediaHost);

/** True when the visitor asked for less motion. False on the server. `win` is injectable for tests. */
export function prefersReducedMotion(win: MediaHost | undefined = browserWindow()): boolean {
  return win !== undefined && win.matchMedia(QUERY).matches;
}

/** Calls `cb` whenever the preference changes; returns the unsubscribe function. */
export function subscribeReducedMotion(
  cb: (reduced: boolean) => void,
  win: MediaHost | undefined = browserWindow(),
): () => void {
  if (win === undefined) return () => {};
  const mql = win.matchMedia(QUERY);
  const handler = (event: { matches: boolean }) => cb(event.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
