// kit:gates@0.1.0 harvested from "Card Centering Scanner":scripts/setup-hooks.mjs
// Arms core.hooksPath=.githooks, but never from a linked worktree (core.hooksPath lives in the
// SHARED git config, so writing it there would silently change the main checkout's hooks).
// Always exits 0 so `npm install` (which runs `prepare`) never breaks.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const HOOKS_DIR = ".githooks";
export const SENTINEL_HOOK = join(HOOKS_DIR, "pre-commit");

/**
 * Pure decision: should core.hooksPath be written?
 * @param {{ gitDir: string|null, gitCommonDir: string|null, hookFileExists: boolean }} input
 * @returns {{ configure: boolean, reason: string }}
 */
export function hookSetupPlan({ gitDir, gitCommonDir, hookFileExists }) {
  if (!gitDir || !gitCommonDir) {
    return { configure: false, reason: "not a git checkout (or git is unavailable), nothing to configure." };
  }
  if (resolve(gitDir) !== resolve(gitCommonDir)) {
    return {
      configure: false,
      reason: "this is a linked worktree; core.hooksPath is shared with the main checkout, so it is left alone. Run npm install in the main checkout.",
    };
  }
  if (!hookFileExists) {
    return { configure: false, reason: `${SENTINEL_HOOK} does not exist here; pointing hooksPath at a missing directory disables all hooks.` };
  }
  return { configure: true, reason: `main checkout with ${SENTINEL_HOOK} present, setting core.hooksPath=${HOOKS_DIR}.` };
}

function revParse(flag) {
  try {
    const v = execFileSync("git", ["rev-parse", flag], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return resolve(root, v);
  } catch {
    return null;
  }
}

export function main() {
  const { configure, reason } = hookSetupPlan({
    gitDir: revParse("--git-dir"),
    gitCommonDir: revParse("--git-common-dir"),
    hookFileExists: existsSync(join(root, SENTINEL_HOOK)),
  });
  if (!configure) {
    console.log(`setup-hooks: SKIPPED, ${reason}`);
    return;
  }
  try {
    execFileSync("git", ["config", "core.hooksPath", HOOKS_DIR], { cwd: root, stdio: "ignore" });
    console.log(`setup-hooks: ${reason}`);
  } catch {
    console.log("setup-hooks: SKIPPED, `git config core.hooksPath` failed. Run it by hand from the repo root.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
