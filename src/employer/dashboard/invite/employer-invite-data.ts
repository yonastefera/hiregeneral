import { createClient } from "@/lib/supabase/server";

import type { InvitePageData, RecommendedCandidate } from "./invite-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type EmployerInviteDataParams = {
  supabase?: SupabaseServerClient;
  recruiterId?: string;
  jobId?: string | null;
};

type InviteJobRow = {
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
  skills: string[] | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function scoreCandidate(
  job: InviteJobRow | null,
  profile: CandidateProfileRow,
) {
  const jobSkills = new Set((job?.skills ?? []).map(normalize));
  const profileSkills = (profile.skills ?? []).map(normalize);
  const overlap = profileSkills.filter((skill) => jobSkills.has(skill)).length;
  const headline = normalize(profile.headline ?? "");
  const titleScore = job?.title
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .some((word) => headline.includes(normalize(word)))
    ? 8
    : 0;

  return Math.min(98, 72 + overlap * 6 + titleScore);
}

function mapCandidate(
  profile: CandidateProfileRow,
  job: InviteJobRow | null,
  invitedProfileIds: Set<string>,
): RecommendedCandidate {
  const skills = (profile.skills ?? []).filter(Boolean).slice(0, 5);

  return {
    id: profile.id,
    profileUserId: profile.user_id,
    name: profile.full_name || "HireGeneral candidate",
    title: profile.headline || "Candidate profile",
    location: profile.location || "Location not provided",
    experience:
      skills.length > 0 ? `${skills.length} listed skills` : "Profile",
    skills,
    match: scoreCandidate(job, profile),
    invited: invitedProfileIds.has(profile.id),
  };
}

async function resolveEmployerContext(params: EmployerInviteDataParams) {
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

export async function getEmployerInviteData(
  params: EmployerInviteDataParams = {},
): Promise<InvitePageData> {
  const { supabase, recruiterId } = await resolveEmployerContext(params);

  if (!recruiterId) {
    return {
      jobs: [],
      selectedJobId: null,
      recommendedCandidates: [],
    };
  }

  const { data: jobRows, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, skills")
    .eq("recruiter_id", recruiterId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (jobsError) {
    console.error("[getEmployerInviteData:jobs]", jobsError);

    return {
      jobs: [],
      selectedJobId: null,
      recommendedCandidates: [],
    };
  }

  const jobs = ((jobRows ?? []) as InviteJobRow[]).map((job) => ({
    id: job.id,
    title: job.title,
  }));
  const selectedJob =
    ((jobRows ?? []) as InviteJobRow[]).find(
      (job) => job.id === params.jobId,
    ) ??
    ((jobRows ?? []) as InviteJobRow[])[0] ??
    null;

  if (!selectedJob) {
    return {
      jobs,
      selectedJobId: null,
      recommendedCandidates: [],
    };
  }

  const [profileResult, inviteResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, user_id, full_name, headline, location, skills")
      .eq("visibility", "public")
      .neq("user_id", recruiterId)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("employer_candidate_invites")
      .select("candidate_id")
      .eq("recruiter_id", recruiterId)
      .eq("job_id", selectedJob.id),
  ]);

  if (profileResult.error) {
    console.error("[getEmployerInviteData:profiles]", profileResult.error);
  }

  if (inviteResult.error) {
    console.error("[getEmployerInviteData:invites]", inviteResult.error);
  }

  const invitedProfileIds = new Set(
    (inviteResult.data ?? []).map((invite) => invite.candidate_id),
  );
  const recommendedCandidates = (
    (profileResult.data ?? []) as CandidateProfileRow[]
  )
    .map((profile) => mapCandidate(profile, selectedJob, invitedProfileIds))
    .sort((a, b) => b.match - a.match)
    .slice(0, 20);

  return {
    jobs,
    selectedJobId: selectedJob.id,
    recommendedCandidates,
  };
}
