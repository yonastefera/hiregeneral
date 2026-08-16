import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  createAdmin: vi.fn(),
  createClient: vi.fn(),
  enforceRateLimit: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));
vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));
vi.mock("@/lib/rate-limit", () => ({
  accountExportRateLimit: {},
}));
vi.mock("@/lib/http/api-security", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  logServerError: mocks.logServerError,
  safeServerError: (message: string) =>
    Response.json({ error: message }, { status: 500 }),
}));

import { GET } from "@/app/api/account/export/route";

const userId = "11111111-1111-4111-8111-111111111111";

type QueryResult = { data: unknown; error: unknown };

function query(result: QueryResult) {
  const builder: Record<string, unknown> & PromiseLike<QueryResult> = {
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  for (const method of ["select", "eq", "or", "in", "order", "maybeSingle"]) {
    builder[method] = vi.fn(() => builder);
  }

  return builder;
}

function createSupabase(options?: {
  user?: object | null;
  profileError?: unknown;
}) {
  const results: Record<string, QueryResult> = {
    profiles: {
      data: options?.profileError ? null : { id: "profile-1", user_id: userId },
      error: options?.profileError ?? null,
    },
    user_roles: { data: [{ role: "job_seeker" }], error: null },
    applications: { data: [{ id: "application-1" }], error: null },
    saved_jobs: { data: [], error: null },
    notifications: { data: [], error: null },
    conversations: { data: [{ id: "conversation-1" }], error: null },
    companies: { data: [], error: null },
    jobs: { data: [], error: null },
    employer_candidate_invites: { data: [], error: null },
    messages: { data: [{ id: "message-1" }], error: null },
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user:
            options?.user === undefined
              ? {
                  id: userId,
                  email: "person@example.com",
                  created_at: "2026-01-01T00:00:00.000Z",
                  last_sign_in_at: "2026-08-01T00:00:00.000Z",
                }
              : options.user,
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => query(results[table])),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enforceRateLimit.mockResolvedValue(null);
  mocks.audit.mockResolvedValue(undefined);
  mocks.createAdmin.mockReturnValue({
    from: vi.fn(() => query({ data: [{ id: "contact-1" }], error: null })),
  });
});

describe("GET /api/account/export", () => {
  it("requires authentication", async () => {
    const supabase = createSupabase({ user: null });
    mocks.createClient.mockResolvedValue(supabase);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
  });

  it("rate limits export generation", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());
    mocks.enforceRateLimit.mockResolvedValue(
      Response.json({ error: "Too many requests." }, { status: 429 }),
    );

    const response = await GET();

    expect(response.status).toBe(429);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("returns a safe error when owned data cannot be loaded", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({ profileError: { message: "private database detail" } }),
    );

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Could not prepare your data export." });
    expect(JSON.stringify(payload)).not.toContain("private database detail");
    expect(mocks.logServerError).toHaveBeenCalled();
  });

  it("returns a private JSON attachment and records an audit event", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="hiregeneral-data-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(payload.account).toEqual(
      expect.objectContaining({ id: userId, email: "person@example.com" }),
    );
    expect(payload.profile).toEqual(
      expect.objectContaining({ user_id: userId }),
    );
    expect(payload.applications).toEqual([{ id: "application-1" }]);
    expect(payload.messages).toEqual([{ id: "message-1" }]);
    expect(payload.contact_messages).toEqual([{ id: "contact-1" }]);
    expect(mocks.audit).toHaveBeenCalledWith({
      action: "account.data_exported",
      targetType: "user",
      targetId: userId,
      metadata: { export_version: 1 },
    });
  });
});
