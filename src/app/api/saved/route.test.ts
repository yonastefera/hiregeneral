import { NextRequest } from "next/server";
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
  savedJobRateLimit: { limit: mocks.limit },
}));

import { POST } from "@/app/api/saved/route";

const userId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/saved", "POST", body));
}

function createSupabase(options?: {
  user?: { id: string } | null;
  authError?: object | null;
  existing?: { id: string } | null;
  insertError?: object | null;
  deleteError?: object | null;
}) {
  const user = options?.user === undefined ? { id: userId } : options.user;
  const existing = options?.existing ?? null;

  const existingQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi
      .fn()
      .mockResolvedValue({ data: existing, error: existing ? null : {} }),
  };
  existingQuery.select.mockReturnValue(existingQuery);
  existingQuery.eq.mockReturnValue(existingQuery);

  const deleteQuery = {
    delete: vi.fn(),
    eq: vi.fn(),
  };
  deleteQuery.delete.mockReturnValue(deleteQuery);
  deleteQuery.eq
    .mockReturnValueOnce(deleteQuery)
    .mockResolvedValueOnce({ error: options?.deleteError ?? null });

  const insertQuery = {
    insert: vi.fn().mockResolvedValue({ error: options?.insertError ?? null }),
  };

  let savedJobsCall = 0;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: options?.authError ?? null,
      }),
    },
    from: vi.fn(() => {
      savedJobsCall += 1;
      if (savedJobsCall === 1) return existingQuery;
      return existing ? deleteQuery : insertQuery;
    }),
    existingQuery,
    insertQuery,
    deleteQuery,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("POST /api/saved", () => {
  it.each([
    { user: null, authError: null },
    { user: null, authError: { message: "invalid session" } },
  ])("rejects an unauthenticated request", async (auth) => {
    mocks.createClient.mockResolvedValue(createSupabase(auth));

    const response = await POST(request({ job_id: jobId }));

    expect(response.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it.each([
    { job_id: "not-a-uuid" },
    { job_id: jobId, user_id: "attacker-controlled" },
  ])("rejects invalid or unknown fields", async (body) => {
    mocks.createClient.mockResolvedValue(createSupabase());

    const response = await POST(request(body));

    expect(response.status).toBe(400);
  });

  it("rate limits repeated mutations", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await POST(request({ job_id: jobId }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("creates a saved job scoped to the authenticated user", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);

    const response = await POST(request({ job_id: jobId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ saved: true });
    expect(supabase.insertQuery.insert).toHaveBeenCalledWith({
      user_id: userId,
      job_id: jobId,
    });
  });

  it("handles a duplicate toggle by deleting only the user's saved job", async () => {
    const supabase = createSupabase({ existing: { id: "saved-id" } });
    mocks.createClient.mockResolvedValue(supabase);

    const response = await POST(request({ job_id: jobId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ saved: false });
    expect(supabase.deleteQuery.eq).toHaveBeenNthCalledWith(
      1,
      "user_id",
      userId,
    );
    expect(supabase.deleteQuery.eq).toHaveBeenNthCalledWith(2, "job_id", jobId);
  });

  it.each([
    { existing: null, insertError: { code: "42501", message: "private" } },
    { existing: { id: "saved-id" }, deleteError: { message: "private" } },
  ])(
    "returns a safe error when the database mutation fails",
    async (options) => {
      mocks.createClient.mockResolvedValue(createSupabase(options));
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(request({ job_id: jobId }));
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload).toEqual({ error: "Could not update saved jobs." });
      expect(JSON.stringify(payload)).not.toContain("private");
      consoleError.mockRestore();
    },
  );
});
