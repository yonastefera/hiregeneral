import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createRecoveryAuthorization,
  verifyRecoveryAuthorization,
} from "@/lib/auth/recovery-authorization";

beforeAll(() => {
  process.env.AUTH_RECOVERY_SECRET = "test-recovery-secret";
});

describe("password recovery authorization", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const now = Date.UTC(2026, 7, 1);

  it("accepts a valid recovery authorization", () => {
    const token = createRecoveryAuthorization(userId, now);
    expect(verifyRecoveryAuthorization(token, userId, now)).toBe(true);
  });

  it.each([undefined, "malformed", "user.123.bad.extra"])(
    "rejects a missing or malformed token",
    (token) =>
      expect(verifyRecoveryAuthorization(token, userId, now)).toBe(false),
  );

  it("rejects expired, reused-context, and tampered tokens", () => {
    const token = createRecoveryAuthorization(userId, now);
    expect(verifyRecoveryAuthorization(token, userId, now + 16 * 60_000)).toBe(
      false,
    );
    expect(verifyRecoveryAuthorization(token, "another-user", now)).toBe(false);
    expect(verifyRecoveryAuthorization(`${token}x`, userId, now)).toBe(false);
  });
});
