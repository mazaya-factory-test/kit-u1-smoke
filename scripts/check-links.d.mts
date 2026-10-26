// kit:gates@0.1.1 types for scripts/check-links.mjs
export function findHtmlFiles(dir: string): string[];
export function extractRefs(html: string): {
  refs: { tag: string; attr: "href" | "src"; value: string }[];
  ids: Set<string>;
};
export function pagePath(outDir: string, file: string): string;
export function resolveToFile(outDir: string, pathname: string): string | null;
export function normalizeBasePath(raw: string | undefined): string;
export function checkOut(
  outDir: string,
  options?: { basePath?: string },
): { file: string; href: string; reason: "missing-file" | "missing-anchor" | "outside-base-path" }[];
export function parseArgs(argv: string[]): { outDir?: string; basePath?: string };
export function run(
  outDir: string,
  log?: { out: (m: string) => void; err: (m: string) => void },
  options?: { basePath?: string },
): number;
