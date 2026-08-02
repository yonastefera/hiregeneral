import { describe, expect, it, vi } from "vitest";

import { assignInitialRole } from "@/lib/auth/role-assignment";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "person@example.com",
  user_metadata: { full_name: "Person Example" },
};

describe("atomic initial role assignment", () => {
  it("returns and preserves an existing privileged role", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "admin", error: null });
    const role = await assignInitialRole({
      admin: { rpc } as never,
      user: user as never,
      role: "job_seeker",
    });

    expect(role).toBe("admin");
    expect(rpc).toHaveBeenCalledWith(
      "assign_initial_role",
      expect.objectContaining({ p_role: "job_seeker" }),
    );
  });

  it("surfaces an atomic RPC failure without fallback writes", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "transaction rolled back" },
    });

    await expect(
      assignInitialRole({
        admin: { rpc } as never,
        user: user as never,
        role: "recruiter",
      }),
    ).rejects.toThrow("Could not assign account role.");
    expect(rpc).toHaveBeenCalledOnce();
  });
});
