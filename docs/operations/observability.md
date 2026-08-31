# HireGeneral observability

HireGeneral emits one-line JSON logs so production events can be searched in
Vercel Observability without forwarding applicant data to another service. The
shared logger adds `event`, `level`, `environment`, `release`, and `timestamp`.
Request operations also include `requestId`, `route`, `operation`, `durationMs`,
and, only where appropriate, `userId`, `errorCategory`, and `externalProvider`.

Never log request bodies, passwords, cookies, authorization headers, OTPs,
tokens, resume paths or content, applicant notes, email addresses, phone
numbers, demographic data, or provider payloads. The redactor is defense in
depth; callers must still pass only the minimum metadata needed to diagnose an
operation.

## Events and metrics

Search JSON logs for `event=operation_failed` to find failures and correlate
them using `requestId`. `event=metric` records counters or timings. Initial
production dashboards and alerts should cover:

| Signal                         | Event or source                     | Initial alert condition                                  |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------- |
| Search latency/error rate      | jobs API operations                 | p95 over 1.5 seconds or errors over 5% for 10 minutes    |
| Zero-result searches           | `metric=search_zero_results`        | investigate sustained increases, not individual searches |
| Application completion/failure | application operations              | any 5xx burst or success rate below 95%                  |
| Signup/OTP confirmation        | auth OTP operations                 | failure rate over 10% for 15 minutes                     |
| Reset-email failures           | Resend provider failure             | any sustained failure for 10 minutes                     |
| Job publication                | employer job operations             | unexpected fall to zero during normal traffic            |
| Stripe webhooks                | Stripe operation failures           | any verification/processing backlog or repeated failure  |
| ATS freshness                  | ingestion monitor                   | source outside its freshness SLA                         |
| Job lifecycle                  | ingestion summary                   | unusual imported/rejected/expired change                 |
| Redis availability             | rate-limit/cache unavailable events | more than 3 events in 5 minutes                          |
| Supabase latency               | database operation duration         | p95 over 1 second for 10 minutes                         |

Do not alert on a single user validation or authorization failure. Those are
expected product outcomes. Alert on server, database, provider, freshness, and
backlog failures.

## Release verification

Vercel supplies `VERCEL_ENV` and `VERCEL_GIT_COMMIT_SHA`; local development
falls back to `NODE_ENV` and `local`. After deployment, generate one safe test
request and confirm the resulting log contains the deployed commit SHA and a
request ID. Keep Vercel Analytics consent-gated; operational server logs do not
depend on analytics consent.

## Error-monitoring provider

Vercel Observability is the launch monitoring platform and keeps the initial
configuration inside the existing hosting free tier. Before traffic or support
needs outgrow its retention and alerting capabilities, evaluate a dedicated
error monitor. Any future provider must receive redacted metadata only and must
be added to the subprocessor disclosure before activation.

The measurable launch targets, health endpoint, escalation thresholds, and
error-budget response are defined in
[`service-level-objectives.md`](./service-level-objectives.md).
