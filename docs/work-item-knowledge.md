# HireGeneral work-item knowledge

This is the engineering entry point for every HireGeneral work item. Read the
sections relevant to the change before editing code, then use the completion
checklist before handing the work off. This guide summarizes the repository's
current rules; the linked source documents remain authoritative when more
detail is needed.

## Product and architecture

HireGeneral is a two-sided hiring marketplace. It includes public job search
and salary data, job-seeker profiles and applications, employer job and
candidate management, paid subscriptions, messaging, and automated job
ingestion.

The application uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS,
Supabase Auth/PostgreSQL/Storage, Stripe, Resend, Upstash Redis, Vitest, and
Playwright. Vercel is the intended runtime and invokes scheduled ingestion.

Primary code areas:

| Area                 | Responsibility                                                |
| -------------------- | ------------------------------------------------------------- |
| `src/app`            | Routes, layouts, pages, and API handlers                      |
| `src/home`           | Public home search and market insights                        |
| `src/job-seekers`    | Seeker account, profile, search, applications, and messages   |
| `src/employer`       | Employer landing pages, profile, and dashboard                |
| `src/lib/supabase`   | Typed browser, server, and administrative clients             |
| `src/lib/ingest`     | ATS adapters, normalization, validation, and upserts          |
| `src/lib/migrations` | Canonical, forward-only database migration history            |
| `src/emails`         | Transactional email templates                                 |
| `scripts`            | Imports, migration checks, backups, and operational utilities |

## Rules that apply to every work item

1. Read the relevant documentation in this repository before changing an area.
2. Before writing Next.js code, read the relevant guide under
   `node_modules/next/dist/docs/`. This repository uses a version whose APIs
   and conventions may differ from prior Next.js knowledge. Follow its current
   deprecations and conventions.
3. Treat authentication, authorization, consent, entitlements, and privacy as
   server/database boundaries. UI visibility is never an authorization control.
4. Prefer the least-privileged Supabase client: authenticated client plus RLS
   for user-owned data, anonymous client for public data, and service role only
   when the access cannot be expressed safely through RLS.
5. Validate mutation input, bound request sizes, rate-limit or replay-protect
   the operation, return safe errors, and add audit coverage when required.
6. Never expose or log secrets, bearer tokens, signed URLs, provider payloads,
   resumes, contact details, application notes, employment history, demographic
   data, or other personal data. Keep privileged environment variables on the
   server and never expose them with a `NEXT_PUBLIC_` prefix.
7. Do not run production ingestion, seeds, migration experiments, RLS tests, or
   authenticated browser tests against production. Use a disposable dedicated
   project and verify the target before executing operational scripts.
8. Keep changes scoped and add regression coverage at the lowest useful layer.
   Security-sensitive changes normally require negative authorization tests in
   addition to successful-path tests.

## Authentication and authorization model

Public authentication is passwordless and email-first. `/signin`, `/signup`,
and `/forgot-password` send a six-digit Supabase email OTP. Successful users
are routed by stored role; users without a role continue to
`/auth/choose-role`. Google OAuth remains an alternative. Legacy password
endpoints exist only for recovery compatibility and rollback safety.

The system must not reveal whether an account exists. Invalid and expired OTPs
use the same safe error. Resend cooldown is 60 seconds, and repeated requests
must be rate-limited. A session cookie is issued only after successful code
verification.

Authorization principles:

- Job seekers may access their own profile, storage, applications, settings,
  exports, and deletion workflow through the applicable RLS/server boundary.
- Recruiters may manage only companies/jobs they own or are authorized for and
  may access applicants only for their own jobs.
- Public candidate discovery requires both explicit candidate consent and an
  eligible employer plan.
- Conversation content is visible only to participants, except documented
  administrator support, security, or legal access.
- Administrators may bypass employer plan limits, but privileged actions still
  require a documented, audited server boundary.

See [email OTP authentication](security/email-otp-authentication.md),
[mutation boundaries](security/mutation-boundaries.md), and
[service-role review](security/service-role-review.md).

## Employer entitlements

