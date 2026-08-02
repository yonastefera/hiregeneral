import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const RECOVERY_COOKIE = "hg-password-recovery";
const RECOVERY_TTL_SECONDS = 15 * 60;

function secret() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createRecoveryAuthorization(userId: string, now = Date.now()) {
  const payload = `${userId}.${Math.floor(now / 1000) + RECOVERY_TTL_SECONDS}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyRecoveryAuthorization(
  token: string | undefined,
  userId: string,
  now = Date.now(),
) {
  if (!token) return false;
  const [tokenUserId, expiresAt, providedSignature, extra] = token.split(".");
  if (extra || tokenUserId !== userId || !expiresAt || !providedSignature)
    return false;

  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry < Math.floor(now / 1000))
    return false;

  const expected = signature(`${tokenUserId}.${expiresAt}`);
  const provided = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expected);
  return (
    provided.length === expectedBuffer.length &&
    timingSafeEqual(provided, expectedBuffer)
  );
}
