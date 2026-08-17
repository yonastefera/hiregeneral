const SENSITIVE_KEY =
  /authorization|cookie|email|phone|token|secret|password|signature|resume|access[_-]?key|api[_-]?key/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
const SUPABASE_STORAGE_PATH = /\b[0-9a-f-]{36}\/[\w./%+-]+/gi;

function redactString(value: string) {
  return value
    .replace(BEARER, "[REDACTED_TOKEN]")
    .replace(JWT, "[REDACTED_TOKEN]")
    .replace(EMAIL, "[REDACTED_EMAIL]")
    .replace(PHONE, "[REDACTED_PHONE]")
    .replace(SUPABASE_STORAGE_PATH, "[REDACTED_STORAGE_PATH]");
}

export function redactLogValue(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[REDACTED_DEPTH]";
  if (typeof value === "string") return redactString(value);
  if (
    value === null ||
    value === undefined ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Error) {
    const record = value as Error & { code?: unknown; status?: unknown };
    return {
      name: record.name,
      code: typeof record.code === "string" ? record.code : undefined,
      status: typeof record.status === "number" ? record.status : undefined,
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => redactLogValue(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 50)
        .map(([key, item]) => [
          key,
          SENSITIVE_KEY.test(key)
            ? "[REDACTED]"
            : redactLogValue(item, depth + 1),
        ]),
    );
  }
  return redactString(String(value));
}

export function writeRedactedLog(
  level: "error" | "info" | "warn",
  event: string,
  context: Record<string, unknown> = {},
) {
  const entry = JSON.stringify({
    event,
    level,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    release:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.NEXT_PUBLIC_RELEASE_VERSION ??
      "local",
    ...(redactLogValue(context) as Record<string, unknown>),
    timestamp: new Date().toISOString(),
  });

  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}