Entitlements come from `public.current_employer_entitlements()` and are
enforced again with triggers and RLS. Never rely only on disabled buttons,
hidden navigation, or a server snapshot.

| Capability                  | Starter/inactive | Active Growth | Active Pro |
| --------------------------- | ---------------: | ------------: | ---------: |
| Public resume database      |               No |           Yes |        Yes |
| Invitations per month       |                0 |           100 |      1,000 |
| Employer messages per month |               50 |           500 |      5,000 |
| Premium analytics           |               No |            No |        Yes |

Active job limits come from the company. Boosts consume stored credits.
Subscription states other than `active` or `trialing` receive Starter
entitlements. Recruiters on every plan retain access to applicants for their
own jobs.

See [employer entitlements](security/employer-entitlements.md).

## Privacy and sensitive data

Candidate profiles are private by default. Employer discovery is opt-in and
requires both `visibility = 'public'` and `employer_access_consent_at`.
Revocation immediately makes the profile private and clears the consent
timestamp. Changing discovery visibility does not retract an application
already delivered to an employer.

Resumes remain in private storage. Employer access uses a five-minute signed
URL only after the server verifies application ownership or paid candidate
database access plus candidate consent.

Demographic responses are optional, owner-only, and separate from general
profiles. They must never enter search, ranking, matching, recommendations,
candidate lists, hiring decisions, or employer exports. Their business purpose
and retention require legal approval; otherwise they must be removed before
launch.

Users can export their account data as no-cache JSON, delete a resume, control
employer discovery and communication preferences, and request account deletion.
Deletion has a 14-day cancellation period. The worker processes at most ten
accounts per invocation and must remain report-only unless all production
privacy gates are satisfied and `ACCOUNT_DELETION_EXECUTION_ENABLED=true`.

Destructive retention for applications, messages, audits, billing, and account
deletion must not be enabled until legal/privacy approval, tested backups and
restore, provider deletion evidence, alerting, and named owners are recorded.
Analytics remain disabled unless the production master flag and applicable
provider IDs are deliberately configured with the required consent review.

See [data privacy and retention](privacy/data-privacy-retention.md),
[production privacy runbook](privacy/production-privacy-runbook.md), and
[encrypted database backups](privacy/encrypted-database-backups.md).

## API and mutation checklist

For every new or changed mutation, answer all of these in the implementation or
review notes:

- Who may call it, and where is that enforced?
- Does it use the authenticated, anonymous, or administrative Supabase client,
  and why is that the least privilege required?
- What schema validates the input, and what is the maximum request size?
- What per-IP, per-user, per-email, duplicate-cooldown, or replay control
  applies?
- Can the response or log reveal account existence, authorization state,
  personal data, provider data, or internal errors?
- Which RLS policy, constraint, trigger, or transaction prevents direct and
  concurrent bypasses?
- Is an audit event required, and is its payload redacted?
- Which success, validation, unauthenticated, unauthorized, rate-limit,
  duplicate, and provider-failure cases are tested?

Consult the existing boundary table before inventing a policy. Existing limits
and exceptions are documented in [mutation boundaries](security/mutation-boundaries.md).

## Database and migration rules

`src/lib/migrations` is the only canonical migration tree. The historical files
captured by `migration-baseline.json` are immutable. Do not rename, edit, move,
squash, or delete them.

Every new migration must be a forward-only root file named:

```text
YYYYMMDDHHMMSS_descriptive_snake_case.sql
```

Use a unique UTC timestamp. Correct a deployed change with another migration.
Before a production migration, confirm and record a recent backup, test against
a disposable production-shaped database, document verification and expected
locks, and decide the compensating rollback approach.

Repository filenames do not prove remote application. Production currently has
no discoverable HireGeneral application migration ledger, so do not repair or
invent remote history. Reconcile schema evidence and deployment records before
establishing any baseline.

Add indexes through forward-only migrations and base them on actual query and
authorization shapes. Do not remove an index only because its scan count is
low. Check constraint ownership, predicates, expressions, ordering, operator
classes, ingestion, reporting, and operational use first. Use plain `EXPLAIN`
before bounded read-only `EXPLAIN ANALYZE`; never analyze production mutations.

