import { createClient } from "@/lib/supabase/server";
import type {
  EducationItem,
  ProfileLink,
  WorkExperience,
} from "@/job-seekers/profile/profile-types";

import type { ResumeDatabaseData, ResumeMatch } from "./database-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type EmployerResumeDatabaseParams = {
  supabase?: SupabaseServerClient;
  recruiterId?: string;
  jobId?: string | null;
  query?: string | null;
  resumeOnly?: boolean;
  limit?: number;
};

type ResumeJobRow = {
  id: string;
  title: string;
  skills: string[] | null;
};

type CandidateProfileRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  additional_info: string | null;
  executive_summary: string | null;
  objective: string | null;
  resume_url: string | null;
  resume_file_name: string | null;
  resume_uploaded_at: string | null;
  skills: string[] | null;
  work_experience: WorkExperience[] | null;
  education: EducationItem[] | null;
  profile_links: ProfileLink[] | null;
  level_of_experience: string | null;
  highest_degree: string | null;
  industry: string | null;
  minimum_desired_pay: string | null;
  open_to_relocation: boolean | null;
  updated_at: string;
};

type InviteRow = {
  candidate_id: string;
};

const RICH_PROFILE_SELECT = `
  id,
  user_id,
  full_name,
  headline,
  location,
  email,
  phone,
  additional_info,
  executive_summary,
  objective,
  resume_url,
  resume_file_name,
  resume_uploaded_at,
  skills,
  work_experience,
  education,
  profile_links,
  level_of_experience,
  highest_degree,
  industry,
  minimum_desired_pay,
  open_to_relocation,
  updated_at
`;

const BASE_PROFILE_SELECT = `
  id,
  user_id,
  full_name,
  headline,
  location,
  email,
  phone,
  additional_info,
  resume_url,
  resume_file_name,
  resume_uploaded_at,
  skills,
  updated_at
`;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizeSearchTerm(value: string | null | undefined) {
  return value
    ?.trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .slice(0, 80);
}

function isPublicUrl(value: string | null | undefined) {
  return Boolean(value?.startsWith("http://") || value?.startsWith("https://"));
}

function isPlaceholderResumeUrl(value: string) {
  return [
    "/profile/resume/view",
    "profile/resume/view",
    "/profile/resume",
    "profile/resume",
    "/resume/view",
    "resume/view",
  ].includes(value.trim());
}

function getStoredResumeUrl(resumeUrl: string | null) {
  const storedResumeUrl = resumeUrl?.trim() ?? "";

  if (!storedResumeUrl || isPlaceholderResumeUrl(storedResumeUrl)) return null;

  return storedResumeUrl;
}

async function getResumeViewUrl(
  supabase: SupabaseServerClient,
  resumeUrl: string | null,
) {
  const storedResumeUrl = getStoredResumeUrl(resumeUrl);

  if (!storedResumeUrl) return null;
  if (isPublicUrl(storedResumeUrl)) return storedResumeUrl;

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storedResumeUrl, 60 * 10);

  if (error) {
    return null;
  }

  return data?.signedUrl ?? null;
}

function getInitialSummary(profile: CandidateProfileRow) {
  const summary =
    profile.executive_summary?.trim() ||
    profile.objective?.trim() ||
    profile.additional_info?.trim();

  if (summary) return summary;

  const skills = (profile.skills ?? []).filter(Boolean).slice(0, 4);

  if (skills.length > 0) {
    return `Candidate profile with experience across ${skills.join(", ")}.`;
  }

  return "Candidate profile available in the HireGeneral resume database.";
}

function normalizeCandidateProfileRow(
  row: Partial<CandidateProfileRow> &
    Pick<CandidateProfileRow, "id" | "user_id" | "updated_at">,
): CandidateProfileRow {
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name ?? null,
    headline: row.headline ?? null,
    location: row.location ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    additional_info: row.additional_info ?? null,
    executive_summary: row.executive_summary ?? null,
    objective: row.objective ?? null,
    resume_url: row.resume_url ?? null,
    resume_file_name: row.resume_file_name ?? null,
    resume_uploaded_at: row.resume_uploaded_at ?? null,
    skills: Array.isArray(row.skills) ? row.skills : [],
    work_experience: Array.isArray(row.work_experience)
      ? row.work_experience
      : [],
    education: Array.isArray(row.education) ? row.education : [],
    profile_links: Array.isArray(row.profile_links) ? row.profile_links : [],
    level_of_experience: row.level_of_experience ?? null,
    highest_degree: row.highest_degree ?? null,
    industry: row.industry ?? null,
    minimum_desired_pay: row.minimum_desired_pay ?? null,
    open_to_relocation: row.open_to_relocation ?? null,
    updated_at: row.updated_at,
  };
}

