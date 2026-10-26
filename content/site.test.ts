import { describe, expect, it } from "vitest";
import { site, synthetic } from "./site";

describe("site content", () => {
  it("never ships synthetic copy from main once the site is live", () => {
    // Once the client signs off the copy (FACTORY-SPEC.md §4 S12), the build lane adds
    // REQUIRE_REAL_CONTENT: "1" to the verify step's env in deploy-pages.yml.
    // Until then synthetic copy is expected and this test passes.
    if (process.env.REQUIRE_REAL_CONTENT === "1") expect(synthetic).toBe(false);
  });

  it("has a real-looking contact address", () => {
    expect(site.contact.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });
});
