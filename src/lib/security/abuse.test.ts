import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ set: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ redis: { set: mocks.set } }));

import { enforceDuplicateCooldown } from "@/lib/security/abuse";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("duplicate abuse cooldown", () => {
  it("stores only a hash and allows the first request", async () => {
    mocks.set.mockResolvedValue("OK");

    const response = await enforceDuplicateCooldown({
      scope: "contact",
      actorKey: "person@example.com",
      content: "private message content",
      ttlSeconds: 60,
    });

    expect(response).toBeNull();
    expect(JSON.stringify(mocks.set.mock.calls)).not.toContain(
      "person@example.com",
    );
    expect(JSON.stringify(mocks.set.mock.calls)).not.toContain(
      "private message content",
    );
  });

  it("rejects an identical request during its cooldown", async () => {
    mocks.set.mockResolvedValue(null);

    const response = await enforceDuplicateCooldown({
      scope: "employer_message",
      actorKey: "user-id",
      content: "duplicate message",
      ttlSeconds: 15,
    });

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("15");
  });

  it("fails open when the abuse store is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.set.mockRejectedValue(new Error("redis unavailable"));

    const response = await enforceDuplicateCooldown({
      scope: "signup",
      actorKey: "ip",
      content: "email",
      ttlSeconds: 60,
    });

    expect(response).toBeNull();
  });
});
