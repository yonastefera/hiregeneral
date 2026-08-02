# Service-role usage review

Reviewed: 2026-08-02

The Supabase service-role key bypasses Row Level Security. It is restricted to
server-only modules, controlled operational scripts, and workflows that require
privileged Auth, Storage, ingestion, billing, or aggregate access.

## Approved application uses

| Area                                                     | Reason privileged access is required                                 | Boundary                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Auth signup, reset, role assignment, and password update | Supabase Auth admin link/user operations and atomic initial-role RPC | Bounded, rate-limited auth routes; role RPC grants only `service_role` |
| OAuth callback                                           | Completes initial role assignment after verified callback            | Trusted callback origin and signed Auth exchange                       |
| Stripe webhook and security audit helper                 | Billing mutations and service-role-only event/audit RPCs             | Verified Stripe signature, atomic claim token, bounded payload         |
| Contact submission                                       | Inserts into a table with no public insert policy                    | Validated, rate-limited, honeypot and duplicate cooldown               |
| Employer resume signing                                  | Creates short-lived URLs after recruiter authorization               | Application/profile ownership checks; five-minute URL                  |
| Job ingestion and monitor                                | Writes imported jobs and operational run records                     | Cron/shared-secret authentication and rate limiting                    |
| Home/statistics aggregates                               | Reads restricted company/aggregate data without exposing rows        | Server-only fixed projections and aggregate responses                  |
| Hiring-company aggregate                                 | Executes the fixed public landing-page aggregate RPC                 | Server-only cached aggregate response                                  |
| Privileged school import                                 | Administrative reference-data upserts                                | Administrative secret, rate limit, and audit event                     |

## Approved operational uses

- Location, school, and BLS reference-data seed scripts.
- Job-source discovery, ingestion-run tracking, and imported-job upserts.

These scripts are not browser-bundled and must only be run against an explicitly
selected Supabase project.

## Removed during this review

- Public jobs list and job-detail routes now use the anonymous Supabase client.
- The public salary endpoint now uses the anonymous Supabase client.
- Password-recovery cookie signatures now use `AUTH_RECOVERY_SECRET` rather
  than coupling cookie integrity to the Supabase service-role key.

## Rules for future use

1. Never import the administrative client into a Client Component.
2. Prefer the authenticated server client and RLS first, then the anonymous
   client for public data.
3. Every new service-role call must document why RLS cannot express the access.
4. Service-role mutations require authentication or a verified external secret,
   validation, safe errors, rate or replay controls, and audit coverage.
5. Never log service keys, bearer tokens, signed URLs, provider payloads, or
   personal data.
