// kit:gates@0.1.0 types for scripts/secret-scan.mjs
export function addedLines(diff: string): { file: string; line: number; text: string }[];
export function findProblems(input: { stagedFiles: string[]; diff: string }): string[];
export function main(): number;
