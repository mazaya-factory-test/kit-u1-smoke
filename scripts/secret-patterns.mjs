// kit:gates@0.1.0 harvested from Projects/secret-scan.sh (pattern list), mazaya-studios:.githooks/pre-commit
// High-confidence credential shapes only. Shared by the pre-commit hook and the tests.

/** @type {{ name: string, re: RegExp }[]} */
export const LINE_PATTERNS = [
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Stripe live key", re: /\b(?:sk|rk)_live_[0-9A-Za-z]{10,}/ },
  { name: "Resend API key", re: /\bre_(?:[A-Za-z0-9]{6,}_[A-Za-z0-9]{16,}|[A-Za-z0-9]{32,})\b/ },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: "GitHub fine-grained token", re: /\bgithub_pat_[A-Za-z0-9_]{22,}/ },
  { name: "Private key header", re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/ },
];

const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{4,}/g;

/** A JWT whose payload says role: service_role (a Supabase privileged key). */
function findServiceRoleJwt(line) {
  for (const m of line.matchAll(JWT_RE)) {
    try {
      const payload = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
      if (payload && payload.role === "service_role") return m[0];
    } catch {
      /* not a decodable JWT */
    }
  }
  return null;
}

const ENV_ASSIGN_RE = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*(?:SECRET|PASSWORD|PASSWD|TOKEN|API_KEY|PRIVATE_KEY))\s*=\s*(.*)$/;
const PLACEHOLDER_RE = /^\$|[<>]|\{\{|your[-_ ]|change[-_ ]?me|placeholder|example|sample|dummy|redacted|todo|fixme|xxx/i;

/** Generic NAME_SECRET=value in an .env-style file; placeholders and empty values pass. */
function findEnvAssignment(line) {
  const m = ENV_ASSIGN_RE.exec(line);
  if (!m) return null;
  const value = (m[2] ?? "").split(" #")[0].trim().replace(/^["']|["']$/g, "").trim();
  if (value.length < 4 || PLACEHOLDER_RE.test(value) || /^(true|false|yes|no|none|null)$/i.test(value)) return null;
  return value;
}

/** Keep the first four characters, hide the rest. */
export function mask(secret) {
  return secret.slice(0, 4) + "*".repeat(Math.min(Math.max(secret.length - 4, 0), 12));
}

export const isEnvFile = (path) => /(^|\/)\.env(\..+)?$/.test(path) || /\.env$/.test(path);
/** .env files must never be committed, except the example template. */
export const isForbiddenEnvFile = (path) => isEnvFile(path) && !/(^|\/)\.env\.example$/.test(path);

/**
 * Scan one added line. Returns [{ name, masked }].
 * @param {string} line @param {{ envFile?: boolean }} [opts]
 */
export function scanLine(line, opts = {}) {
  const hits = [];
  for (const { name, re } of LINE_PATTERNS) {
    const m = re.exec(line);
    if (m) hits.push({ name, masked: mask(m[0]) });
  }
  const jwt = findServiceRoleJwt(line);
  if (jwt) hits.push({ name: "Supabase service_role key", masked: mask(jwt) });
  if (opts.envFile) {
    const v = findEnvAssignment(line);
    if (v) hits.push({ name: "Secret assignment in .env file", masked: mask(v) });
  }
  return hits;
}
