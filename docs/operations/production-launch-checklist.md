# Production launch checklist

This is the HireGeneral go/no-go record. Do not mark a gate complete without
dated evidence and an owner. Keep credentials and personal data out of the
record.

## Automated release gates

- [ ] Main-branch CI is green: formatting, lint, types, unit tests, migration
      validation, schema bundle, build, public browser tests, and critical
      dependency audit.
- [ ] Authenticated browser journeys and RLS integration pass against the
      dedicated test Supabase project. They must never target production.
- [ ] Production configuration passes after securely pulling Vercel values:

  ```bash
  npm run launch:preflight -- --env-file=.env.production.local
  ```

- [ ] The deployment passes the explicitly enabled, read-only smoke check:

  ```bash
  PRODUCTION_SMOKE_BASE_URL=https://www.hiregeneral.com \
  ALLOW_PRODUCTION_SMOKE=YES_I_UNDERSTAND \
  npm run launch:smoke:production
  ```

The smoke command sends only GET requests. It verifies health, the home and jobs
pages, crawler files, and enforced security headers. It does not create users,
applications, jobs, payments, messages, or alerts.

## Provider and operations gates

- [ ] Vercel production domains and environment scope are correct; Preview does
      not use production-only secrets unless explicitly required.
- [ ] Supabase URL, publishable/anonymous key, backend key, RLS, indexes, and
      applied migration evidence are verified.
- [ ] Vercel cron routes exist for ingestion, job alerts, and deletion review;
      their corresponding secrets are present.
- [ ] Resend sender domain and recipient routing are verified with safe test
      accounts. No real applicant receives a launch test.
- [ ] Stripe production products, prices, webhook endpoint, signing secret, and
      replay-safe event processing are verified before paid plans are enabled.
- [ ] Upstash production REST credentials are configured and rate limiting is
      visible in operational logs.
- [ ] `/api/health` is connected to a free uptime monitor and the notification
      recipient has tested one alert.
- [ ] `/admin-control-center` is healthy or every degraded signal has a recorded
      disposition.

## Recovery, privacy, and legal blockers

- [ ] A recent encrypted database and Storage artifact pair exists.
- [ ] That exact pair has completed a restore drill against the dedicated test
      project, including RLS and representative object access verification.
- [ ] Restore owner, offline `age` identity custody, incident owner, rollback
      decision-maker, and deletion-replay ledger owner are recorded privately.
- [ ] Account deletion execution remains disabled until every privacy-runbook
      prerequisite is approved and tested.
- [ ] Privacy, terms, subprocessor disclosures, consent language, retention, and
      launch jurisdictions have licensed-counsel approval.

## Product and measurement gates

- [ ] Candidate signup, search, save, apply, timeline, messaging, and account
      settings are manually checked with a production-safe test account.
- [ ] Employer signup, company profile, job creation, pipeline, collaboration,
      exports, billing access, and messaging are manually checked without
      contacting real candidates.
- [ ] Administrator operations and ingestion views are accessible only to the
      approved admin account.
- [ ] Analytics remains consent-gated. If enabled, confirm only aggregate funnel
      events for signup, search, save, application, employer activation, and
      subscription conversion; never send resume or applicant content.
- [ ] Accessibility, performance/load, SEO structured data, sitemap, and robots
      checks are current for the release candidate.

## Release and rollback record

Record privately:

- release commit and deployment URL;
- launch owner, incident channel, and start time;
- database migration names applied for the release;
- backup artifact timestamps and restore-drill date;
- provider verification evidence;
- known degraded signals and accepted risks;
- last known-good Vercel deployment;
- final go/no-go approvers and decision time.

Rollback the application by promoting the last known-good immutable Vercel
deployment. Database changes remain forward-only: use a reviewed compensating
migration instead of editing history or attempting an unplanned production
restore.
