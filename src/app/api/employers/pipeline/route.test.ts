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
  employerPipelineRateLimit: { limit: mocks.limit },
}));

import { PUT } from "./route";

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/employers/pipeline", "PUT", body));
}

const stages = [
  { id: null, name: "Review", position: 0, applicationStatus: "reviewing" },
  { id: null, name: "Interview", position: 1, applicationStatus: "interview" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true });
  mocks.rpc.mockResolvedValue({
    data: stages.map((stage, index) => ({
      id: `00000000-0000-4000-8000-00000000000${index}`,
      name: stage.name,
      position: stage.position,
      application_status: stage.applicationStatus,
    })),
    error: null,
  });
  mocks.requireEmployer.mockResolvedValue({
    user: { id: "11111111-1111-4111-8111-111111111111" },
    supabase: { rpc: mocks.rpc },
    status: 200,
  });
});

describe("PUT /api/employers/pipeline", () => {
  it("requires an employer", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: null,
      error: "Unauthorized",
      status: 401,
    });
    expect((await PUT(request({ stages }))).status).toBe(401);
  });

  it("rejects duplicate stages", async () => {
    expect(
      (
        await PUT(
          request({
            stages: stages.map((stage) => ({ ...stage, name: "Same" })),
          }),
        )
      ).status,
    ).toBe(400);
  });

  it("replaces the authenticated employer pipeline atomically", async () => {
    const response = await PUT(request({ stages }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("employer_replace_pipeline_stages", {
      p_stages: stages,
    });
  });
});
