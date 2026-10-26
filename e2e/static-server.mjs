// kit:gates@0.1.0 written for the kit; resolution rules mirror scripts/check-links.mjs
// Tiny static server for the exported site. Usage: E2E_PORT=4173 node e2e/static-server.mjs [outDir]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? process.env.OUT_DIR ?? "out");
const port = Number(process.env.E2E_PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml",
};

async function fileFor(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  for (const c of [join(root, clean, "index.html"), join(root, clean), join(root, `${clean.replace(/\/+$/, "")}.html`)]) {
    if (c !== root && !c.startsWith(root + sep)) continue;
    try {
      if ((await stat(c)).isFile()) return c;
    } catch {
      /* next candidate */
    }
  }
  return null;
}

createServer(async (req, res) => {
  try {
    const file = await fileFor(new URL(req.url ?? "/", "http://x").pathname);
    if (!file) {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(500).end("error");
  }
}).listen(port, "127.0.0.1", () => console.log(`static-server: ${root} on http://127.0.0.1:${port}`));
