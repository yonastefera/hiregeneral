import { createClient } from "@/lib/supabase/server";

import type {
  Candidate,
  CandidateJobFilter,
  CandidateStatus,
  EmployerCandidatesData,
} from "./candidates-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type CandidateJobRow = {
  id: string;
  title: string;
  recruiter_id: string;
};

type ApplicationRow = {
  id: string;
  applicant_email: string | null;
  applicant_full_name: string | null;
  applicant_location: string | null;
  created_at: string;
  resume_url: string | null;
  status: string;
  years_experience: string | null;
  jobs: CandidateJobRow | CandidateJobRow[] | null;
};

type GetEmployerCandidatesParams = {
  supabase?: SupabaseServerClient;
  recruiterId?: string;
  jobId?: string | null;
  query?: string | null;
  limit?: number;
};

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "Recently";

  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diff / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return `${Math.floor(days / 7)}w ago`;
}

function mapCandidateStatus(status: string): CandidateStatus {
  const normalized = status.toLowerCase();

  if (normalized.includes("interview")) return "Interview";
  if (normalized.includes("review")) return "Reviewed";

  return "New";
}

function normalizeSearchTerm(value: string | null | undefined) {
  return value?.trim().toLowerCase().slice(0, 80) ?? "";
}

function candidateMatches(candidate: Candidate, query: string) {
  if (!query) return true;

  return [
    candidate.name,
    candidate.email ?? "",
    candidate.location,
    candidate.job,
    candidate.role,
  ].some((value) => value.toLowerCase().includes(query));
}

function mapCandidate(row: ApplicationRow): Candidate {
  const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
  const name =
    row.applicant_full_name?.trim() ||
    row.applicant_email?.split("@")[0] ||
    "Candidate";

  return {
    id: row.id,
    name,
    role: row.years_experience
      ? `${row.years_experience} experience`
      : "Applicant",
    job: job?.title ?? "Role",
    jobId: job?.id ?? "",
    location: row.applicant_location ?? "Location not provided",
    experience: row.years_experience || "Not provided",
    applied: relativeTime(row.created_at),
    status: mapCandidateStatus(row.status),
    match: null,
    email: row.applicant_email,
    resumeUrl: row.resume_url,
  };
}

async function resolveEmployerContext(params: GetEmployerCandidatesParams) {
  if (params.supabase && params.recruiterId) {
    return {
      supabase: params.supabase,
      recruiterId: params.recruiterId,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    recruiterId: user?.id ?? null,
  };
}

async function loadJobFilters(
  supabase: SupabaseServerClient,
  recruiterId: string,
): Promise<CandidateJobFilter[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("recruiter_id", recruiterId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[loadCandidateJobFilters]", error);

    return [{ label: "All jobs", value: "all" }];
  }

  return [
    { label: "All jobs", value: "all" },
    ...(data ?? []).map((job) => ({
      label: job.title,
      value: job.id,
    })),
  ];
}

export async function getEmployerCandidates(
  params: GetEmployerCandidatesParams = {},
): Promise<EmployerCandidatesData> {
  const { supabase, recruiterId } = await resolveEmployerContext(params);

  if (!recruiterId) {
    return {
      candidates: [],
      filters: [{ label: "All jobs", value: "all" }],
    };
  }

  const normalizedJobId =
    params.jobId && params.jobId !== "all" ? params.jobId : null;
  const searchTerm = normalizeSearchTerm(params.query);
  const filtersPromise = loadJobFilters(supabase, recruiterId);

  let query = supabase
    .from("applications")
    .select(
      `
      id,
      applicant_email,
      applicant_full_name,
      applicant_location,
      created_at,
      resume_url,
      status,
      years_experience,
      jobs!inner(id, title, recruiter_id)
    `,
    )
    .eq("jobs.recruiter_id", recruiterId);

  if (normalizedJobId) {
    query = query.eq("job_id", normalizedJobId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(Math.min(params.limit ?? 100, 200));

  if (error) {
    console.error("[getEmployerCandidates]", error);

    return {
      candidates: [],
      filters: await filtersPromise,
    };
  }

  const candidates = ((data ?? []) as ApplicationRow[])
    .map(mapCandidate)
    .filter((candidate) => candidateMatches(candidate, searchTerm));

  return {
    candidates,
    filters: await filtersPromise,
  };
}
