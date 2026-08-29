import type { ImportedJob } from "./normalize";

export type ApplyLinkIssue = {
  sourceId: string;
  applyUrl: string;
  reason: "unsafe_url" | "not_found" | "unreachable";
  status: number | null;
};

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
];

export function isSafeApplyUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))
    );
  } catch {
    return false;
  }
}

async function probeApplyUrl(job: ImportedJob, timeoutMs: number) {
  if (!isSafeApplyUrl(job.applyUrl)) {
    return {
      sourceId: job.sourceId,
      applyUrl: job.applyUrl,
      reason: "unsafe_url" as const,
      status: null,
    };
  }

  try {
    let currentUrl = job.applyUrl;
    let response: Response | null = null;

    for (let redirect = 0; redirect <= 3; redirect += 1) {
      if (!isSafeApplyUrl(currentUrl)) {
        return {
          sourceId: job.sourceId,
          applyUrl: currentUrl,
          reason: "unsafe_url" as const,
          status: null,
        };
      }

      response = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": "HireGeneral-LinkValidator/1.0" },
      });
      const location = response.headers.get("location");

      if (response.status < 300 || response.status >= 400 || !location) break;
      currentUrl = new URL(location, currentUrl).toString();
    }

    if (!response) throw new Error("No apply-link response");

    if (response.status === 404 || response.status === 410) {
      return {
        sourceId: job.sourceId,
        applyUrl: job.applyUrl,
        reason: "not_found" as const,
        status: response.status,
      };
    }

    if (response.status >= 500) {
      return {
        sourceId: job.sourceId,
        applyUrl: job.applyUrl,
        reason: "unreachable" as const,
        status: response.status,
      };
    }

    return null;
  } catch {
    return {
      sourceId: job.sourceId,
      applyUrl: job.applyUrl,
      reason: "unreachable" as const,
      status: null,
    };
  }
}

export async function validateApplyLinks(
  jobs: ImportedJob[],
  options?: { probeLimit?: number; timeoutMs?: number; concurrency?: number },
) {
  const unsafeIssues = jobs
    .filter((job) => !isSafeApplyUrl(job.applyUrl))
    .map<ApplyLinkIssue>((job) => ({
      sourceId: job.sourceId,
      applyUrl: job.applyUrl,
      reason: "unsafe_url",
      status: null,
    }));
  const safeJobs = jobs.filter((job) => isSafeApplyUrl(job.applyUrl));
  const probeLimit = Math.max(0, options?.probeLimit ?? 20);
  const candidates = safeJobs.slice(0, probeLimit);
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 5, 10));
  const probeIssues: ApplyLinkIssue[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < candidates.length) {
      const index = nextIndex++;
      const issue = await probeApplyUrl(
        candidates[index],
        options?.timeoutMs ?? 5_000,
      );
      if (issue) probeIssues.push(issue);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, candidates.length) }, worker),
  );

  const permanentlyInvalidIds = new Set(
    [...unsafeIssues, ...probeIssues]
      .filter((issue) => issue.reason !== "unreachable")
      .map((issue) => issue.sourceId),
  );

  return {
    jobs: safeJobs.filter((job) => !permanentlyInvalidIds.has(job.sourceId)),
    issues: [...unsafeIssues, ...probeIssues],
    checked: candidates.length + unsafeIssues.length,
  };
}
