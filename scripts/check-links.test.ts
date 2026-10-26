import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { checkOut, extractRefs, run } from "./check-links.mjs";

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
