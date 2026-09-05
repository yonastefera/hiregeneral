import "server-only";

import { cache } from "react";

import type { Job } from "@/lib/db/types";
import {
  explainJobMatch,
  type JobMatchExplanation,
  type MatchProfile,
} from "@/lib/jobs/match-explanation";
import {
  loadPublicJobDetail,
  loadRelatedPublicJobs,
} from "@/lib/jobs/public-job-detail";
import { createClient } from "@/lib/supabase/server";

type JobDetailsPageData = {
  job: Job | null;
  matchExplanation: JobMatchExplanation | null;
  related: Job[];
};

export const getPublicJobDetail = cache(loadPublicJobDetail);

export async function getJobDetailsPageData(
  jobId: string,
): Promise<JobDetailsPageData> {
  const job = await getPublicJobDetail(jobId);

  if (!job) {
    return {
      job: null,
      matchExplanation: null,
      related: [],
    };
  }

  const related = await loadRelatedPublicJobs(job);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let matchExplanation: JobMatchExplanation | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("headline, level_of_experience, location, skills")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile) {
      matchExplanation = explainJobMatch(profile as MatchProfile, job);
    }
  }

  return {
    job,
    matchExplanation,
    related,
  };
}
