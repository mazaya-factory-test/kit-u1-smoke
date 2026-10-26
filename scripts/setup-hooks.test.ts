import { describe, expect, it } from "vitest";
import { hookSetupPlan } from "./setup-hooks.mjs";

describe("hookSetupPlan", () => {
  it("arms hooks in the main checkout when the hook file exists", () => {
    expect(hookSetupPlan({ gitDir: "/r/.git", gitCommonDir: "/r/.git", hookFileExists: true }).configure).toBe(true);
  });
  it("refuses in a linked worktree (git-dir differs from common-dir)", () => {
    const plan = hookSetupPlan({ gitDir: "/r/.git/worktrees/w", gitCommonDir: "/r/.git", hookFileExists: true });
    expect(plan.configure).toBe(false);
    expect(plan.reason).toContain("worktree");
  });
  it("refuses when the hook file is missing or git is unavailable", () => {
    expect(hookSetupPlan({ gitDir: "/r/.git", gitCommonDir: "/r/.git", hookFileExists: false }).configure).toBe(false);
    expect(hookSetupPlan({ gitDir: null, gitCommonDir: null, hookFileExists: true }).configure).toBe(false);
  });
});
