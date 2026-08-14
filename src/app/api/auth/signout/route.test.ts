import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), signOut: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { POST } from "@/app/api/auth/signout/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signOut: mocks.signOut } });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe("POST /api/auth/signout", () => {
  it("invalidates the current Supabase session", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("does not expose provider errors", async () => {
    mocks.signOut.mockResolvedValue({
      error: { message: "private provider session detail" },
    });
    const response = await POST();
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Unable to sign out." });
    expect(JSON.stringify(payload)).not.toContain(
      "private provider session detail",
    );
  });
});
