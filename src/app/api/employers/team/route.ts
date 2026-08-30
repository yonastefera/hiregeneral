import { NextRequest, NextResponse } from "next/server";

import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  addTeamMemberSchema,
  removeTeamMemberSchema,
} from "@/lib/employers/team";
import {
  boundedJsonBody,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerTeamRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function managedCompany(
  supabase: Awaited<ReturnType<typeof requireEmployerUser>>["supabase"],
  userId: string,
) {
  const { data: owned } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (owned) return owned.id;

  const { data: membership } = await supabase
    .from("employer_team_members")
    .select("company_id")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();
  return membership?.company_id ?? null;
}

export async function GET() {
  const auth = await requireEmployerUser();
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const companyId = await managedCompany(auth.supabase, auth.user.id);
  if (!companyId) return NextResponse.json({ members: [] });

  const { data, error } = await auth.supabase
    .from("employer_team_members")
    .select("id, user_id, role, created_at")
    .eq("company_id", companyId)
    .order("created_at");
  if (error) return safeServerError("Could not load the employer team.");

  const ids = (data ?? []).map((member) => member.user_id);
  const admin = createSupabaseAdminClient();
  const { data: profiles } = ids.length
    ? await admin
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids)
    : { data: [] };
  const byId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );
  return NextResponse.json({
    members: (data ?? []).map((member) => ({
      ...member,
      profile: byId.get(member.user_id) ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limit = await employerTeamRateLimit.limit(auth.user.id);
  if (!limit.success)
    return NextResponse.json(
      { error: "Too many team updates." },
      { status: 429 },
    );
  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = addTeamMemberSchema.safeParse(body.data);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid employer email and role." },
      { status: 400 },
    );
  const companyId = await managedCompany(auth.supabase, auth.user.id);
  if (!companyId)
    return NextResponse.json({ error: "Company not found." }, { status: 404 });

  try {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", parsed.data.email)
      .maybeSingle();
    if (!profile)
      return NextResponse.json(
        { error: "That email does not have an employer account." },
        { status: 400 },
      );
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id)
      .eq("role", "recruiter")
      .maybeSingle();
    if (!role)
      return NextResponse.json(
        { error: "That email does not have an employer account." },
        { status: 400 },
      );

    const { error } = await auth.supabase.from("employer_team_members").upsert(
      {
        company_id: companyId,
        user_id: profile.user_id,
        role: parsed.data.role,
        invited_by: auth.user.id,
      },
      { onConflict: "company_id,user_id" },
    );
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("employer_team_add_failed", error);
    return safeServerError("Could not add this teammate.");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEmployerUser();
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limit = await employerTeamRateLimit.limit(auth.user.id);
  if (!limit.success)
    return NextResponse.json(
      { error: "Too many team updates." },
      { status: 429 },
    );
  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = removeTeamMemberSchema.safeParse(body.data);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid teammate." }, { status: 400 });
  const companyId = await managedCompany(auth.supabase, auth.user.id);
  if (!companyId)
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  const { error } = await auth.supabase
    .from("employer_team_members")
    .delete()
    .eq("id", parsed.data.memberId)
    .eq("company_id", companyId)
    .neq("role", "owner");
  if (error) return safeServerError("Could not remove this teammate.");
  return NextResponse.json({ success: true });
}
