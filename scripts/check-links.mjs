// kit:gates@0.1.1 harvested from mazaya-studios:scripts/check-links.ts (rewritten as zero-dependency Node ESM)
// Static-export link gate: every internal href/src in out/**/*.html must resolve to a file in out/,
// and every #fragment must be an id on the target page.
// Usage: node scripts/check-links.mjs [outDir] [--base-path /repo]
// With --base-path (a GitHub Pages project site, next.config `basePath`), Next writes files at the out/ root
// but every root-absolute href must carry the prefix; one that does not is reported as outside-base-path.
// Exit 0 ok, 1 broken links, 2 outDir missing or bad usage.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

/** @param {string} dir @returns {string[]} absolute paths of every .html file under dir */
export function findHtmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findHtmlFiles(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const decodeEntities = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const safeDecode = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const REF_TAGS = new Set(["a", "link", "script", "img", "source", "iframe", "video", "audio", "embed", "area"]);
const SKIP_LINK_RELS = new Set(["preconnect", "dns-prefetch"]);

/**
 * Pull internal-link candidates and ids out of one HTML document.
 * Script and style bodies and comments are blanked first so inline JSON/RSC payloads are not parsed as markup.
 * @param {string} html
 * @returns {{ refs: { tag: string, attr: "href"|"src", value: string }[], ids: Set<string> }}
 */
export function extractRefs(html) {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, "$1</script>")
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style>/gi, "$1</style>");
  const refs = [];
  const ids = new Set();
  for (const [, rawTag, attrText] of clean.matchAll(TAG_RE)) {
    const tag = rawTag.toLowerCase();
    const attrs = {};
    for (const [, k, dq, sq, bare] of attrText.matchAll(ATTR_RE)) {
      attrs[k.toLowerCase()] = decodeEntities(dq ?? sq ?? bare ?? "");
    }
    if (attrs.id) ids.add(attrs.id);
    if (tag === "a" && attrs.name) ids.add(attrs.name);
    if (!REF_TAGS.has(tag)) continue;
    if (tag === "link" && SKIP_LINK_RELS.has((attrs.rel ?? "").toLowerCase())) continue;
    for (const attr of /** @type {const} */ (["href", "src"])) {
      if (attrs[attr] !== undefined) refs.push({ tag, attr, value: attrs[attr].trim() });
    }
  }
  return { refs, ids };
}

