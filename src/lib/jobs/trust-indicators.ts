export type JobTrustIndicator = {
  label: string;
  tone: "fresh" | "trusted" | "neutral";
};

export function getJobTrustIndicators(job: {
  applyUrl?: string;
  postedDaysAgo: number;
  sourceName?: string;
}) {
  const indicators: JobTrustIndicator[] = [];

  if (job.postedDaysAgo <= 1) {
    indicators.push({ label: "Fresh posting", tone: "fresh" });
  } else if (job.postedDaysAgo <= 7) {
    indicators.push({ label: "Posted this week", tone: "fresh" });
  }

  if (!job.applyUrl) {
    indicators.push({ label: "Apply on HireGeneral", tone: "trusted" });
  } else if (job.sourceName) {
    indicators.push({ label: "Company application", tone: "trusted" });
  } else {
    indicators.push({ label: "External application", tone: "neutral" });
  }

  return indicators.slice(0, 2);
}
