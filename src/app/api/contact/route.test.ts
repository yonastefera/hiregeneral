import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  createAdmin: vi.fn(),
  duplicate: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));
vi.mock("@/lib/rate-limit", () => ({
  contactSubmissionRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/abuse", () => ({
  enforceDuplicateCooldown: mocks.duplicate,
}));

import { POST } from "@/app/api/contact/route";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Avery Morgan",
    email: "avery@example.com",
    message: "I need help with my HireGeneral account.",
    ...overrides,
  };
}

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/contact", "POST", body));
}

function createAdmin(error: object | null = null) {
  const query = {
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: error ? null : { id: "contact-id" },
      error,
    }),
  };
  query.insert.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return { from: vi.fn().mockReturnValue(query), query };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.duplicate.mockResolvedValue(null);
  mocks.createAdmin.mockReturnValue(createAdmin());
});

describe("POST /api/contact", () => {
  it.each([validBody({ email: "invalid" }), validBody({ admin: true })])(
    "rejects invalid and unknown fields",
    async (body) => {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
    },
  );

  it("rate limits abusive clients", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST(request(validBody()));
    expect(response.status).toBe(429);
  });

  it("silently accepts honeypot spam without writing", async () => {
    const admin = createAdmin();
    mocks.createAdmin.mockReturnValue(admin);
    const response = await POST(
      request(validBody({ website: "spam.example" })),
    );
    expect(response.status).toBe(200);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("enforces duplicate cooldowns", async () => {
    mocks.duplicate.mockResolvedValue(
      NextResponse.json({ error: "Duplicate request." }, { status: 429 }),
    );
    const response = await POST(request(validBody()));
    expect(response.status).toBe(429);
  });

  it("stores a validated contact request", async () => {
    const admin = createAdmin();
    mocks.createAdmin.mockReturnValue(admin);
    const response = await POST(request(validBody()));
    expect(response.status).toBe(201);
    expect(admin.query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Avery Morgan",
        email: "avery@example.com",
        message: "I need help with my HireGeneral account.",
      }),
    );
  });

  it("does not expose database errors", async () => {
    mocks.createAdmin.mockReturnValue(
      createAdmin({ code: "DB100", message: "private detail" }),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST(request(validBody()));
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(payload)).not.toContain("private detail");
    consoleError.mockRestore();
  });
});