function profileMatches(profile: CandidateProfileRow, query: string | null) {
  if (!query) return true;

  const skillText = (profile.skills ?? []).join(" ");
  const experienceText = (profile.work_experience ?? [])
    .map((experience) =>
      [
        experience.title,
        experience.company,
        experience.location,
        experience.description,
      ].join(" "),
    )
    .join(" ");
  const educationText = (profile.education ?? [])
    .map((education) =>
      [
        education.school_name,
        education.degree,
        education.field_of_study,
        education.description,
      ].join(" "),
    )
    .join(" ");

  return [
    profile.full_name,
    profile.headline,
    profile.location,
    profile.email,
    profile.executive_summary,
    profile.objective,
    profile.additional_info,
    profile.industry,
    profile.highest_degree,
    skillText,
    experienceText,
    educationText,
  ].some((value) => normalize(value ?? "").includes(query));
}

function scoreCandidate(
  job: ResumeJobRow | null,
  profile: CandidateProfileRow,
) {
  const profileSkills = (profile.skills ?? []).map(normalize);
  const jobSkills = new Set((job?.skills ?? []).map(normalize));
  const overlap = profileSkills.filter((skill) => jobSkills.has(skill)).length;
  const headline = normalize(profile.headline ?? "");
  const titleWords =
    job?.title
      .split(/\s+/)
      .map((word) => normalize(word))
      .filter((word) => word.length > 3) ?? [];
  const titleOverlap = titleWords.some((word) => headline.includes(word));
  const resumeBonus = profile.resume_url ? 5 : 0;

  return Math.min(99, 68 + overlap * 7 + (titleOverlap ? 10 : 0) + resumeBonus);
}

function formatProfileDate(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.length === 7 ? `${value}-01` : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatExperiencePeriod(experience: WorkExperience) {
  const start = formatProfileDate(experience.start_date);
  const end = experience.is_current
    ? "Present"
    : formatProfileDate(experience.end_date);

  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end) return end;

  return "Dates not provided";
}

function splitDescriptionIntoBullets(value: string | null | undefined) {
  const clean = value?.replace(/\s+/g, " ").trim();

  if (!clean) return [];

  const listItems = clean
    .split(/\n|•|(?:^|\s)-\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (listItems.length > 1) return listItems.slice(0, 5);

  return clean
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);
}

function formatEducationPeriod(education: EducationItem) {
  if (education.is_current) {
    return education.start_year
      ? `${education.start_year} – Present`
      : "Currently enrolled";
  }

  if (education.start_year && education.end_year) {
    return `${education.start_year} – ${education.end_year}`;
  }

  if (education.start_year) return String(education.start_year);
  if (education.end_year) return String(education.end_year);

  return "Dates not provided";
}

function formatEducationDegree(education: EducationItem) {
  return [education.degree, education.field_of_study]
    .filter(Boolean)
    .join(", ");
}

function mapCandidate(
  profile: CandidateProfileRow,
  job: ResumeJobRow | null,
  invitedProfileIds: Set<string>,
): ResumeMatch {
  const name = profile.full_name?.trim() || "HireGeneral candidate";

  return {
    id: profile.id,
    profileUserId: profile.user_id,
    name,
    title: profile.headline || "Candidate profile",
    location: profile.location || "Location not provided",
    skills: (profile.skills ?? []).filter(Boolean).slice(0, 8),
    match: scoreCandidate(job, profile),
    openToOffers: true,
    email: profile.email,
    phone: profile.phone,
    summary: getInitialSummary(profile),
    resumeUrl: profile.resume_url,
    resumeViewUrl: null,
    resumeFileName: profile.resume_file_name,
    resumeUploadedAt: profile.resume_uploaded_at,
    invited: invitedProfileIds.has(profile.id),
    experience: (profile.work_experience ?? [])
      .filter((experience) => experience.title || experience.company)
      .map((experience) => ({
        company: experience.company || "Company not provided",
        role: experience.title || "Role not provided",
        period: formatExperiencePeriod(experience),
        location: experience.location || null,
        bullets: splitDescriptionIntoBullets(experience.description),
      })),
    education: (profile.education ?? [])
      .filter((education) => education.school_name || education.degree)
      .map((education) => ({
        school: education.school_name || "School not provided",
        degree: formatEducationDegree(education) || "Degree not provided",
        period: formatEducationPeriod(education),
        description: education.description?.trim() || null,
      })),
    links: (profile.profile_links ?? [])
      .filter((link) => link.url?.trim())
      .map((link) => ({
        label: link.label?.trim() || "Profile link",
        url: link.url.trim(),
      })),
    levelOfExperience: profile.level_of_experience,
    highestDegree: profile.highest_degree,
    industry: profile.industry,
    minimumDesiredPay: profile.minimum_desired_pay,
    openToRelocation: Boolean(profile.open_to_relocation),
  };
}

