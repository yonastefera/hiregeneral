import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));

import { GET } from "@/app/api/internal/account-deletions/route";

const secret = "test-cron-secret";
const userId = "11111111-1111-4111-8111-111111111111";

function request(authorization = `Bearer ${secret}`) {
  return new Request("http://localhost/api/internal/account-deletions", {
    headers: { authorization },
  });
}

function createAdmin(options?: {
  profiles?: Array<{ user_id: string; email: string | null }>;
  eligibilityError?: object | null;
  prepareError?: object | null;
  storageError?: object | null;
  authError?: { message?: string; status?: number } | null;
  completeError?: object | null;
}) {
  const operations: string[] = [];
  const profileQuery: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "not", "lte", "is", "order"]) {
    profileQuery[method] = vi.fn().mockReturnValue(profileQuery);
  }
  profileQuery.limit = vi.fn().mockResolvedValue({
    data: options?.profiles ?? [],
    error: options?.eligibilityError ?? null,
  });

  const contactQuery = {
    delete: vi.fn(),
    eq: vi.fn().mockImplementation(async () => {
      operations.push("contact");
      return { error: null };
    }),
  };
  contactQuery.delete.mockReturnValue(contactQuery);

  const storage = {
    list: vi.fn().mockImplementation(async () => {
      operations.push("storage-list");
      return options?.storageError
        ? { data: null, error: options.storageError }
        : { data: [{ id: "object-id", name: "resume.pdf" }], error: null };
    }),
    remove: vi.fn().mockImplementation(async () => {
      operations.push("storage-remove");
      return { error: null };
    }),
  };

  const admin = {
    from: vi.fn((table: string) =>
      table === "profiles" ? profileQuery : contactQuery,
    ),
    rpc: vi.fn().mockImplementation(async (name: string) => {
      operations.push(name);
      return {
        error:
          name === "prepare_account_deletion"
            ? (options?.prepareError ?? null)
            : (options?.completeError ?? null),
      };
    }),
    storage: { from: vi.fn().mockReturnValue(storage) },
    auth: {
      admin: {
        deleteUser: vi.fn().mockImplementation(async () => {
          operations.push("auth-delete");
          return { error: options?.authError ?? null };
        }),
      },
    },
    profileQuery,
    contactQuery,
    storageClient: storage,
    operations,
  };

  return admin;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = secret;
  process.env.ACCOUNT_DELETION_EXECUTION_ENABLED = "false";
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.ACCOUNT_DELETION_EXECUTION_ENABLED;
});

describe("internal account-deletion worker", () => {
  it("rejects requests without the service secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(mocks.createAdmin).not.toHaveBeenCalled();
  });

  it("defaults to aggregate-only report mode", async () => {
    const admin = createAdmin({ profiles: [{ user_id: userId, email: null }] });
    mocks.createAdmin.mockReturnValue(admin);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mode: "report_only",
      eligible: 1,
      batch_limit: 10,
    });
    expect(admin.rpc).not.toHaveBeenCalled();
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("executes preparation, storage removal, auth deletion, and completion", async () => {
    process.env.ACCOUNT_DELETION_EXECUTION_ENABLED = "true";
    const admin = createAdmin({
      profiles: [{ user_id: userId, email: "person@example.test" }],
    });
    mocks.createAdmin.mockReturnValue(admin);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mode: "execute",
      eligible: 1,
      completed: 1,
      failed: 0,
      batch_limit: 10,
    });
    expect(admin.operations).toEqual([
      "contact",
      "prepare_account_deletion",
      "storage-list",
      "storage-remove",
      "storage-list",
      "storage-remove",
      "auth-delete",
      "complete_account_deletion",
    ]);
    expect(admin.storageClient.remove).toHaveBeenCalledWith([
      `${userId}/resume.pdf`,
    ]);
  });

  it("returns only safe aggregate failure information", async () => {
    process.env.ACCOUNT_DELETION_EXECUTION_ENABLED = "true";
    const admin = createAdmin({
      profiles: [{ user_id: userId, email: null }],
      storageError: { message: "private storage detail" },
    });
    mocks.createAdmin.mockReturnValue(admin);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await GET(request());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      mode: "execute",
      eligible: 1,
      completed: 0,
      failed: 1,
      batch_limit: 10,
    });
    expect(JSON.stringify(payload)).not.toContain("private storage detail");
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
