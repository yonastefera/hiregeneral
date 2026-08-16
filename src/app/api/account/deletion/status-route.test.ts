import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), limit: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/rate-limit", () => ({
  accountDeletionRateLimit: { limit: mocks.limit },
}));

import { DELETE, GET } from "@/app/api/account/deletion/route";

const userId = "11111111-1111-4111-8111-111111111111";

function createSupabase(options?: {
  user?: object | null;
  data?: { deletion_requested_at: string | null } | null;
  error?: unknown;
}) {
  const result = {
    data: options?.data ?? null,
    error: options?.error ?? null,
  };
  const builder: Record<string, unknown> & PromiseLike<typeof result> = {
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  for (const method of ["select", "update", "eq", "maybeSingle"]) {
    builder[method] = vi.fn(() => builder);
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: options?.user === undefined ? { id: userId } : options.user,
        },
        error: null,
      }),
    },
    from: vi.fn(() => builder),
    builder,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("account deletion grace-period API", () => {
  it("requires authentication for deletion status", async () => {
    mocks.createClient.mockResolvedValue(createSupabase({ user: null }));

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns a scheduled date fourteen days after the request", async () => {
    const requestedAt = "2026-08-15T12:00:00.000Z";
    mocks.createClient.mockResolvedValue(
      createSupabase({ data: { deletion_requested_at: requestedAt } }),
    );

    const response = await GET();
    const payload = await response.json();

    expect(payload).toEqual({
      requested: true,
      requested_at: requestedAt,
      scheduled_for: "2026-08-29T12:00:00.000Z",
      grace_days: 14,
    });
  });

  it("rate limits cancellation", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await DELETE();

    expect(response.status).toBe(429);
  });

  it("cancels only the authenticated user's deletion request", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);

    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(supabase.builder.update).toHaveBeenCalledWith({
      deletion_requested_at: null,
    });
    expect(supabase.builder.eq).toHaveBeenCalledWith("user_id", userId);
  });
});
