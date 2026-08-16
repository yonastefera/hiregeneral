import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  createClient: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));
vi.mock("@/lib/rate-limit", () => ({
  accountPrivacyRateLimit: { limit: mocks.limit },
}));

import { PATCH } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/account/employer-access", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function client(options?: { user?: object | null; updated?: object | null }) {
  const query = {
    update: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data:
        options?.updated === undefined
          ? {
              visibility: "public",
              employer_access_consent_at: "2026-08-16T00:00:00.000Z",
            }
          : options.updated,
      error: null,
    }),
  };
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.select.mockReturnValue(query);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: options?.user === undefined ? { id: "user-1" } : options.user,
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(query),
    query,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.createClient.mockResolvedValue(client());
});

describe("PATCH /api/account/employer-access", () => {
  it("requires authentication", async () => {
    mocks.createClient.mockResolvedValue(client({ user: null }));
    expect((await PATCH(request({ enabled: true }))).status).toBe(401);
  });

  it("rejects invalid and unknown fields", async () => {
    expect((await PATCH(request({ enabled: "yes" }))).status).toBe(400);
    expect(
      (await PATCH(request({ enabled: true, userId: "other" }))).status,
    ).toBe(400);
  });

  it("scopes consent to the authenticated job-seeker profile", async () => {
    const supabase = client();
    mocks.createClient.mockResolvedValue(supabase);
    const response = await PATCH(request({ enabled: true }));

    expect(response.status).toBe(200);
    expect(supabase.query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(supabase.query.eq).toHaveBeenCalledWith("user_type", "job_seeker");
    expect(supabase.query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: "public",
        employer_access_consent_at: expect.any(String),
      }),
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "profile.employer_access_granted" }),
    );
  });

  it("revokes visibility and consent together", async () => {
    const supabase = client({
      updated: { visibility: "private", employer_access_consent_at: null },
    });
    mocks.createClient.mockResolvedValue(supabase);
    const response = await PATCH(request({ enabled: false }));

    expect(response.status).toBe(200);
    expect(supabase.query.update).toHaveBeenCalledWith({
      visibility: "private",
      employer_access_consent_at: null,
    });
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "profile.employer_access_revoked" }),
    );
  });
});
