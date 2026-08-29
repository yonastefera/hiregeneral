import type { JobSource } from "./job-sources";

const DEFAULT_MIN_BASELINE_JOBS = 10;
const DEFAULT_MIN_VOLUME_RATIO = 0.5;

export type IngestionVolumeDecision = {
  allowStaleExpiration: boolean;
  reason: string | null;
};

function metadataNumber(source: JobSource, key: string, fallback: number) {
  const value = source.metadata[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function evaluateIngestionVolume(params: {
  source: JobSource;
  currentValidJobs: number;
  previousValidJobs?: number | null;
  publishedJobs?: number | null;
}): IngestionVolumeDecision {
  const { source, currentValidJobs } = params;
  const baseline = Math.max(
    params.previousValidJobs ?? 0,
    params.publishedJobs ?? 0,
  );
  const minimumBaseline = metadataNumber(
    source,
    "staleExpirationMinBaseline",
    DEFAULT_MIN_BASELINE_JOBS,
  );
  const minimumRatio = Math.min(
    metadataNumber(source, "staleExpirationMinRatio", DEFAULT_MIN_VOLUME_RATIO),
    1,
  );

  if (baseline < minimumBaseline) {
    return { allowStaleExpiration: true, reason: null };
  }

  const ratio = baseline === 0 ? 1 : currentValidJobs / baseline;
  if (ratio >= minimumRatio) {
    return { allowStaleExpiration: true, reason: null };
  }

  return {
    allowStaleExpiration: false,
    reason: `Stale expiration skipped: ${currentValidJobs} valid jobs is ${(ratio * 100).toFixed(1)}% of the ${baseline}-job baseline.`,
  };
}
