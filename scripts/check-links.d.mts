// kit:gates@0.1.0 types for scripts/check-links.mjs
export function findHtmlFiles(dir: string): string[];
export function extractRefs(html: string): {
  refs: { tag: string; attr: "href" | "src"; value: string }[];
  ids: Set<string>;
};
export function pagePath(outDir: string, file: string): string;
export function resolveToFile(outDir: string, pathname: string): string | null;
export function checkOut(outDir: string): { file: string; href: string; reason: "missing-file" | "missing-anchor" }[];
export function run(outDir: string, log?: { out: (m: string) => void; err: (m: string) => void }): number;
