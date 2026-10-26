import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { isForbiddenEnvFile, mask, scanLine } from "./secret-patterns.mjs";
import { addedLines, findProblems } from "./secret-scan.mjs";

// Fake secrets are assembled from pieces so this repo never contains a real-looking credential.
const aws = "AK" + "IA" + "ABCDEFGHIJKLMNOP";
const stripe = "sk_" + "live_" + "abcdefghij1234567890";
const resend = "re_" + "AbCd1234" + "_" + "abcdefghijklmnopqrstuvwx";
const ghp = "gh" + "p_" + "a".repeat(36);
const ghPat = "github_" + "pat_" + "A1b2C3d4E5f6G7h8I9j0K1";
const pem = "-----BEGIN " + "RSA PRIVATE KEY-----";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const serviceJwt = ["eyJhbGciOiJIUzI1NiJ9", b64({ role: "service_role", iss: "supabase" }), "sigsigsig"].join(".");
const anonJwt = ["eyJhbGciOiJIUzI1NiJ9", b64({ role: "anon", iss: "supabase" }), "sigsigsig"].join(".");

describe("scanLine", () => {
  it.each([
    ["AWS", aws],
    ["Stripe", stripe],
    ["Resend", resend],
    ["GitHub token", ghp],
    ["GitHub fine-grained", ghPat],
    ["private key", pem],
    ["service_role", serviceJwt],
  ])("flags %s", (_n, secret) => {
    expect(scanLine(`const k = "${secret}";`).length).toBeGreaterThan(0);
  });

  it("does not flag an anon JWT, ordinary identifiers, or prose", () => {
    expect(scanLine(`key = "${anonJwt}"`)).toEqual([]);
    expect(scanLine("const re_render_the_whole_page_again_now = 1;")).toEqual([]);
    expect(scanLine("AKIA is the AWS prefix")).toEqual([]);
  });

  it("flags NAME_SECRET=value only in env-style files, and lets placeholders pass", () => {
    expect(scanLine("SESSION_SECRET=hunter2hunter2", { envFile: true }).length).toBe(1);
    expect(scanLine("SESSION_SECRET=hunter2hunter2")).toEqual([]);
    expect(scanLine("SESSION_SECRET=", { envFile: true })).toEqual([]);
    expect(scanLine("SESSION_SECRET=<your secret>", { envFile: true })).toEqual([]);
    expect(scanLine("STRIPE_API_KEY=$STRIPE", { envFile: true })).toEqual([]);
  });

  it("masks the match", () => {
    const [hit] = scanLine(aws);
    expect(hit?.masked).toBe("AKIA************");
    expect(hit?.masked).not.toContain("ABCDEFGH");
    expect(mask("abc")).toBe("abc");
  });
});

describe("env file rule", () => {
  it("forbids .env files except .env.example", () => {
    expect(isForbiddenEnvFile(".env")).toBe(true);
    expect(isForbiddenEnvFile("apps/web/.env.local")).toBe(true);
    expect(isForbiddenEnvFile(".env.example")).toBe(false);
    expect(isForbiddenEnvFile("src/env.ts")).toBe(false);
  });
});

describe("addedLines", () => {
  it("returns new-file line numbers for added lines only", () => {
    const diff = ["diff --git a/f.txt b/f.txt", "--- a/f.txt", "+++ b/f.txt", "@@ -1,2 +10,2 @@", "-old", "+new1", "+new2"].join("\n");
    expect(addedLines(diff)).toEqual([
      { file: "f.txt", line: 10, text: "new1" },
      { file: "f.txt", line: 11, text: "new2" },
    ]);
    expect(findProblems({ stagedFiles: [], diff: diff.replace("new1", aws) })[0]).toBe("f.txt:10: AWS access key id AKIA************");
  });
});

describe("pre-commit hook in a temp repo", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const kitRoot = join(here, "..");
  const repos: string[] = [];
  afterEach(() => { for (const r of repos.splice(0)) rmSync(r, { recursive: true, force: true }); });

  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, stdio: "pipe" });

  function repo(files: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), "hook-"));
    repos.push(dir);
    git(dir, "init", "-q");
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, ".githooks"));
    for (const f of ["secret-scan.mjs", "secret-patterns.mjs"]) copyFileSync(join(here, f), join(dir, "scripts", f));
    copyFileSync(join(kitRoot, ".githooks/pre-commit"), join(dir, ".githooks/pre-commit"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    git(dir, "add", "-A", "--", ...Object.keys(files));
    return dir;
  }
  const runHook = (dir: string) => spawnSync("sh", [join(dir, ".githooks/pre-commit")], { cwd: dir, encoding: "utf8" });

  it("ships executable", () => {
    expect(statSync(join(kitRoot, ".githooks/pre-commit")).mode & 0o111).not.toBe(0);
  });

  it("blocks a staged secret, printing file:line masked", () => {
    const r = runHook(repo({ "a.ts": `line one\nconst k = "${aws}";\n` }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("a.ts:2: AWS access key id AKIA************");
    expect(r.stderr).not.toContain(aws);
  });

  it("blocks a staged .env but allows .env.example", () => {
    expect(runHook(repo({ ".env": "FOO=1\n" })).status).toBe(1);
    expect(runHook(repo({ ".env.example": "SESSION_SECRET=\nFOO=bar\n" })).status).toBe(0);
  });

  it("passes clean content, and ignores a secret that is not staged", () => {
    expect(runHook(repo({ "ok.ts": "export const a = 1;\n" })).status).toBe(0);
    const dir = repo({ "ok.ts": "export const a = 1;\n" });
    writeFileSync(join(dir, "unstaged.ts"), `const k = "${aws}";\n`);
    expect(runHook(dir).status).toBe(0);
  });
});
