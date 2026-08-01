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

export { redis };
