import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/rate-limit", () => ({
  notificationSettingsRateLimit: { limit: mocks.limit },
}));

import { PATCH } from "@/app/api/notification-settings/route";

const userId = "11111111-1111-4111-8111-111111111111";
const preferences = {
  jobAlerts: true,
  applicationUpdates: false,
  savedJobReminders: true,
  marketingEmails: false,
};

function createSupabase(options?: {
  user?: { id: string } | null;
  updateError?: object | null;
}) {
  const user = options?.user === undefined ? { id: userId } : options.user;
  const profileQuery = {
    update: vi.fn(),
    eq: vi.fn().mockResolvedValue({ error: options?.updateError ?? null }),
  };
  profileQuery.update.mockReturnValue(profileQuery);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "invalid session" },
      }),
    },
    from: vi.fn().mockReturnValue(profileQuery),
    profileQuery,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("PATCH /api/notification-settings", () => {
  it("rejects unauthenticated requests", async () => {
    mocks.createClient.mockResolvedValue(createSupabase({ user: null }));

    const response = await PATCH(
      jsonRequest("/api/notification-settings", "PATCH", { preferences }),
    );

    expect(response.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it.each([
    { preferences: { ...preferences, jobAlerts: "yes" } },
    { preferences: { ...preferences, adminEmails: true } },
    { preferences, user_id: "attacker-controlled" },
  ])("rejects invalid and unknown fields", async (body) => {
    mocks.createClient.mockResolvedValue(createSupabase());

    const response = await PATCH(
      jsonRequest("/api/notification-settings", "PATCH", body),
    );

    expect(response.status).toBe(400);
  });

  it("rate limits repeated updates", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await PATCH(
      jsonRequest("/api/notification-settings", "PATCH", { preferences }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("updates only the authenticated user's profile", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);

    const response = await PATCH(
      jsonRequest("/api/notification-settings", "PATCH", { preferences }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: preferences });
    expect(supabase.profileQuery.update).toHaveBeenCalledWith({
      notification_preferences: preferences,
    });
    expect(supabase.profileQuery.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("returns a safe error when the database update fails", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({ updateError: { message: "private database detail" } }),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await PATCH(
      jsonRequest("/api/notification-settings", "PATCH", { preferences }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Could not save notification settings." });
    expect(JSON.stringify(payload)).not.toContain("private database detail");
    consoleError.mockRestore();
  });
});