See the [migration guide](../src/lib/migrations/README.md),
[production migration history](database/production-migration-history.md), and
[index review](database/index-review.md).

## Testing and verification

Use Node.js 24 and npm 11. The standard local quality sequence is:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:migrations
npm run test:schema-bundle
npm run build
```

`npm run ci` runs that sequence. Run `npm run test:e2e` after building because
Playwright targets the production server. Add focused tests during development,
then run checks proportional to the changed surface.

RLS integration tests and authenticated end-to-end tests are opt-in and must
use the dedicated disposable Supabase test project. Never point their
`SUPABASE_TEST_*`, migration, or service-role credentials at production.
Authenticated tests must restore fixture state. Public auth browser tests mock
delivery so they do not create accounts or consume email quota.

See [testing](testing.md) for required variables, safety guards, and CI behavior.

## Change-type reading map

| If the work item changes...                                             | Read before implementation                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Next.js routes, rendering, caching, metadata, middleware/proxy, or APIs | Relevant `node_modules/next/dist/docs/` guide plus this document        |
| Sign-in, sign-up, recovery, OAuth, sessions, or role selection          | Email OTP, mutation boundaries, service-role review, testing            |
| Employer jobs, sourcing, messages, candidates, billing, or analytics    | Employer entitlements, mutation boundaries, service-role review         |
| Profiles, resumes, applications, demographics, exports, or deletion     | Data privacy/retention, production privacy runbook, mutation boundaries |
| Supabase client or service-role use                                     | Service-role review and relevant RLS tests                              |
| Schema, RLS, triggers, functions, or indexes                            | Migration guide, production history, index review, testing              |
| Ingestion, seeds, cron, or administrative imports                       | README operational warnings, mutation boundaries, service-role review   |
| Backups, restore, retention, analytics, or subprocessors                | Encrypted backups and production privacy runbook                        |

## Work-item definition of done

- The relevant reading-map documents and current Next.js guide were reviewed.
- The implementation preserves server/database authorization and least
  privilege; any service-role use has a documented reason and controls.
- Inputs, payload size, abuse controls, safe errors, redacted logging, and audit
  needs were considered for every mutation.
- Privacy, consent, entitlement, retention, and provider implications were
  reviewed where applicable.
- Database changes are forward-only and historical migrations are untouched.
- Focused tests cover the success path and meaningful failure/authorization
  boundaries.
- Formatting, lint, types, tests, migration checks, and build were run in
  proportion to the change, with any skipped checks explicitly reported.
- Documentation and environment-variable examples were updated when behavior
  or operational requirements changed, without committing secrets or personal
  data.

## Current launch cautions

These are active constraints, not assumptions to silently work around:

- Account deletion execution must remain disabled until the privacy runbook's
  owners, approvals, backup/restore evidence, provider deletion paths, and
  alerting gates are complete.
- The encrypted database backup covers only the PostgreSQL `public` schema; it
  does not cover Supabase Auth identities or Storage objects.
- Production application migration history is not represented by a discovered
  migration ledger. Treat live-schema reconciliation as a controlled operation.
- Dependency auditing currently reports existing advisories non-blockingly;
  dependency changes still require deliberate security review.
- Location autocomplete improved after matching indexes but remains dominated
  by ZIP-row processing and city/state deduplication. A maintained city-level
  structure is the documented future direction, not another incidental index.

## Authoritative source index

- [Repository overview and operations](../README.md)
- [Testing program](testing.md)
- [Email OTP authentication](security/email-otp-authentication.md)
- [Employer entitlements](security/employer-entitlements.md)
- [Mutation boundaries](security/mutation-boundaries.md)
- [Service-role review](security/service-role-review.md)
- [Data privacy and retention](privacy/data-privacy-retention.md)
- [Production privacy runbook](privacy/production-privacy-runbook.md)
- [Encrypted database backups](privacy/encrypted-database-backups.md)
- [Database index review](database/index-review.md)
- [Production migration history](database/production-migration-history.md)
- [Migration rules](../src/lib/migrations/README.md)
