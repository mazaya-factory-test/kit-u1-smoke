// kit:gates@0.1.1 harvested from CardCap:apps/web/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

// E2E_PORT moves the port so parallel worktrees do not serve each other's build.
const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;
// next.config's basePath on a GitHub Pages project site (e.g. /repo); empty at a domain root.
const BASE_PATH = (process.env.BASE_PATH ?? "").split("/").filter(Boolean).map((s) => `/${s}`).join("");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Serves the already-built out/ folder. Run `npm run build` first.
  webServer: {
    command: "node e2e/static-server.mjs",
    url: `${BASE_URL}${BASE_PATH}/`, // the site root; the server answers 404 outside the base path
    env: { E2E_PORT: String(PORT), BASE_PATH },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
