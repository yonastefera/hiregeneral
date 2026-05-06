export type JobSourceType = "greenhouse" | "lever" | "workday";

export type JobSource = {
  companyName: string;
  sourceType: JobSourceType;
  sourceSlug: string;
  sourceUrl?: string;
  enabled: boolean;
};

export const JOB_SOURCES: JobSource[] = [
  {
    companyName: "Stripe",
    sourceType: "greenhouse",
    sourceSlug: "stripe",
    sourceUrl: "https://boards.greenhouse.io/stripe",
    enabled: true,
  },

  //   {
  //     companyName: "PostHog",
  //     sourceType: "lever",
  //     sourceSlug: "posthog",
  //     sourceUrl: "https://jobs.lever.co/posthog",
  //     enabled: true,
  //   },

  // Keep Workday disabled for now.
  // We are not building the Workday parser in the first version.
  {
    companyName: "Wells Fargo",
    sourceType: "workday",
    sourceSlug: "WellsFargoJobs",
    sourceUrl: "https://wf.wd1.myworkdayjobs.com/WellsFargoJobs",
    enabled: false,
  },
];

export function getEnabledJobSources() {
  return JOB_SOURCES.filter((source) => source.enabled);
}
