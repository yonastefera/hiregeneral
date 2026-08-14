import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerCompanyProfile } from "@/employer/dashboard/company/employer-company-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerCompanyRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const companySchema = z
  .object({
    id: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(2, "Company name is required.").max(120),
    website: z.string().trim().max(240).optional().or(z.literal("")),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    industry: z.string().trim().max(80).optional().or(z.literal("")),
    size: z.string().trim().max(80).optional().or(z.literal("")),
    tagline: z.string().trim().max(160).optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    logoUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  })
  .strict();

function normalizeUrl(value: string | null | undefined) {
  const website = value?.trim();

  if (!website) return null;

  return website.startsWith("http") ? website : `https://${website}`;
}

export async function GET() {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const company = await getEmployerCompanyProfile({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    email: auth.user.email,
  });

  return NextResponse.json({ company });
}

export async function PUT(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit({
    limiter: employerCompanyRateLimit,
    key: auth.user.id,
    context: "employer_company_update",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = companySchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the company profile.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const values = {
    owner_id: auth.user.id,
    name: payload.name,
    website: normalizeUrl(payload.website),
    location: payload.location || null,
    industry: payload.industry || null,
    size: payload.size || null,
    tagline: payload.tagline || null,
    description: payload.description || null,
    logo_url: payload.logoUrl || null,
  };

  const existingCompanyQuery = auth.supabase
    .from("companies")
    .select("id")
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const existingCompanyResult = await existingCompanyQuery;

  if (existingCompanyResult.error) {
    logServerError(
      "employer_company_lookup_failed",
      existingCompanyResult.error,
    );
    return safeServerError("Could not save the company profile.");
  }

  const companyId = payload.id ?? existingCompanyResult.data?.id ?? null;
  const mutation = companyId
    ? auth.supabase
        .from("companies")
        .update(values)
        .eq("id", companyId)
        .eq("owner_id", auth.user.id)
    : auth.supabase.from("companies").insert(values);

  const { data: savedCompany, error } = await mutation.select("id").single();

  if (error) {
    if (companyId && error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Company was not found." },
        { status: 404 },
      );
    }
    logServerError("employer_company_save_failed", error);
    return safeServerError("Could not save the company profile.");
  }

  if (savedCompany?.id) {
    const { error: jobLogoError } = await auth.supabase
      .from("jobs")
      .update({
        company_logo_url: values.logo_url,
      })
      .eq("recruiter_id", auth.user.id)
      .eq("company_id", savedCompany.id);

    if (jobLogoError) {
      logServerError("employer_company_logo_sync_failed", jobLogoError);
    }
  }

  const company = await getEmployerCompanyProfile({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    email: auth.user.email,
  });

  return NextResponse.json({ company });
}
