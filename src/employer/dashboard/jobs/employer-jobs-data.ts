import { createClient } from "@/lib/supabase/server";

import type {
  EditableJob,
  ScreeningQuestion,
} from "../post-job/post-job-content";
import type { EmployerJob, JobStatus } from "./jobs-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type EmployerJobsPageData = {
  jobs: EmployerJob[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  totals: {
    all: number;
    active: number;
    draft: number;
    closed: number;
  };
};

type GetEmployerJobsPageParams = {
  supabase?: SupabaseServerClient;
  recruiterId?: string;
  page?: string | number | null;
  pageSize?: string | number | null;
  query?: string | null;
  status?: string | null;
};

type EmployerJobRow = {
  id: string;
  slug: string | null;
  title: string;
  company_name: string;
  location: string;
  work_mode: string;
  employment_type: string;
  posted_at: string;
  created_at: string;
  status: "draft" | "published" | "closed";
  applicant_count: number | null;
};

type EmployerJobQueryRow = Omit<EmployerJobRow, "applicant_count"> & {
  job_applicant_counts:
    | { applicant_count: number | null }
    | { applicant_count: number | null }[]
    | null;
};

type EmployerJobEditRow = {
  id: string;
  slug: string | null;
  status: "draft" | "published" | "closed";
  title: string;
  company_name: string;
  location: string;
  street_address: string | null;
  work_mode: string;
  applicant_distance_miles: number | null;
  include_relocation: boolean | null;
  employment_type: string;
  description: string;
  skills: string[] | null;
  benefits: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_frequency: string | null;
  boost_id: string | null;
  notification_email: string | null;
  screening_questions: unknown;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function daysSince(value: string | null) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return 0;

  const diff = Date.now() - timestamp;

  return Math.max(0, Math.floor(diff / 86_400_000));
}

function mapStatus(status: EmployerJobRow["status"]): JobStatus {
  if (status === "published") return "Active";
  if (status === "closed") return "Closed";
  return "Draft";
}

function parsePositiveInt(
  value: string | number | null | undefined,
  fallback: number,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return Math.floor(parsed);
}

function normalizeStatus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === "all") return null;
  if (normalized === "active" || normalized === "published") return "published";
  if (normalized === "draft") return "draft";
  if (normalized === "closed") return "closed";

  return null;
}

function normalizeSearchTerm(value: string | null | undefined) {
  return value
    ?.trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function mapEmployerJob(row: EmployerJobRow): EmployerJob {
  const postedAt = row.status === "draft" ? null : row.posted_at;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    companyName: row.company_name,
    location: row.location,
    workMode: row.work_mode,
    employmentType: row.employment_type,
    posted: formatDate(postedAt),
    daysLive: daysSince(postedAt),
    views: 0,
    applicants: row.applicant_count ?? 0,
    status: mapStatus(row.status),
  };
}

function parseScreeningQuestions(value: unknown): ScreeningQuestion[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const question = item as {
        id?: unknown;
        question?: unknown;
        required?: unknown;
      };
      const text =
        typeof question.question === "string" ? question.question.trim() : "";

      if (!text) return null;

      return {
        id:
          typeof question.id === "string" && question.id.trim()
            ? question.id
            : crypto.randomUUID(),
        question: text,
        required:
          typeof question.required === "boolean" ? question.required : true,
      };
    })
    .filter((question): question is ScreeningQuestion => Boolean(question));
}

function mapEditableJob(row: EmployerJobEditRow): EditableJob {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    title: row.title,
    companyName: row.company_name,
    location: row.location,
    streetAddress: row.street_address ?? "",
    remote: row.work_mode === "Remote" ? "yes" : "no",
    distance: row.applicant_distance_miles ?? 50,
    includeRelocation: row.include_relocation ?? true,
    employmentType: row.employment_type,
    description: row.description,
    skills: (row.skills ?? []).join(", "),
    benefits: row.benefits ?? [],
    salaryMin: row.salary_min === null ? "" : String(row.salary_min),
    salaryMax: row.salary_max === null ? "" : String(row.salary_max),
    salaryCurrency: row.salary_currency ?? "USD",
    payFrequency: row.salary_frequency ?? "Per year",
    boostId: row.boost_id ?? "none",
    notificationEmail: row.notification_email ?? "",
    screeningQuestions: parseScreeningQuestions(row.screening_questions),
  };
}

