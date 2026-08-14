import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), limit: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/rate-limit", () => ({
  accountDeletionRateLimit: { limit: mocks.limit },
}));

import { POST } from "@/app/api/account/deletion/route";

const userId = "11111111-1111-4111-8111-111111111111";

function createSupabase(options?: {
  user?: object | null;
  error?: object | null;
}) {
  const update = {
    update: vi.fn(),
    eq: vi.fn().mockResolvedValue({ error: options?.error ?? null }),
  };
  update.update.mockReturnValue(update);
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: options?.user === undefined ? { id: userId } : options.user,
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(update),
    update,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("POST /api/account/deletion", () => {
  it("requires authentication", async () => {
    mocks.createClient.mockResolvedValue(createSupabase({ user: null }));
    const response = await POST();
    expect(response.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("rate limits deletion requests", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST();
    expect(response.status).toBe(429);
  });

  it("marks only the authenticated profile for deletion", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);
    const response = await POST();
    expect(response.status).toBe(200);
    expect(supabase.update.update).toHaveBeenCalledWith({
      deletion_requested_at: expect.any(String),
    });
    expect(supabase.update.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("returns a safe database error", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({ error: { code: "DB100", message: "private detail" } }),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST();
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Could not request account deletion." });
    expect(JSON.stringify(payload)).not.toContain("private detail");
    consoleError.mockRestore();
  });
});
