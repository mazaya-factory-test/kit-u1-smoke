// kit:gates@0.1.1 types for scripts/secret-patterns.mjs
export const LINE_PATTERNS: { name: string; re: RegExp }[];
export function mask(secret: string): string;
export function isEnvFile(path: string): boolean;
export function isForbiddenEnvFile(path: string): boolean;
export function scanLine(line: string, opts?: { envFile?: boolean }): { name: string; masked: string }[];
