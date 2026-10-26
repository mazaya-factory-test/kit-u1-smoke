import { describe, expect, it } from "vitest";
import { prefersReducedMotion, subscribeReducedMotion } from "./reduced-motion";

function fakeWindow(initial: boolean) {
  let handler: ((e: { matches: boolean }) => void) | undefined;
  return {
    emit: (m: boolean) => handler?.({ matches: m }),
    active: () => handler !== undefined,
    win: {
      matchMedia: (q: string) => {
        expect(q).toBe("(prefers-reduced-motion: reduce)");
        return {
          matches: initial,
          addEventListener: (_: "change", cb: (e: { matches: boolean }) => void) => { handler = cb; },
          removeEventListener: () => { handler = undefined; },
        };
      },
    },
  };
}

describe("reduced motion", () => {
  it("reads the preference and is false with no window (server)", () => {
    expect(prefersReducedMotion(fakeWindow(true).win)).toBe(true);
    expect(prefersReducedMotion(fakeWindow(false).win)).toBe(false);
    expect(prefersReducedMotion(undefined)).toBe(false);
  });

  it("subscribes, notifies, and unsubscribes", () => {
    const f = fakeWindow(false);
    const seen: boolean[] = [];
    const off = subscribeReducedMotion((r) => seen.push(r), f.win);
    f.emit(true);
    off();
    expect(f.active()).toBe(false);
    expect(seen).toEqual([true]);
    expect(subscribeReducedMotion(() => {}, undefined)()).toBeUndefined();
  });
});