/** URL path of an exported file: out/about/index.html is /about/, out/about.html is /about. */
export function pagePath(outDir, file) {
  const rel = relative(outDir, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

/** Map a URL pathname to a file inside outDir, or null. Tries dir/index.html, exact file, then .html. */
export function resolveToFile(outDir, pathname) {
  const clean = safeDecode(pathname).replace(/^\/+/, "");
  const root = resolve(outDir);
  const candidates = [
    join(root, clean, "index.html"),
    join(root, clean),
    join(root, `${clean.replace(/\/+$/, "")}.html`),
  ];
  for (const c of candidates) {
    if (c !== root && !c.startsWith(root + sep)) continue; // never leave outDir
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const EXTERNAL_RE = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/;

/** "/repo/" and "repo" become "/repo"; "" and "/" become "". Throws on a query, fragment, space, scheme or dot segment. */
export function normalizeBasePath(raw) {
  const trimmed = String(raw ?? "").trim();
  if (/[?#\s\\]/.test(trimmed) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    throw new Error(`base path must be a plain path, got "${trimmed}"`);
  }
  const segments = trimmed.split("/").filter(Boolean);
  if (segments.some((seg) => seg === "." || seg === "..")) throw new Error(`base path must not contain . or .. segments, got "${trimmed}"`);
  return segments.length > 0 ? `/${segments.join("/")}` : "";
}

/**
 * @param {string} outDir
 * @param {{ basePath?: string }} [options] basePath: the prefix the site is served under ("/repo"), default none
 * @returns {{ file: string, href: string, reason: "missing-file"|"missing-anchor"|"outside-base-path" }[]}
 */
export function checkOut(outDir, options = {}) {
  const base = normalizeBasePath(options.basePath);
  const problems = [];
  const idCache = new Map();
  const idsOf = (file) => {
    let ids = idCache.get(file);
    if (!ids) {
      ids = extractRefs(readFileSync(file, "utf8")).ids;
      idCache.set(file, ids);
    }
    return ids;
  };
  const anchorExists = (file, fragment) => {
    if (fragment === "" || fragment.toLowerCase() === "top") return true; // HTML spec: "#" and "#top" always resolve
    const ids = idsOf(file);
    return ids.has(fragment) || ids.has(safeDecode(fragment));
  };

  for (const file of findHtmlFiles(outDir)) {
    const rel = relative(outDir, file).split(sep).join("/");
    const seen = new Set();
    const report = (href, reason) => {
      const key = `${href}|${reason}`;
      if (seen.has(key)) return;
      seen.add(key);
      problems.push({ file: rel, href, reason });
    };
    const inOut = pagePath(outDir, file); // where the page sits inside out/
    for (const { value } of extractRefs(readFileSync(file, "utf8")).refs) {
      if (value === "" || EXTERNAL_RE.test(value)) continue;
      let url;
      try {
        // Resolve against the URL the page is SERVED at (base path included), so relative links behave as in a browser.
        url = new URL(value, `http://site.invalid${base}${inOut}`);
      } catch {
        report(value, "missing-file");
        continue;
      }
      let pathname = url.pathname;
      if (base) {
        if (pathname !== base && !pathname.startsWith(`${base}/`)) {
          report(value, "outside-base-path"); // would hit the domain root, not the site, once deployed
          continue;
        }
        pathname = pathname.slice(base.length) || "/";
      }
      const fragment = url.hash.replace(/^#/, "");
      const targetFile = pathname === inOut && value.startsWith("#")
        ? file
        : resolveToFile(outDir, pathname);
      if (targetFile === null) {
        report(value, "missing-file");
        continue;
      }
      if (targetFile.endsWith(".html") && !anchorExists(targetFile, fragment)) report(value, "missing-anchor");
    }
  }
  return problems;
}

/**
 * Parse CLI arguments: `[outDir] [--base-path /repo | --base-path=/repo]`.
 * @param {string[]} argv
 * @returns {{ outDir?: string, basePath?: string }}
 */
export function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base-path") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--base-path needs a value");
      parsed.basePath = v;
    } else if (a.startsWith("--base-path=")) {
      parsed.basePath = a.slice("--base-path=".length);
    } else if (a.startsWith("--")) {
      throw new Error(`unknown option ${a}`);
    } else if (parsed.outDir === undefined) {
      parsed.outDir = a;
    } else {
      throw new Error(`unexpected argument ${a}`);
    }
  }
  return parsed;
}

/** CLI body, separated so tests can call it. Returns the exit code. */
export function run(outDir, log = { out: console.log, err: console.error }, options = {}) {
  if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
    log.err(`check-links: ${outDir}/ does not exist. Run the build first.`);
    return 2;
  }
  let problems;
  try {
    problems = checkOut(outDir, options);
  } catch (e) {
    log.err(`check-links: ${e instanceof Error ? e.message : String(e)}`);
    return 2;
  }
  const where = options.basePath ? `${outDir} (base path ${normalizeBasePath(options.basePath) || "/"})` : outDir;
  if (problems.length > 0) {
    log.err(`check-links: FAILED with ${problems.length} problem(s) in ${where}`);
    for (const p of problems) log.err(`  ${p.file}:${p.href} (${p.reason})`);
    return 1;
  }
  log.out(`check-links: OK, every internal href/src/anchor resolves in ${where}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`check-links: ${e instanceof Error ? e.message : String(e)}`);
    console.error("usage: node scripts/check-links.mjs [outDir] [--base-path /repo]");
    process.exit(2);
  }
  process.exit(run(args.outDir ?? process.env.OUT_DIR ?? "out", undefined, { basePath: args.basePath }));
}
