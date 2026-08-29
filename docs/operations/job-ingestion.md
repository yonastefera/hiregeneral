# Job ingestion operations

The ingestion endpoint is an orchestrator. It authenticates the request, loads
enabled sources, applies optional source filters, and runs independent source
workers with bounded concurrency. A failure in one source does not stop the
other sources.

## Execution controls

Global controls:

- `INGEST_SOURCE_CONCURRENCY` defaults to `3` and is capped at `10`.
- `INGEST_SOURCE_TIMEOUT_MS` defaults to `90000` for each attempt.
- `INGEST_MAX_ATTEMPTS` defaults to `3` and is capped at `5`.

A source's `metadata` can override:

- `sourceTimeoutMs`
- `maxAttempts`
- `detailEnhancementConcurrency` (maximum `8`)
- `enhanceDetails`
- `validateApplyLinks`
- `applyLinkValidationLimit` (default `20`)
- `applyLinkTimeoutMs` (default `5000`)
- `staleExpirationMinBaseline`
- `staleExpirationMinRatio`

Keep concurrency conservative. Each source worker can also perform detail-page
and apply-link requests, so increasing all three concurrency settings together
can overload ATS providers or exhaust a serverless execution window.

## Publication lifecycle

Each source follows one lifecycle:

1. Create a source-level ingestion run.
2. Fetch and optionally enhance jobs with bounded retries and a timeout.
3. Reject malformed, already-expired, implausibly future, unsafe-link, and
   confirmed 404/410 jobs.
4. Record transient apply-link failures as quality issues without removing the
   job.
5. Evaluate the ingestion-volume guard.
6. Write the validated snapshot to `job_ingestion_staging`.
7. Call `publish_job_ingestion_stage`, which upserts the snapshot and, when the
   volume guard permits it, closes stale jobs in one database transaction.
8. Finish the run and resolve earlier open dead letters for that source.

Only one `running` row is allowed per source. This prevents overlapping cron or
manual requests from publishing the same source concurrently.

## Retries and dead letters

Provider fetching is retried with capped exponential backoff. After attempts
are exhausted, the worker records an open row in
`job_ingestion_dead_letters`, marks the run failed, and continues processing
other sources. A later successful run resolves open dead letters for the same
source.

Use `/admin-control-center/sources` to review retries, open dead letters,
rejection rates, apply-link issues, stale running jobs, and source-level job
counts. Retry an individual source through the authenticated ingestion endpoint
with `?sourceSlug=...`; do not edit dead-letter rows manually.

## Deployment order

Apply `20260829043000_scalable_job_ingestion.sql` before deploying the worker
code. Take the paired encrypted database and Storage backup first. Verify the
migration on the dedicated test project, then run one low-volume source and
confirm:

- the run reaches `success`;
- staging rows are removed after publication;
- `published_at`, retry counts, and quality metrics are populated;
- live jobs change together with stale-job closure;
- the monitor reports no unexpected dead letter.
