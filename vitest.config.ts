import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.{ts,tsx,mjs}"],
    exclude: ["node_modules/**", ".next/**", "out/**", "e2e/**", ".claude/**"],
    environment: "node",
    restoreMocks: true,
  },
});
