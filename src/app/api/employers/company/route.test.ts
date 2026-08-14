import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  getCompany: vi.fn(),
  limit: vi.fn(),
  requireEmployer: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerCompanyRateLimit: { limit: mocks.limit },
}));
vi.mock("@/employer/dashboard/company/employer-company-data", () => ({
  getEmployerCompanyProfile: mocks.getCompany,
}));

import { PUT } from "@/app/api/employers/company/route";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "r@test" };
const companyId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/employers/company", "PUT", body));
}

function createSupabase(options?: {
  existingId?: string | null;
  lookupError?: object | null;
  saveError?: object | null;
}) {
  const lookup = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options?.existingId ? { id: options.existingId } : null,
      error: options?.lookupError ?? null,
    }),
  };
  lookup.select.mockReturnValue(lookup);
  lookup.eq.mockReturnValue(lookup);
  lookup.order.mockReturnValue(lookup);
  lookup.limit.mockReturnValue(lookup);

  const save = {
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: options?.saveError ? null : { id: companyId },
      error: options?.saveError ?? null,
    }),
  };
  save.insert.mockReturnValue(save);
  save.update.mockReturnValue(save);
  save.eq.mockReturnValue(save);
  save.select.mockReturnValue(save);

  const logoSync = {
    update: vi.fn(),
    eq: vi.fn(),
  };
  logoSync.update.mockReturnValue(logoSync);
  logoSync.eq
    .mockReturnValueOnce(logoSync)
    .mockResolvedValueOnce({ error: null });

  let companyCalls = 0;
  return {
    from: vi.fn((table: string) => {
      if (table === "jobs") return logoSync;
      companyCalls += 1;
      return companyCalls === 1 ? lookup : save;
    }),
    lookup,
    save,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.getCompany.mockResolvedValue({ id: companyId, name: "Acme" });
  mocks.requireEmployer.mockResolvedValue({
    user,
    supabase: createSupabase(),
    error: null,
    status: 200,
  });
});

describe("PUT /api/employers/company", () => {
  it.each([
    [401, "Unauthorized"],
    [403, "Only employer accounts can manage employer tools."],
  ])("enforces the employer role with status %i", async (status, error) => {
    mocks.requireEmployer.mockResolvedValue({ user: null, error, status });

    const response = await PUT(request({ name: "Acme" }));

    expect(response.status).toBe(status);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it.each([{ name: "A" }, { name: "Acme", owner_id: "attacker-controlled" }])(
    "rejects invalid and unknown fields",
    async (body) => {
      const response = await PUT(request(body));
      expect(response.status).toBe(400);
    },
  );

  it("rate limits updates", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await PUT(request({ name: "Acme" }));
    expect(response.status).toBe(429);
  });

  it("creates a company owned by the authenticated recruiter", async () => {
    const supabase = createSupabase();
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });

    const response = await PUT(
      request({ name: "Acme", website: "acme.example", location: "New York" }),
    );

    expect(response.status).toBe(200);
    expect(supabase.save.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: user.id,
        name: "Acme",
        website: "https://acme.example",
      }),
    );
  });

  it("returns 404 when an explicitly owned company cannot be updated", async () => {
    const supabase = createSupabase({
      saveError: { code: "PGRST116", message: "no rows" },
    });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });

    const response = await PUT(request({ id: companyId, name: "Acme" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Company was not found.",
    });
    expect(supabase.save.eq).toHaveBeenCalledWith("owner_id", user.id);
  });

  it("does not expose database details", async () => {
    const supabase = createSupabase({
      lookupError: { code: "DB100", message: "private detail" },
    });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await PUT(request({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Could not save the company profile." });
    expect(JSON.stringify(payload)).not.toContain("private detail");
    consoleError.mockRestore();
  });
});
