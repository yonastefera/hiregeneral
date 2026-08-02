import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const locationSearchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(90, "1 m"),
  analytics: true,
  prefix: "ratelimit:locations",
});

export const applicationSubmissionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "ratelimit:applications",
});

export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, "1 h"),
  analytics: true,
  prefix: "ratelimit:auth:signup",
});

export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:auth:password-reset",
});

export const roleSelectionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:auth:role-selection",
});

function mutationLimiter(
  requests: number,
  duration: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string,
) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, duration),
    analytics: true,
    prefix: `ratelimit:mutations:${prefix}`,
  });
}

export const contactSubmissionRateLimit = mutationLimiter(5, "1 h", "contact");
export const employerCompanyRateLimit = mutationLimiter(
  20,
  "1 h",
  "employer-company",
);
export const employerJobRateLimit = mutationLimiter(30, "1 h", "employer-jobs");
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
export const savedJobRateLimit = mutationLimiter(120, "1 h", "saved-jobs");
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

export { redis };
