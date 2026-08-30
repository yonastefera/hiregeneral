import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/rate-limit", () => ({
  savedSearchRateLimit: { limit: mocks.limit },
}));

import { DELETE, PATCH } from "@/app/api/saved-searches/[id]/route";
import { POST } from "@/app/api/saved-searches/route";

const userId = "11111111-1111-4111-8111-111111111111";
const searchId = "22222222-2222-4222-8222-222222222222";
const validSearch = {
  name: "Platform roles",
  query: "platform engineer",
  location: "New York",
  postedDays: 7,
  distanceMiles: 50,
  workMode: "Hybrid",
  easyApply: true,
  alertFrequency: "weekly",
};

function authClient(user: { id: string } | null = { id: userId }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("saved search mutation routes", () => {
  it("rejects unauthenticated creates", async () => {
    mocks.createClient.mockResolvedValue(authClient(null));

    const response = await POST(
      jsonRequest("/api/saved-searches", "POST", validSearch),
    );

    expect(response.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("rejects unknown create fields", async () => {
    mocks.createClient.mockResolvedValue(authClient());

    const response = await POST(
      jsonRequest("/api/saved-searches", "POST", {
        ...validSearch,
        userId: "attacker-controlled",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("creates a search for the authenticated user", async () => {
    const client = authClient();
    const inserted = { id: searchId, user_id: userId };
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    client.from.mockReturnValue(query);
    mocks.createClient.mockResolvedValue(client);

    const response = await POST(
      jsonRequest("/api/saved-searches", "POST", validSearch),
    );

    expect(response.status).toBe(201);
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userId, name: "Platform roles" }),
    );
  });

  it("rejects invalid update ids", async () => {
    const response = await PATCH(
      jsonRequest("/api/saved-searches/not-valid", "PATCH", {
        alertFrequency: "off",
      }),
      { params: Promise.resolve({ id: "not-valid" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("updates only a search owned by the authenticated user", async () => {
    const client = authClient();
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: { id: searchId }, error: null }),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    client.from.mockReturnValue(query);
    mocks.createClient.mockResolvedValue(client);

    const response = await PATCH(
      jsonRequest(`/api/saved-searches/${searchId}`, "PATCH", {
        alertFrequency: "daily",
      }),
      { params: Promise.resolve({ id: searchId }) },
    );

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("id", searchId);
    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("deletes only a search owned by the authenticated user", async () => {
    const client = authClient();
    const query = {
      delete: vi.fn(),
      eq: vi.fn(),
      then: (resolve: (value: { error: null; count: number }) => unknown) =>
        resolve({ error: null, count: 1 }),
    };
    query.delete.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    client.from.mockReturnValue(query);
    mocks.createClient.mockResolvedValue(client);

    const response = await DELETE(
      new Request("http://localhost/api/saved-searches/" + searchId),
      {
        params: Promise.resolve({ id: searchId }),
      },
    );

    expect(response.status).toBe(204);
    expect(query.eq).toHaveBeenCalledWith("id", searchId);
    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
  });
});
