import { NextResponse } from "next/server";

import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type EmployerEntitlements = {
  companyId: string | null;
  plan: "starter" | "growth" | "pro";
  active: boolean;
  activeJobLimit: number;
  activeJobs: number;
  candidateDatabase: boolean;
  invitationLimit: number;
  invitationsUsed: number;
  messageLimit: number;
  messagesUsed: number;
  premiumAnalytics: boolean;
  boostCredits: number;
};

const EMPTY_ENTITLEMENTS: EmployerEntitlements = {
  companyId: null,
  plan: "starter",
  active: false,
  activeJobLimit: 0,
  activeJobs: 0,
  candidateDatabase: false,
  invitationLimit: 0,
  invitationsUsed: 0,
  messageLimit: 0,
  messagesUsed: 0,
  premiumAnalytics: false,
  boostCredits: 0,
};

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function loadEmployerEntitlements(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("current_employer_entitlements");

  if (error) throw new Error("Could not load employer entitlements.");
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return EMPTY_ENTITLEMENTS;
  }

  const value = data as Record<string, unknown>;
  const plan =
    value.plan === "growth" || value.plan === "pro" ? value.plan : "starter";

  return {
    companyId: typeof value.companyId === "string" ? value.companyId : null,
    plan,
    active: value.active === true,
    activeJobLimit: number(value.activeJobLimit),
    activeJobs: number(value.activeJobs),
    candidateDatabase: value.candidateDatabase === true,
    invitationLimit: number(value.invitationLimit),
    invitationsUsed: number(value.invitationsUsed),
    messageLimit: number(value.messageLimit),
    messagesUsed: number(value.messagesUsed),
    premiumAnalytics: value.premiumAnalytics === true,
    boostCredits: number(value.boostCredits),
  } satisfies EmployerEntitlements;
}

export function entitlementDenied(message: string) {
  return NextResponse.json(
    { error: message, code: "ENTITLEMENT_REQUIRED" },
    { status: 403 },
  );
}
