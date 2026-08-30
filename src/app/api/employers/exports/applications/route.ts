import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import { rowsToCsv } from "@/lib/exports/csv";
import {
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerExportRateLimit } from "@/lib/rate-limit";
import { recordPrivilegedAction } from "@/lib/security/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
  jobId: z.union([z.literal("all"), z.string().uuid()]).default("all"),
});

type ExportRow = {
  applicant_email: string | null;
  applicant_full_name: string | null;
  applicant_linkedin: string | null;
  applicant_location: string | null;
  applicant_phone: string | null;
  applicant_portfolio: string | null;
  created_at: string;
  id: string;
  job_id: string;
  requires_sponsorship: string;
  status: string;
  updated_at: string;
  work_authorization: string | null;
  years_experience: string | null;
  employer_pipeline_stages: { name: string } | { name: string }[] | null;
  jobs: { title: string } | { title: string }[] | null;
};

function relation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function exportRecord(row: ExportRow) {
  return {
    application_id: row.id,
    job_id: row.job_id,
    job_title: relation(row.jobs)?.title ?? "",
    candidate_name: row.applicant_full_name ?? "",
    email: row.applicant_email ?? "",
    phone: row.applicant_phone ?? "",
    location: row.applicant_location ?? "",
    linkedin_url: row.applicant_linkedin ?? "",
    portfolio_url: row.applicant_portfolio ?? "",
    years_experience: row.years_experience ?? "",
    work_authorization: row.work_authorization ?? "",
    requires_sponsorship: row.requires_sponsorship,
    status: row.status,
    pipeline_stage: relation(row.employer_pipeline_stages)?.name ?? "",
    applied_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const exportHeaders = [
  "application_id",
  "job_id",
  "job_title",
  "candidate_name",
  "email",
  "phone",
  "location",
  "linkedin_url",
  "portfolio_url",
  "years_experience",
  "work_authorization",
  "requires_sponsorship",
  "status",
  "pipeline_stage",
  "applied_at",
  "updated_at",
] as const satisfies readonly (keyof ReturnType<typeof exportRecord>)[];

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = exportQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid export parameters." },
      { status: 400 },
    );
  }

  const limited = await enforceRateLimit({
    limiter: employerExportRateLimit,
    key: auth.user.id,
    context: "employer_application_export",
  });
  if (limited) return limited;

  try {
    const { data: membership, error: membershipError } = await auth.supabase
      .from("employer_team_members")
      .select("company_id, role")
      .eq("user_id", auth.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) {
      return NextResponse.json(
        {
          error:
            "Only company owners and administrators can export candidates.",
        },
        { status: 403 },
      );
    }

    let query = auth.supabase
      .from("applications")
      .select(
        `
        id, job_id, applicant_full_name, applicant_email, applicant_phone,
        applicant_location, applicant_linkedin, applicant_portfolio,
        years_experience, work_authorization, requires_sponsorship,
        status, created_at, updated_at,
        jobs!inner(title, company_id),
        employer_pipeline_stages(name)
      `,
      )
      .eq("jobs.company_id", membership.company_id)
      .order("created_at", { ascending: false })
      .limit(5_000);

    if (parsed.data.jobId !== "all") {
      query = query.eq("job_id", parsed.data.jobId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const records = ((data ?? []) as unknown as ExportRow[]).map(exportRecord);
    const exportedAt = new Date().toISOString();
    const date = exportedAt.slice(0, 10);
    const filename = `hiregeneral-applications-${date}.${parsed.data.format}`;

    await recordPrivilegedAction({
      action: "employer.applications_exported",
      targetType: "company",
      targetId: membership.company_id,
      metadata: {
        format: parsed.data.format,
        job_id: parsed.data.jobId,
        row_count: records.length,
      },
    });

    const headers = {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    };

    if (parsed.data.format === "json") {
      return NextResponse.json(
        { export_version: 1, exported_at: exportedAt, applications: records },
        { headers },
      );
    }

    const csv = rowsToCsv(
      exportHeaders,
      records.map((record) => exportHeaders.map((key) => record[key])),
    );

    return new NextResponse(`\uFEFF${csv}`, {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    });
  } catch (error) {
    logServerError("employer_application_export_failed", error);
    return safeServerError("Could not prepare the application export.");
  }
}
