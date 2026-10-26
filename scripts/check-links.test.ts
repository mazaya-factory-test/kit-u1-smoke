import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { checkOut, extractRefs, normalizeBasePath, parseArgs, run } from "./check-links.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

function site(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "check-links-"));
  dirs.push(dir);
  for (const [name, body] of Object.entries(files)) {
    const full = join(dir, name);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
}

const page = (body: string) => `<!doctype html><html><body>${body}</body></html>`;

describe("check-links", () => {
  it("passes when links, trailing slashes, .html pages, query/hash and assets all resolve", () => {
    const out = site({
      "index.html": page('<a href="/about/">a</a><a href="/pricing?x=1#plans">p</a><a href="team">t</a><a href="#top">top</a><a href="#hero">h</a><h1 id="hero">x</h1><img src="/logo.png"><script src="/_next/a.js"></script><a href="https://example.org/nope">ext</a><a href="mailto:a@b.c">m</a>'),
      "about/index.html": page('<a href="/">home</a>'),
      "pricing.html": page('<h2 id="plans">Plans</h2>'),
      "team.html": page(""),
      "logo.png": "x",
      "_next/a.js": "x",
    });
    expect(checkOut(out)).toEqual([]);
    expect(run(out, { out: () => {}, err: () => {} })).toBe(0);
  });

  it("reports a broken link as file:href", () => {
    const out = site({ "index.html": page('<a href="/missing/">x</a>'), "blog/index.html": page('<img src="/gone.png">') });
    expect(checkOut(out)).toEqual([
      { file: "blog/index.html", href: "/gone.png", reason: "missing-file" },
      { file: "index.html", href: "/missing/", reason: "missing-file" },
    ]);
    const errs: string[] = [];
    expect(run(out, { out: () => {}, err: (m) => errs.push(m) })).toBe(1);
    expect(errs.join("\n")).toContain("index.html:/missing/");
  });

  it("reports a broken anchor on the same page and on another page", () => {
    const out = site({
      "index.html": page('<a href="#nope">a</a><a href="/about/#ghost">b</a><a href="/about/#real">c</a>'),
      "about/index.html": page('<p id="real">r</p>'),
    });
    expect(checkOut(out)).toEqual([
      { file: "index.html", href: "#nope", reason: "missing-anchor" },
      { file: "index.html", href: "/about/#ghost", reason: "missing-anchor" },
    ]);
  });

  it("ignores URLs inside inline scripts and comments", () => {
    const out = site({ "index.html": page('<!-- <a href="/c"> --><script>var s = \'<a href="/inline">\'</script>') });
    expect(checkOut(out)).toEqual([]);
    expect(extractRefs('<a href="a&amp;b">').refs[0]?.value).toBe("a&b");
  });

  it("exits 2 when out/ is missing, and the real CLI agrees", () => {
    const out = site({});
    const missing = join(out, "nope");
    expect(run(missing, { out: () => {}, err: () => {} })).toBe(2);
    expect(spawnSync(process.execPath, [join(here, "check-links.mjs"), missing]).status).toBe(2);
    const broken = site({ "index.html": page('<a href="/x/">x</a>') });
    expect(spawnSync(process.execPath, [join(here, "check-links.mjs"), broken]).status).toBe(1);
  });
});

