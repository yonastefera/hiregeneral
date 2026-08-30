import "server-only";

import { analyzeRecordedWorkHistory } from "@/lib/career/work-history";
import { createClient } from "@/lib/supabase/server";

export type SkillOpportunity = {
  skillId: string;
  name: string;
  category: string;
  relationshipWeight: number;
  activeJobs: number;
};

export type CareerInsightsData = {
  career: string;
  location: string;
  history: ReturnType<typeof analyzeRecordedWorkHistory>;
  skillOpportunities: SkillOpportunity[];
};

function skillOpportunities(value: unknown): SkillOpportunity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    if (
      typeof record.skillId !== "string" ||
      typeof record.name !== "string" ||
      typeof record.category !== "string" ||
      typeof record.relationshipWeight !== "number" ||
      typeof record.activeJobs !== "number"
    ) {
      return [];
    }
    return [record as SkillOpportunity];
  });
}

export async function getCareerInsightsData(): Promise<CareerInsightsData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: opportunities, error }] = await Promise.all(
    [
      supabase
        .from("profiles")
        .select("headline, location, work_experience")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.rpc("current_profile_skill_opportunities"),
    ],
  );

  return {
    career: profile?.headline?.trim() ?? "",
    location: profile?.location?.trim() ?? "",
    history: analyzeRecordedWorkHistory(profile?.work_experience),
    skillOpportunities: error ? [] : skillOpportunities(opportunities),
  };
}
