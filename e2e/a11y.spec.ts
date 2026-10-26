// kit:gates@0.1.1 harvested from CardCap:apps/web/e2e/a11y-axe.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

// BASE_PATH (e.g. /repo) is the next.config basePath of a GitHub Pages project site; unset means the domain root.
const BASE = (process.env.BASE_PATH ?? "").split("/").filter(Boolean).map((s) => `/${s}`).join("");

// WCAG 2.1 A/AA scan of every route, once normally and once with reduced motion emulated.
// Serious and critical violations fail the test; minor and moderate ones are logged only.
const MOTION = [
  { label: "default", reducedMotion: "no-preference" as const },
  { label: "reduced-motion", reducedMotion: "reduce" as const },
];

for (const { label, reducedMotion } of MOTION) {
  for (const route of ROUTES) {
    test(`no serious a11y violations: ${route} [${label}]`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const summary = blocking.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`);
      expect(summary, `axe violations on ${route} [${label}]`).toEqual([]);
    });
  }
}
