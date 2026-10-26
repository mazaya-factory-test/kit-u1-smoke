// kit:gates@0.1.1 types for scripts/setup-hooks.mjs
export const HOOKS_DIR: string;
export const SENTINEL_HOOK: string;
export function hookSetupPlan(input: {
  gitDir: string | null;
  gitCommonDir: string | null;
  hookFileExists: boolean;
}): { configure: boolean; reason: string };
export function main(): void;
