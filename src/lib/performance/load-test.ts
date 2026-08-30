export type LoadSample = {
  durationMs: number;
  ok: boolean;
  route: string;
  status: number;
};

export type LoadSummary = {
  errorRate: number;
  failed: number;
  p50Ms: number;
  p95Ms: number;
  requests: number;
};

export function percentile(values: number[], quantile: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(
    0,
    Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1),
  );
  return sorted[index];
}

export function summarizeLoad(samples: LoadSample[]): LoadSummary {
  const failed = samples.filter((sample) => !sample.ok).length;
  const durations = samples.map((sample) => sample.durationMs);

  return {
    requests: samples.length,
    failed,
    errorRate: samples.length === 0 ? 0 : failed / samples.length,
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
  };
}

export function assertSafeLoadTarget(
  rawTarget: string,
  options: { allowRemote?: boolean; confirmNonProduction?: boolean } = {},
) {
  const target = new URL(rawTarget);
  const hostname = target.hostname.toLowerCase();
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  const productionDomain =
    hostname === "hiregeneral.com" || hostname.endsWith(".hiregeneral.com");

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Load-test target must use HTTP or HTTPS.");
  }
  if (target.username || target.password) {
    throw new Error("Load-test target must not contain credentials.");
  }
  if (productionDomain) {
    throw new Error("Refusing to load test the HireGeneral production domain.");
  }
  if (!options.confirmNonProduction) {
    throw new Error(
      "Load tests require explicit confirmation that the app and its database are non-production.",
    );
  }
  if (!local && (!options.allowRemote || !options.confirmNonProduction)) {
    throw new Error(
      "Remote load tests require explicit non-production confirmation.",
    );
  }

  return target;
}

export function thresholdsPassed(
  summary: LoadSummary,
  thresholds: { maxErrorRate: number; maxP95Ms: number },
) {
  return (
    summary.errorRate <= thresholds.maxErrorRate &&
    summary.p95Ms <= thresholds.maxP95Ms
  );
}
