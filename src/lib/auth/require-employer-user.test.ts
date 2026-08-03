import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { requireEmployerUser } from "@/lib/auth/require-employer-user";

function client(options?: {
  user?: { id: string } | null;
  authError?: { message: string } | null;
  roles?: Array<{ role: string }>;
  rolesError?: { message: string } | null;
}) {
  const query = {
    select: vi.fn(),
    eq: vi.fn().mockResolvedValue({
      data: options?.roles ?? [],
      error: options?.rolesError ?? null,
    }),
  };
  query.select.mockReturnValue(query);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user:
            options && "user" in options ? options.user : { id: "user-123" },
        },
        error: options?.authError ?? null,
      }),
    },
    from: vi.fn().mockReturnValue(query),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireEmployerUser", () => {
  it("rejects unauthenticated callers", async () => {
    mocks.createClient.mockResolvedValue(client({ user: null }));

    const result = await requireEmployerUser();

    expect(result.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it("rejects an authenticated job seeker", async () => {
    mocks.createClient.mockResolvedValue(
      client({ roles: [{ role: "job_seeker" }] }),
    );

    const result = await requireEmployerUser();

    expect(result.status).toBe(403);
    expect(result.user).toBeNull();
  });

  it.each(["recruiter", "admin"])(
    "allows an authenticated %s",
    async (role) => {
      mocks.createClient.mockResolvedValue(client({ roles: [{ role }] }));

      const result = await requireEmployerUser();

      expect(result.status).toBe(200);
      expect(result.user).toEqual({ id: "user-123" });
    },
  );

  it("fails closed when role lookup fails", async () => {
    mocks.createClient.mockResolvedValue(
      client({ rolesError: { message: "database unavailable" } }),
    );

    const result = await requireEmployerUser();

    expect(result.status).toBe(500);
    expect(result.user).toBeNull();
  });
});
