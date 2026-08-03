# Mutation security boundaries

Reviewed: 2026-08-02

| Mutation area                        | Authentication and authorization                              | Validation and size         | Abuse control                            | Safe error and audit boundary                     |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------- | ---------------------------------------- | ------------------------------------------------- |
| Application submission               | Supabase user, owned resume path, eligible published job, RLS | Zod, 32 KiB                 | 20/hour                                  | Generic errors; application ownership trigger     |
| Signup and password reset/update     | Public eligibility response or verified recovery session      | Zod, 8 KiB                  | IP/email limits and duplicate cooldown   | Redacted auth logs and role audit                 |
| Role selection                       | Authenticated user and atomic role RPC                        | Zod, 8 KiB                  | 10/hour                                  | Generic errors and role audit                     |
| Employer company and jobs            | Employer role, owner/recruiter RLS                            | Zod, 8–64 KiB               | Endpoint limits                          | Generic errors; company/job audit triggers        |
| Employer invitations                 | Employer role, owned published job, public candidate          | Zod, 8 KiB                  | 30/hour and duplicate cooldown           | Generic errors and invitation audit trigger       |
| Employer and job-seeker messaging    | Conversation participant RLS                                  | Zod, 8 KiB                  | 120/hour and duplicate cooldown          | Generic errors; immutable sent content            |
| Billing checkout and portal          | Employer role and owned company                               | Zod where applicable, 8 KiB | 10/hour                                  | Generic Stripe errors and billing audit triggers  |
| Stripe webhook                       | Stripe signature and service-role RPC grants                  | Raw body, 256 KiB           | Atomic claim token and replay protection | Generic errors and billing audit trail            |
| Contact                              | Public, honeypot                                              | Zod, 8 KiB                  | 5/hour and duplicate cooldown            | Generic errors; administrative table access only  |
| Saved jobs and notification settings | Authenticated owner and RLS                                   | Zod, 8 KiB                  | Endpoint limits                          | Generic errors                                    |
| Account deletion request             | Authenticated profile owner and RLS                           | No request body             | 3/day                                    | Generic errors and account-deletion audit trigger |
| Ingestion and school import          | Cron/shared or administrative secret                          | Query/header validation     | Operational limits                       | Generic errors and privileged-action audit        |

Employer jobs, public candidate sourcing, invitations, outbound messaging,
boost credits, and premium analytics also require the server entitlement
snapshot and remain protected by database triggers or RLS against direct and
concurrent bypasses.

## Intentional exceptions

- Signout is not rate limited because preventing a user from terminating their
  session would weaken security. It mutates only the caller's session.
- Stripe webhooks use signature verification and atomic replay claims rather
  than an IP rate limit, which could block legitimate provider retries.
- User profile editing and owned storage uploads use the authenticated Supabase
  client directly. Their authorization boundary is RLS/storage policy plus the
  profile identity trigger; server routes are required for privileged reads,
  messaging, application submission, and account deletion.
