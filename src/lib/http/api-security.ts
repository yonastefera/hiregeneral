import type { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";

import { retryAfterSeconds } from "@/lib/auth/security";
import { readJsonBodyResult } from "@/lib/http/json-body";
import { writeRedactedLog } from "@/lib/logging/redact";

export const JSON_BODY_LIMITS = {
  small: 8_192,
  medium: 32_768,
  job: 65_536,
  webhook: 262_144,
} as const;

export async function boundedJsonBody(
  request: Request,
  maxBytes: number = JSON_BODY_LIMITS.small,
) {
  const result = await readJsonBodyResult(request, maxBytes);

  if (result.ok) return result;

  return {
    ...result,
    response: NextResponse.json(
      {
        error:
          result.reason === "too_large"
            ? "Request body is too large."
            : "Request body must be valid JSON.",
      },
      { status: result.reason === "too_large" ? 413 : 400 },
    ),
  };
}

export async function boundedTextBody(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 },
      ),
    };
  }

  const data = await request.text();
  if (new TextEncoder().encode(data).byteLength > maxBytes) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 },
      ),
    };
  }

  return { ok: true as const, data };
}

export function requestIp(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function safeErrorMetadata(error: unknown) {
  if (!error || typeof error !== "object") return {};

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    status: typeof record.status === "number" ? record.status : undefined,
  };
}

export function logServerError(context: string, error: unknown) {
  writeRedactedLog("error", context, {
    scope: "api",
    ...safeErrorMetadata(error),
  });
}

export function safeServerError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function enforceRateLimit(params: {
  limiter: Ratelimit;
  key: string;
  message?: string;
  context: string;
}) {
  try {
    const result = await params.limiter.limit(params.key);
    if (result.success) return null;

    return NextResponse.json(
      { error: params.message ?? "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": retryAfterSeconds(result.reset) },
      },
    );
  } catch (error) {
    logServerError(`${params.context}_rate_limit_unavailable`, error);
    return null;
  }
}
