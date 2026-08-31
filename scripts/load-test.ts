import { performance } from "node:perf_hooks";
import process from "node:process";

import {
  assertSafeLoadTarget,
  summarizeLoad,
  thresholdsPassed,
  type LoadSample,
} from "../src/lib/performance/load-test";

const routes = [
  "/api/jobs?page=1&pageSize=20",
  "/api/jobs?query=engineer&page=1&pageSize=20",
  "/api/jobs?location=New%20York&page=1&pageSize=20",
] as const;

function boundedInteger(
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function boundedNumber(
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
  return value;
}

async function main() {
  const target = assertSafeLoadTarget(
    process.env.LOAD_TEST_BASE_URL ?? "http://127.0.0.1:3000",
    {
      allowRemote: process.env.LOAD_TEST_ALLOW_REMOTE === "1",
      confirmNonProduction:
        process.env.LOAD_TEST_CONFIRM_NON_PRODUCTION === "1",
    },
  );
  const requestCount = boundedInteger("LOAD_TEST_REQUESTS", 60, 1, 1_000);
  const concurrency = boundedInteger("LOAD_TEST_CONCURRENCY", 6, 1, 50);
  const timeoutMs = boundedInteger("LOAD_TEST_TIMEOUT_MS", 10_000, 500, 30_000);
  const maxP95Ms = boundedNumber("LOAD_TEST_MAX_P95_MS", 1_500, 1, 30_000);
  const maxErrorRate = boundedNumber("LOAD_TEST_MAX_ERROR_RATE", 0.05, 0, 1);
  const samples: LoadSample[] = [];
  let nextRequest = 0;

  console.log(`Warming ${routes.length} routes before measured traffic`);
  for (const route of routes) {
    const startedAt = performance.now();
    const response = await fetch(new URL(route, target), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.arrayBuffer();
    const durationMs = Math.round(performance.now() - startedAt);
    console.log(`Warmup ${route} status=${response.status} ${durationMs}ms`);
    if (!response.ok) {
      throw new Error(
        `Warmup failed for ${route} with status ${response.status}.`,
      );
    }
  }

  async function runWorker() {
    while (nextRequest < requestCount) {
      const requestIndex = nextRequest++;
      const route = routes[requestIndex % routes.length];
      const startedAt = performance.now();
      let status = 0;
      let ok = false;

      try {
        const response = await fetch(new URL(route, target), {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
        });
        status = response.status;
        ok = response.ok;
        await response.arrayBuffer();
      } catch {
        ok = false;
      }

      samples.push({
        durationMs: Math.round(performance.now() - startedAt),
        ok,
        route,
        status,
      });
    }
  }

  console.log(
    `Load-test target ${target.origin}: ${requestCount} requests at concurrency ${concurrency}`,
  );
  await Promise.all(
    Array.from({ length: Math.min(concurrency, requestCount) }, () =>
      runWorker(),
    ),
  );

  for (const route of routes) {
    const summary = summarizeLoad(
      samples.filter((sample) => sample.route === route),
    );
    console.log(
      `${route} requests=${summary.requests} failed=${summary.failed} p50=${summary.p50Ms}ms p95=${summary.p95Ms}ms`,
    );
  }

  const summary = summarizeLoad(samples);
  const passed = thresholdsPassed(summary, { maxErrorRate, maxP95Ms });
  console.log(
    `Overall requests=${summary.requests} errors=${(summary.errorRate * 100).toFixed(1)}% p50=${summary.p50Ms}ms p95=${summary.p95Ms}ms`,
  );
  console.log(
    `Thresholds p95<=${maxP95Ms}ms errors<=${(maxErrorRate * 100).toFixed(1)}%: ${passed ? "PASS" : "FAIL"}`,
  );

  if (!passed) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Load test failed.");
  process.exitCode = 1;
});
