import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redisClient: Redis | undefined;

function getRedisClient() {
  redisClient ??= Redis.fromEnv();
  return redisClient;
}

export const redis = new Proxy({} as Redis, {
  get(_target, property) {
    const client = getRedisClient();
    const value = Reflect.get(client, property, client) as unknown;

    return typeof value === "function" ? value.bind(client) : value;
  },
});

function lazyRateLimit(create: () => Ratelimit): Ratelimit {
  let rateLimit: Ratelimit | undefined;

  return new Proxy({} as Ratelimit, {
    get(_target, property) {
      rateLimit ??= create();
      const value = Reflect.get(rateLimit, property, rateLimit) as unknown;

      return typeof value === "function" ? value.bind(rateLimit) : value;
    },
  });
}

export const locationSearchRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(90, "1 m"),
      analytics: true,
      prefix: "ratelimit:locations",
    }),
);

function publicReadLimiter(requests: number, prefix: string) {
  return lazyRateLimit(
    () =>
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, "1 m"),
        analytics: true,
        prefix: `ratelimit:public:${prefix}`,
      }),
  );
}

export const keywordSuggestionRateLimit = publicReadLimiter(90, "keywords");
export const reverseGeocodeRateLimit = publicReadLimiter(30, "reverse-geocode");
export const salaryLookupRateLimit = publicReadLimiter(45, "salaries");
export const schoolSearchRateLimit = publicReadLimiter(90, "schools");
export const publicJobSearchRateLimit = publicReadLimiter(120, "jobs");
export const publicJobDetailRateLimit = publicReadLimiter(180, "job-details");
export const employerCandidateSearchRateLimit = publicReadLimiter(
  120,
  "employer-candidates",
);

export const applicationSubmissionRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "ratelimit:applications",
    }),
);

export const resumeParsingRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:resume-parsing",
    }),
);

export const signupRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(6, "1 h"),
      analytics: true,
      prefix: "ratelimit:auth:signup",
    }),
);

export const passwordResetRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "ratelimit:auth:password-reset",
    }),
);

export const emailOtpRequestRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(6, "1 h"),
      analytics: true,
      prefix: "ratelimit:auth:email-otp-request",
    }),
);

export const emailOtpVerifyRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "15 m"),
      analytics: true,
      prefix: "ratelimit:auth:email-otp-verify",
    }),
);

export const roleSelectionRateLimit = lazyRateLimit(
  () =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:auth:role-selection",
    }),
);

function mutationLimiter(
  requests: number,
  duration: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string,
) {
  return lazyRateLimit(
    () =>
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, duration),
        analytics: true,
        prefix: `ratelimit:mutations:${prefix}`,
      }),
  );
}

export const contactSubmissionRateLimit = mutationLimiter(5, "1 h", "contact");
export const employerCompanyRateLimit = mutationLimiter(
  20,
  "1 h",
  "employer-company",
);
export const employerJobRateLimit = mutationLimiter(30, "1 h", "employer-jobs");
export const employerApplicationRateLimit = mutationLimiter(
  120,
  "1 h",
  "employer-applications",
);
export const employerPipelineRateLimit = mutationLimiter(
  20,
  "1 h",
  "employer-pipeline",
);
export const employerScorecardRateLimit = mutationLimiter(
  60,
  "1 h",
  "scorecards",
);
export const employerTeamRateLimit = mutationLimiter(
  30,
  "1 h",
  "employer-team",
);
export const employerInviteRateLimit = mutationLimiter(
  30,
  "1 h",
  "employer-invites",
);
export const employerMessageRateLimit = mutationLimiter(
  120,
  "1 h",
  "employer-messages",
);
export const employerBillingRateLimit = mutationLimiter(
  10,
  "1 h",
  "employer-billing",
);
export const employerExportRateLimit = mutationLimiter(
  10,
  "24 h",
  "employer-exports",
);
export const savedJobRateLimit = mutationLimiter(120, "1 h", "saved-jobs");
export const savedSearchRateLimit = mutationLimiter(
  60,
  "1 h",
  "saved-searches",
);
export const notificationSettingsRateLimit = mutationLimiter(
  30,
  "1 h",
  "notification-settings",
);
export const ingestionRateLimit = mutationLimiter(4, "10 m", "ingestion");
export const adminSeedRateLimit = mutationLimiter(4, "1 h", "admin-seed");
export const passwordUpdateRateLimit = mutationLimiter(
  10,
  "1 h",
  "password-update",
);
export const userMessageRateLimit = mutationLimiter(
  120,
  "1 h",
  "user-messages",
);
export const accountDeletionRateLimit = mutationLimiter(
  3,
  "24 h",
  "account-deletion",
);
export const accountExportRateLimit = mutationLimiter(
  5,
  "24 h",
  "account-export",
);
export const accountPrivacyRateLimit = mutationLimiter(
  20,
  "1 h",
  "account-privacy",
);
