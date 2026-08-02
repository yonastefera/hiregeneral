import "server-only";

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { logServerError } from "@/lib/http/api-security";
import { redis } from "@/lib/rate-limit";

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function enforceDuplicateCooldown(params: {
  scope: string;
  actorKey: string;
  content: string;
  ttlSeconds: number;
  message?: string;
}) {
  const fingerprint = digest(
    `${params.actorKey}\n${params.content.trim().toLowerCase()}`,
  );

  try {
    const stored = await redis.set(
      `abuse:${params.scope}:${fingerprint}`,
      "1",
      { nx: true, ex: params.ttlSeconds },
    );
    if (stored) return null;

    return NextResponse.json(
      {
        error:
          params.message ??
          "That request was already received. Please wait before trying again.",
      },
      { status: 429, headers: { "Retry-After": String(params.ttlSeconds) } },
    );
  } catch (error) {
    logServerError(`${params.scope}_duplicate_check_unavailable`, error);
    return null;
  }
}
