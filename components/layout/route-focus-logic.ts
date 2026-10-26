// kit:layout-a11y@0.1.0 harvested from Outreach-master:components/a11y/RouteFocus.tsx (decision extracted so it can be tested)

/** Move focus only on a real client navigation: not on first load, not when the path is unchanged. */
export function shouldMoveFocus(previous: string | null | undefined, next: string | null | undefined): boolean {
  return previous != null && next != null && previous !== next;
}
