export type HealthStatus = "healthy" | "degraded" | "unavailable";

export type OperationalCheck = {
  name: string;
  status: HealthStatus;
  summary: string;
  observedAt?: string | null;
  value?: number;
  target?: string;
};

export type OperationsSnapshot = {
  status: HealthStatus;
  checkedAt: string;
  checks: OperationalCheck[];
};

export const OPERATIONS_THRESHOLDS = {
  databaseLatencyMs: 1_000,
  jobFreshnessHours: 72,
  ingestionFreshnessHours: 24,
  alertBacklogHours: 48,
} as const;

export function ageInHours(value: string | null, now: Date) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, (now.getTime() - timestamp) / 3_600_000);
}

export function overallHealth(checks: OperationalCheck[]): HealthStatus {
  if (checks.some((check) => check.status === "unavailable")) {
    return "unavailable";
  }
  if (checks.some((check) => check.status === "degraded")) {
    return "degraded";
  }
  return "healthy";
}

export function freshnessCheck(input: {
  name: string;
  latestAt: string | null;
  now: Date;
  thresholdHours: number;
  missingSummary: string;
}): OperationalCheck {
  const ageHours = ageInHours(input.latestAt, input.now);

  if (ageHours === null) {
    return {
      name: input.name,
      status: "degraded",
      summary: input.missingSummary,
      observedAt: input.latestAt,
      target: `< ${input.thresholdHours} hours`,
    };
  }

  return {
    name: input.name,
    status: ageHours <= input.thresholdHours ? "healthy" : "degraded",
    summary: `${Math.round(ageHours)} hours since the latest event`,
    observedAt: input.latestAt,
    value: Math.round(ageHours),
    target: `< ${input.thresholdHours} hours`,
  };
}