async function countEmployerJobs(
  supabase: SupabaseServerClient,
  recruiterId: string,
  status?: EmployerJobRow["status"],
) {
  let query = supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("recruiter_id", recruiterId);

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) throw error;

  return count ?? 0;
}

async function resolveEmployerContext(params: GetEmployerJobsPageParams) {
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

export async function getEmployerJobsPage(
  params: GetEmployerJobsPageParams = {},
): Promise<
  | { ok: true; data: EmployerJobsPageData }
  | { ok: false; error: string; data: EmployerJobsPageData }
> {
  const { supabase, recruiterId } = await resolveEmployerContext(params);
  const page = parsePositiveInt(params.page, 1);
  const pageSize = Math.min(
    parsePositiveInt(params.pageSize, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const status = normalizeStatus(params.status);
  const searchTerm = normalizeSearchTerm(params.query);
  const emptyData: EmployerJobsPageData = {
    jobs: [],
    pagination: {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
    },
    totals: {
      all: 0,
      active: 0,
      draft: 0,
      closed: 0,
    },
  };

  if (!recruiterId) {
    return { ok: true, data: emptyData };
  }

  try {
    const totalsPromise = Promise.all([
      countEmployerJobs(supabase, recruiterId),
      countEmployerJobs(supabase, recruiterId, "published"),
      countEmployerJobs(supabase, recruiterId, "draft"),
      countEmployerJobs(supabase, recruiterId, "closed"),
    ]);

    let query = supabase
      .from("jobs")
      .select(
        `
        id,
        slug,
        title,
        company_name,
        location,
        work_mode,
        employment_type,
        posted_at,
        created_at,
        status,
        job_applicant_counts(applicant_count)
      `,
        { count: "exact" },
      )
      .eq("recruiter_id", recruiterId);

    if (status) {
      query = query.eq("status", status);
    }

    if (searchTerm) {
      const pattern = `%${searchTerm}%`;
      query = query.or(
        [
          `title.ilike.${pattern}`,
          `company_name.ilike.${pattern}`,
          `location.ilike.${pattern}`,
        ].join(","),
      );
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const [all, active, draft, closed] = await totalsPromise;
    const total = count ?? 0;
    const rows = (data ?? []) as EmployerJobQueryRow[];
    const jobs = rows.map((row) => {
      const applicantCounts = Array.isArray(row.job_applicant_counts)
        ? row.job_applicant_counts[0]
        : row.job_applicant_counts;

      return mapEmployerJob({
        id: row.id,
        slug: row.slug,
        title: row.title,
        company_name: row.company_name,
        location: row.location,
        work_mode: row.work_mode,
        employment_type: row.employment_type,
        posted_at: row.posted_at,
        created_at: row.created_at,
        status: row.status,
        applicant_count: applicantCounts?.applicant_count ?? 0,
      });
    });

    return {
      ok: true,
      data: {
        jobs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        totals: {
          all,
          active,
          draft,
          closed,
        },
      },
    };
  } catch (error) {
    console.error("[getEmployerJobsPage]", error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not load jobs.",
      data: emptyData,
    };
  }
}

export async function getEmployerJobs() {
  const result = await getEmployerJobsPage({ pageSize: 4 });

  return result.data.jobs;
}

export async function getEmployerJobForEdit(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      slug,
      status,
      title,
      company_name,
      location,
      street_address,
      work_mode,
      applicant_distance_miles,
      include_relocation,
      employment_type,
      description,
      skills,
      benefits,
      salary_min,
      salary_max,
      salary_currency,
      salary_frequency,
      boost_id,
      notification_email,
      screening_questions
    `,
    )
    .eq("id", jobId)
    .eq("recruiter_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getEmployerJobForEdit]", error);

    return null;
  }

  return data ? mapEditableJob(data as EmployerJobEditRow) : null;
}
