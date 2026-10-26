// kit:gates@0.1.0 harvested from mazaya-studios:scripts/check-links.ts (rewritten as zero-dependency Node ESM)
// Static-export link gate: every internal href/src in out/**/*.html must resolve to a file in out/,
// and every #fragment must be an id on the target page. Usage: node scripts/check-links.mjs [outDir]
// Exit 0 ok, 1 broken links, 2 outDir missing.
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

/**
 * @param {string} outDir
 * @returns {{ file: string, href: string, reason: "missing-file"|"missing-anchor" }[]}
 */
export function checkOut(outDir) {
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
    for (const { value } of extractRefs(readFileSync(file, "utf8")).refs) {
      if (value === "" || EXTERNAL_RE.test(value)) continue;
      let url;
      try {
        url = new URL(value, `http://site.invalid${pagePath(outDir, file)}`);
      } catch {
        report(value, "missing-file");
        continue;
      }
      const fragment = url.hash.replace(/^#/, "");
      const targetFile = url.pathname === pagePath(outDir, file) && value.startsWith("#")
        ? file
        : resolveToFile(outDir, url.pathname);
      if (targetFile === null) {
        report(value, "missing-file");
        continue;
      }
      if (targetFile.endsWith(".html") && !anchorExists(targetFile, fragment)) report(value, "missing-anchor");
    }
  }
  return problems;
}

/** CLI body, separated so tests can call it. Returns the exit code. */
export function run(outDir, log = { out: console.log, err: console.error }) {
  if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
    log.err(`check-links: ${outDir}/ does not exist. Run the build first.`);
    return 2;
  }
  const problems = checkOut(outDir);
  if (problems.length > 0) {
    log.err(`check-links: FAILED with ${problems.length} problem(s) in ${outDir}`);
    for (const p of problems) log.err(`  ${p.file}:${p.href} (${p.reason})`);
    return 1;
  }
  log.out(`check-links: OK, every internal href/src/anchor resolves in ${outDir}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(run(process.argv[2] ?? process.env.OUT_DIR ?? "out"));
}
