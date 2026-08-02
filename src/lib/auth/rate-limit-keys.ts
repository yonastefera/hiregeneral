import "server-only";

import { createHash } from "node:crypto";

export function authRateLimitKeys(request: Request, email: string) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const hash = (value: string) =>
    createHash("sha256").update(value).digest("hex").slice(0, 24);

  return {
    ip: `ip:${hash(ip)}`,
    email: `email:${hash(email.trim().toLowerCase())}`,
  };
}
