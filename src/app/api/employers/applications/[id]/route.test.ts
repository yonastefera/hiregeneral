import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  requireEmployer: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerApplicationRateLimit: { limit: mocks.limit },
}));

import { PATCH } from "./route";

const applicationId = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id: applicationId }) };

function request(body: unknown) {
  return new NextRequest(
    jsonRequest(`/api/employers/applications/${applicationId}`, "PATCH", body),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true });
  mocks.rpc.mockResolvedValue({ data: { id: applicationId }, error: null });
  mocks.requireEmployer.mockResolvedValue({
    user: { id: "11111111-1111-4111-8111-111111111111" },
    supabase: { rpc: mocks.rpc },
    error: null,
    status: 200,
  });
});

describe("PATCH /api/employers/applications/[id]", () => {
  it("requires an employer account", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: null,
      error: "Unauthorized",
      status: 401,
    });

    expect(
      (await PATCH(request({ status: "reviewing" }), context)).status,
    ).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects unsupported statuses", async () => {
    expect(
      (await PATCH(request({ status: "withdrawn" }), context)).status,
    ).toBe(400);
  });

  it("updates through the ownership-enforcing database function", async () => {
    const response = await PATCH(
      request({ status: "interview", note: "Let's schedule a call." }),
      context,
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "employer_update_application_status",
      {
        p_application_id: applicationId,
        p_status: "interview",
        p_note: "Let's schedule a call.",
      },
    );
  });

  it("does not reveal applications owned by another employer", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "private detail" },
    });
    const response = await PATCH(request({ status: "reviewing" }), context);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Application not found.",
    });
  });
});
