import type { SupabaseClient } from "@supabase/supabase-js";

import { legalPolicyRelease } from "@/legal/policy-release";

export async function recordCurrentPolicyAcceptance({
  admin,
  userId,
  source,
}: {
  admin: SupabaseClient;
  userId: string;
  source: "role_selection";
}) {
  if (
    legalPolicyRelease.approvalStatus !== "published" ||
    !legalPolicyRelease.acceptanceRequired
  ) {
    throw new Error("Policy acceptance is not enabled for draft policies.");
  }

  const acceptedAt = new Date().toISOString();
  const { error } = await admin.from("legal_policy_acceptances").upsert(
    [
      {
        user_id: userId,
        document_type: "terms",
        document_version: legalPolicyRelease.termsVersion,
        accepted_at: acceptedAt,
        source,
      },
      {
        user_id: userId,
        document_type: "privacy",
        document_version: legalPolicyRelease.privacyVersion,
        accepted_at: acceptedAt,
        source,
      },
    ],
    { onConflict: "user_id,document_type,document_version" },
  );

  if (error) throw new Error("Could not record policy acceptance.");
}
