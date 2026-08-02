import "server-only";

import { createHash } from "node:crypto";

export function authRateLimitKeys(request: Request, email: string) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const emailHash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 24);

  return { ip: `ip:${ip}`, email: `email:${emailHash}` };
}
