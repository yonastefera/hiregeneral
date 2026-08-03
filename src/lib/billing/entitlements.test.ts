import { describe, expect, it, vi } from "vitest";

import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";

function client(data: unknown, error: unknown = null) {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) };
}

describe("employer entitlements", () => {
  it("normalizes the server-authoritative entitlement snapshot", async () => {
    const supabase = client({
      companyId: "company_123",
      plan: "growth",
      active: true,
      activeJobLimit: 25,
      activeJobs: 4,
      candidateDatabase: true,
      invitationLimit: 100,
      invitationsUsed: 12,
      messageLimit: 500,
      messagesUsed: 40,
      premiumAnalytics: false,
      boostCredits: 2,
    });

    await expect(loadEmployerEntitlements(supabase as never)).resolves.toEqual({
      companyId: "company_123",
      plan: "growth",
      active: true,
      activeJobLimit: 25,
      activeJobs: 4,
      candidateDatabase: true,
      invitationLimit: 100,
      invitationsUsed: 12,
      messageLimit: 500,
      messagesUsed: 40,
      premiumAnalytics: false,
      boostCredits: 2,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("current_employer_entitlements");
  });

  it("fails closed when entitlement loading fails", async () => {
    const supabase = client(null, { message: "private database error" });
    await expect(loadEmployerEntitlements(supabase as never)).rejects.toThrow(
      "Could not load employer entitlements.",
    );
  });

  it("returns a stable denial response", async () => {
    const response = entitlementDenied("Upgrade required.");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Upgrade required.",
      code: "ENTITLEMENT_REQUIRED",
    });
  });
});
