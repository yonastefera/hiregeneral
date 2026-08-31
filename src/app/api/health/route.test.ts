import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  abortSignal: vi.fn(),
  writeRedactedLog: vi.fn(),
}));

vi.mock("@/lib/logging/redact", () => ({
  writeRedactedLog: mocks.writeRedactedLog,
}));

vi.mock("@/lib/supabase/public", () => ({
  createSupabasePublicClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ abortSignal: mocks.abortSignal }),
      }),
    }),
  }),
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a minimal successful liveness response", async () => {
    mocks.abortSignal.mockResolvedValue({ error: null });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({ status: "healthy" });
    expect(body).not.toHaveProperty("components");
    expect(body).not.toHaveProperty("error");
  });

  it("returns 503 without leaking provider errors", async () => {
    mocks.abortSignal.mockResolvedValue({
      error: new Error("database credential details"),
    });

    const response = await GET();
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(serialized).toContain("unavailable");
    expect(serialized).not.toContain("credential details");
    expect(mocks.writeRedactedLog).toHaveBeenCalledWith(
      "error",
      "health_check",
      expect.objectContaining({ status: "unavailable" }),
    );
  });
});
