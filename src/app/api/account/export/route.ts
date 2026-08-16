import { NextResponse } from "next/server";

import {
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { accountExportRateLimit } from "@/lib/rate-limit";
import { recordPrivilegedAction } from "@/lib/security/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportResult = { data: unknown; error: unknown };

function exportFailed(results: ExportResult[]) {
  return results.some((result) => Boolean(result.error));
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: accountExportRateLimit,
    key: user.id,
    context: "account_data_export",
  });
  if (limited) return limited;

  const [
    profileResult,
    demographicsResult,
    rolesResult,
    applicationsResult,
    savedJobsResult,
    notificationsResult,
    conversationsResult,
    companiesResult,
    jobsResult,
    recruiterInvitesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("profile_demographics")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("*").eq("user_id", user.id),
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order("last_message_at", { ascending: false }),
    supabase.from("companies").select("*").eq("owner_id", user.id),
    supabase
      .from("jobs")
      .select("*")
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("employer_candidate_invites")
      .select("*")
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const initialResults = [
    profileResult,
    demographicsResult,
    rolesResult,
    applicationsResult,
    savedJobsResult,
    notificationsResult,
    conversationsResult,
    companiesResult,
    jobsResult,
    recruiterInvitesResult,
  ] as ExportResult[];

  if (exportFailed(initialResults)) {
    logServerError(
      "account_data_export_query_failed",
      initialResults.find((result) => result.error)?.error,
    );
    return safeServerError("Could not prepare your data export.");
  }

  const profile = profileResult.data;
  const conversations = conversationsResult.data ?? [];
  const conversationIds = conversations.map((conversation) => conversation.id);

  const [messagesResult, candidateInvitesResult, contactMessagesResult] =
    await Promise.all([
      conversationIds.length
        ? supabase
            .from("messages")
            .select("*")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      profile?.id
        ? supabase
            .from("employer_candidate_invites")
            .select("*")
            .eq("candidate_id", profile.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      user.email
        ? createSupabaseAdminClient()
            .from("contact_messages")
            .select("*")
            .eq("email", user.email)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  const secondaryResults = [
    messagesResult,
    candidateInvitesResult,
    contactMessagesResult,
  ] as ExportResult[];

  if (exportFailed(secondaryResults)) {
    logServerError(
      "account_data_export_related_query_failed",
      secondaryResults.find((result) => result.error)?.error,
    );
    return safeServerError("Could not prepare your data export.");
  }

  const exportedAt = new Date().toISOString();
  const payload = {
    export_version: 1,
    exported_at: exportedAt,
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    },
    profile,
    demographics: demographicsResult.data,
    roles: rolesResult.data ?? [],
    applications: applicationsResult.data ?? [],
    saved_jobs: savedJobsResult.data ?? [],
    notifications: notificationsResult.data ?? [],
    conversations,
    messages: messagesResult.data ?? [],
    companies: companiesResult.data ?? [],
    jobs: jobsResult.data ?? [],
    employer_invitations: recruiterInvitesResult.data ?? [],
    candidate_invitations: candidateInvitesResult.data ?? [],
    contact_messages: contactMessagesResult.data ?? [],
  };

  await recordPrivilegedAction({
    action: "account.data_exported",
    targetType: "user",
    targetId: user.id,
    metadata: { export_version: 1 },
  });

  const date = exportedAt.slice(0, 10);
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="hiregeneral-data-${date}.json"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
