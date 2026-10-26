// kit:gates@0.1.0 harvested from mazaya-studios:.githooks/pre-commit, Projects/secret-scan.sh
// Scans only what is STAGED (added lines of `git diff --cached`). Called by .githooks/pre-commit.
// Exit 0 clean, 1 findings. Prints file:line with the match masked.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { isEnvFile, isForbiddenEnvFile, scanLine } from "./secret-patterns.mjs";

const SKIP_FILE = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$|\.(png|jpe?g|gif|webp|ico|pdf|woff2?|ttf|otf)$/i;

/**
 * Parse a unified diff (-U0) into added lines with their new-file line numbers.
 * @param {string} diff @returns {{ file: string, line: number, text: string }[]}
 */
export function addedLines(diff) {
  const out = [];
  let file = null;
  let next = 0;
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("+++ ")) {
      file = raw === "+++ /dev/null" ? null : raw.replace(/^\+\+\+ b\//, "");
    } else if (raw.startsWith("@@")) {
      const m = /\+(\d+)/.exec(raw);
      next = m ? Number(m[1]) : 0;
    } else if (file && raw.startsWith("+") && !raw.startsWith("+++")) {
      out.push({ file, line: next++, text: raw.slice(1) });
    }
  }
  return out;
}

/** @returns {string[]} one message per finding, formatted file:line */
export function findProblems({ stagedFiles, diff }) {
  const problems = [];
  for (const f of stagedFiles) {
    if (isForbiddenEnvFile(f)) problems.push(`${f}: .env files must not be committed (only .env.example)`);
  }
  for (const { file, line, text } of addedLines(diff)) {
    if (SKIP_FILE.test(file)) continue;
    for (const hit of scanLine(text, { envFile: isEnvFile(file) })) {
      problems.push(`${file}:${line}: ${hit.name} ${hit.masked}`);
    }
  }
  return problems;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

export function main() {
  const stagedFiles = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]).split("\0").filter(Boolean);
  const diff = git(["diff", "--cached", "-U0", "--no-color", "--diff-filter=ACMR"]);
  const problems = findProblems({ stagedFiles, diff });
  if (problems.length === 0) return 0;
  console.error("pre-commit: commit rejected, possible secrets in staged changes:");
  for (const p of problems) console.error(`  ${p}`);
  console.error("pre-commit: remove the value (rotate it if it was real). Do not weaken the patterns.");
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