async function resolveEmployerContext(params: EmployerResumeDatabaseParams) {
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

async function loadEmployerJobs(
  supabase: SupabaseServerClient,
  recruiterId: string,
) {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, skills")
    .eq("recruiter_id", recruiterId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("[loadResumeDatabaseJobs]", error);
    return [];
  }

  return (data ?? []) as ResumeJobRow[];
}

async function loadCandidateProfiles(
  supabase: SupabaseServerClient,
  recruiterId: string,
  params: {
    resumeOnly?: boolean;
    includeRecruiter: boolean;
    publicOnly: boolean;
    limit: number;
  },
) {
  async function runQuery(selectColumns: string) {
    let query = supabase
      .from("profiles")
      .select(selectColumns, { count: "exact" })
      .is("deleted_at", null);

    if (params.publicOnly) {
      query = query.eq("visibility", "public");
    }

    if (!params.includeRecruiter) {
      query = query.neq("user_id", recruiterId);
    }

    if (params.resumeOnly) {
      query = query.not("resume_url", "is", null);
    }

    return query.order("updated_at", { ascending: false }).limit(params.limit);
  }

  const richResult = await runQuery(RICH_PROFILE_SELECT);

  if (!richResult.error) {
    return {
      data: ((richResult.data ?? []) as unknown as CandidateProfileRow[]).map(
        normalizeCandidateProfileRow,
      ),
      count: richResult.count ?? 0,
      error: null,
    };
  }

  const baseResult = await runQuery(BASE_PROFILE_SELECT);

  if (baseResult.error) {
    return {
      data: [],
      count: 0,
      error: baseResult.error,
    };
  }

  return {
    data: ((baseResult.data ?? []) as unknown as CandidateProfileRow[]).map(
      normalizeCandidateProfileRow,
    ),
    count: baseResult.count ?? 0,
    error: null,
  };
}

export async function getEmployerResumeDatabaseData(
  params: EmployerResumeDatabaseParams = {},
): Promise<ResumeDatabaseData> {
  const { supabase, recruiterId } = await resolveEmployerContext(params);

  if (!recruiterId) {
    return {
      jobs: [],
      selectedJobId: null,
      candidates: [],
      totalCandidates: 0,
    };
  }

  const jobs = await loadEmployerJobs(supabase, recruiterId);
  const selectedJob =
    jobs.find((job) => job.id === params.jobId) ?? jobs[0] ?? null;
  const searchTerm = normalizeSearchTerm(params.query) ?? null;
  const limit = Math.min(Math.max(params.limit ?? 60, 1), 100);
  const resumeOnly = params.resumeOnly ?? true;

  const invitePromise = selectedJob
    ? supabase
        .from("employer_candidate_invites")
        .select("candidate_id")
        .eq("recruiter_id", recruiterId)
        .eq("job_id", selectedJob.id)
    : Promise.resolve({ data: [], error: null });

  const profileLimit = searchTerm ? 500 : 250;
  const [initialProfileResult, inviteResult] = await Promise.all([
    loadCandidateProfiles(supabase, recruiterId, {
      resumeOnly,
      includeRecruiter: false,
      publicOnly: true,
      limit: profileLimit,
    }),
    invitePromise,
  ]);

  let profileResult = initialProfileResult;

  if (
    profileResult.data.length === 0 &&
    process.env.NODE_ENV !== "production"
  ) {
    profileResult = await loadCandidateProfiles(supabase, recruiterId, {
      resumeOnly,
      includeRecruiter: true,
      publicOnly: true,
      limit: profileLimit,
    });
  }

  if (profileResult.error) {
    console.error(
      "[getEmployerResumeDatabaseData:profiles]",
      profileResult.error,
    );

    return {
      jobs: jobs.map((job) => ({ id: job.id, title: job.title })),
      selectedJobId: selectedJob?.id ?? null,
      candidates: [],
      totalCandidates: 0,
    };
  }

  if (inviteResult.error) {
    console.error(
      "[getEmployerResumeDatabaseData:invites]",
      inviteResult.error,
    );
  }

  const invitedProfileIds = new Set(
    ((inviteResult.data ?? []) as InviteRow[]).map(
      (invite) => invite.candidate_id,
    ),
  );
  const mappedProfiles = profileResult.data
    .filter((profile) => profileMatches(profile, searchTerm))
    .filter((profile) => Boolean(getStoredResumeUrl(profile.resume_url)))
    .map((profile) => mapCandidate(profile, selectedJob, invitedProfileIds));
  const filteredProfiles = mappedProfiles.sort((a, b) => b.match - a.match);
  const candidatesWithResume = await Promise.all(
    filteredProfiles.map(async (candidate) => ({
      ...candidate,
      resumeViewUrl: await getResumeViewUrl(supabase, candidate.resumeUrl),
    })),
  );
  const candidates = candidatesWithResume
    .filter((candidate) => Boolean(candidate.resumeViewUrl))
    .slice(0, limit);

  return {
    jobs: jobs.map((job) => ({ id: job.id, title: job.title })),
    selectedJobId: selectedJob?.id ?? null,
    candidates,
    totalCandidates: candidatesWithResume.filter((candidate) =>
      Boolean(candidate.resumeViewUrl),
    ).length,
  };
}
