# Production service objectives

These launch objectives define what HireGeneral considers healthy. They are
initial operating targets, not contractual customer guarantees. Review them
monthly and tighten them only after enough production traffic exists to measure
real baselines.

| Service signal          | Objective                                                          | Warning threshold                                       | Primary evidence                                          |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------- |
| Public availability     | 99.9% per calendar month                                           | Any failed `/api/health` check                          | External uptime check and Vercel logs                     |
| Public job search       | 95% of requests below 1.5 seconds                                  | p95 above 1.5 seconds for 10 minutes or errors above 5% | `operation_completed`, `operation_failed`, and load tests |
| Application submission  | 99% server success excluding validation and authorization failures | Success below 95% or any sustained 5xx burst            | Application operation logs                                |
| Active job freshness    | At least one active job posted within 72 hours                     | Latest active job exceeds 72 hours                      | Admin operations dashboard                                |
| Ingestion               | Successful run within 24 hours, no open dead letters               | Any failed run, open dead letter, or stale success      | Admin operations and source dashboards                    |
| Saved-search alerts     | Due processing within 48 hours beyond the configured interval      | Any alert remains overdue beyond that window            | Admin operations dashboard and alert logs                 |
| Database responsiveness | Operational query group below 1 second                             | At or above 1 second                                    | Admin operations dashboard                                |

## Monitoring setup

1. Configure a free external uptime monitor to request `/api/health` every five
   minutes. Treat HTTP 503 or a timeout as a failure. The response deliberately
   exposes no credentials, record counts, or provider diagnostics.
2. Use Vercel Observability searches for `event=operation_failed`,
   `event=health_check`, and `event=metric`. Alert on sustained failures rather
   than user validation or authorization outcomes.
3. Review `/admin-control-center` after deployment and daily during launch. Use
   `/admin-control-center/sources` for ingestion source diagnosis.
4. Record the release, start time, affected objective, request IDs, and recovery
   time for every incident.

## Error-budget response

- At 50% monthly error-budget consumption, pause nonessential reliability-risk
  releases and investigate the dominant failure category.
- At 100%, prioritize reliability work until the rolling window is healthy.
- Do not hide incidents by weakening thresholds. Change an objective only in a
  reviewed update supported by production evidence.