// A GitHub Pages project site: next.config basePath "/repo". Next writes files at the out/ root,
// and every root-absolute href must carry the prefix.
describe("check-links with a base path", () => {
  const quiet = { out: () => {}, err: () => {} };
  const project = () =>
    site({
      "index.html": page(
        '<link rel="stylesheet" href="/repo/_next/a.css"><script src="/repo/_next/a.js"></script>' +
          '<a href="/repo/about/">a</a><a href="/repo/">home</a><a href="/repo">bare</a><a href="/repo/about/#team">t</a>' +
          '<a href="#hero">h</a><h1 id="hero">x</h1><a href="about/">rel</a><a href="https://example.org/nope">ext</a>',
      ),
      "about/index.html": page('<a href="../">up</a><a href="/repo/">home</a><h2 id="team">Team</h2>'),
      "_next/a.css": "x",
      "_next/a.js": "x",
    });

  it("resolves prefixed absolute links and relative links against the served path", () => {
    expect(checkOut(project(), { basePath: "/repo" })).toEqual([]);
    expect(run(project(), quiet, { basePath: "/repo" })).toBe(0);
    // trailing slash and missing leading slash in the option are the same base path
    expect(checkOut(project(), { basePath: "repo/" })).toEqual([]);
  });

  it("flags the live defect: a root-absolute href that skips the base path", () => {
    const out = site({
      "index.html": page('<script src="/_next/a.js"></script><a href="/about/">a</a><a href="/repo/about/">ok</a>'),
      "about/index.html": page(""),
      "_next/a.js": "x",
    });
    expect(checkOut(out, { basePath: "/repo" })).toEqual([
      { file: "index.html", href: "/_next/a.js", reason: "outside-base-path" },
      { file: "index.html", href: "/about/", reason: "outside-base-path" },
    ]);
    // the same tree with NO base path is fine apart from the prefixed link, which is a missing file
    expect(checkOut(out)).toEqual([{ file: "index.html", href: "/repo/about/", reason: "missing-file" }]);
  });

  it("does not treat a sibling prefix as inside the base path", () => {
    const out = site({ "index.html": page('<a href="/repo-other/">x</a>'), "repo-other/index.html": page("") });
    expect(checkOut(out, { basePath: "/repo" })).toEqual([{ file: "index.html", href: "/repo-other/", reason: "outside-base-path" }]);
  });

  it("still reports missing files and anchors under the prefix, with the href as written", () => {
    const out = site({
      "index.html": page('<a href="/repo/gone/">x</a><a href="/repo/about/#ghost">y</a><img src="/repo/missing.png">'),
      "about/index.html": page('<p id="real">r</p>'),
    });
    expect(checkOut(out, { basePath: "/repo" })).toEqual([
      { file: "index.html", href: "/repo/gone/", reason: "missing-file" },
      { file: "index.html", href: "/repo/about/#ghost", reason: "missing-anchor" },
      { file: "index.html", href: "/repo/missing.png", reason: "missing-file" },
    ]);
  });

  it("a relative link that climbs out of the base path is outside it", () => {
    const out = site({ "about/index.html": page('<a href="../../x">x</a>'), "index.html": page("") });
    expect(checkOut(out, { basePath: "/repo" })).toEqual([{ file: "about/index.html", href: "../../x", reason: "outside-base-path" }]);
  });

  it("normalizeBasePath and parseArgs", () => {
    expect(normalizeBasePath(undefined)).toBe("");
    expect(normalizeBasePath("/")).toBe("");
    expect(normalizeBasePath("/a//b/")).toBe("/a/b");
    for (const bad of ["/a?x", "/a#x", "/a b", "/a/../b", "https://evil.test"]) expect(() => normalizeBasePath(bad), bad).toThrow();
    expect(parseArgs([])).toEqual({});
    expect(parseArgs(["dist", "--base-path", "/r"])).toEqual({ outDir: "dist", basePath: "/r" });
    expect(parseArgs(["--base-path=/r", "dist"])).toEqual({ outDir: "dist", basePath: "/r" });
    expect(parseArgs(["--base-path="])).toEqual({ basePath: "" });
    expect(() => parseArgs(["--nope"])).toThrow(/unknown option/);
    expect(() => parseArgs(["a", "b"])).toThrow(/unexpected/);
    expect(() => parseArgs(["--base-path"])).toThrow(/needs a value/);
  });

  it("the real CLI: --base-path passes the prefixed tree, fails it without the flag, exits 2 on bad usage", () => {
    const cli = join(here, "check-links.mjs");
    const out = project();
    expect(spawnSync(process.execPath, [cli, out, "--base-path", "/repo"]).status).toBe(0);
    expect(spawnSync(process.execPath, [cli, `--base-path=/repo`, out]).status).toBe(0);
    expect(spawnSync(process.execPath, [cli, out, "--base-path="]).status).toBe(1); // empty base: every /repo/ link is missing
    expect(spawnSync(process.execPath, [cli, out]).status).toBe(1);
    expect(spawnSync(process.execPath, [cli, out, "--base-path", "/a b"]).status).toBe(2);
    expect(spawnSync(process.execPath, [cli, out, "--bogus"]).status).toBe(2);
    const unprefixed = site({ "index.html": page('<script src="/_next/a.js"></script>'), "_next/a.js": "x" });
    const bad = spawnSync(process.execPath, [cli, unprefixed, "--base-path", "/repo"], { encoding: "utf8" });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain("index.html:/_next/a.js (outside-base-path)");
  });
});
