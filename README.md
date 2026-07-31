# HireGeneral

HireGeneral is a two-sided hiring marketplace for job seekers and employers. It
includes public job search and salary intelligence, seeker profiles and
applications, employer job and candidate management, subscription billing, and
automated ingestion from external applicant-tracking systems.

## Technology

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- Supabase authentication, PostgreSQL, and storage
- Stripe subscriptions
- Resend transactional email
- Upstash Redis caching and rate limiting
- Vitest, ESLint, and Prettier
- Vercel deployment and scheduled ingestion

## Requirements

- Node.js 24.14.0
- npm 11
- A Supabase project
- Optional local or test accounts for Stripe, Resend, and Upstash

If you use `nvm`, select the repository version:

```bash
nvm use
```

## Local setup

Install dependencies from the lockfile:

```bash
npm ci
```

Create a local environment file:

```bash
cp .env.example .env.local
```

At minimum, configure these variables to run the application with Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Never commit `.env.local` or production secrets. See `.env.example` for the
complete configuration surface and keep privileged values server-side.

Start the development server:

```bash
npm run dev
```

The application is available at http://localhost:3000.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Run the complete local CI sequence with:

```bash
npm run ci
```

Use `npm run test:watch` during development. Pull requests and pushes to `main`
run the same quality gates through GitHub Actions.

## Application areas

- `src/app`: Next.js pages, layouts, and API routes
- `src/home`: public home-page search and market insights
- `src/job-seekers`: seeker dashboard, profile, job search, and applications
- `src/employer`: employer landing pages and dashboard
- `src/lib/ingest`: ATS adapters, normalization, validation, and job upserts
- `src/lib/supabase`: typed browser, server, and administrative clients
- `src/emails`: transactional React Email templates
- `src/lib/migrations`: database migrations
- `scripts`: data-import and local build utilities

## External services

### Supabase

Supabase provides authentication, database access, storage, and row-level
security. Use a separate project for local/staging work. The service-role key
bypasses row-level security and must never be exposed to browser code.

### Stripe

Use Stripe test-mode keys outside production. Webhook delivery requires
`STRIPE_WEBHOOK_SECRET`; price IDs configure the employer plans.

### Email

Resend is optional for basic local rendering. Configure `RESEND_API_KEY`,
`EMAIL_FROM`, and `CONTACT_TO_EMAIL` to exercise transactional notifications.

### Redis

Upstash Redis supports caching and rate limiting. Configure its REST URL and
token together.

## Data ingestion

Vercel invokes `/api/ingest/jobs` daily according to `vercel.json`. Requests
must be authenticated with `INGEST_SECRET`, `CRON_SECRET`, or a verified Vercel
cron request. Do not run production ingestion from a local environment unless
you intentionally target production data.

Reference-data scripts are available for locations, schools, and BLS salary
benchmarks. Review their required environment variables and target Supabase
project before running them.

## Deployment

Vercel is the intended deployment target. Configure environment variables
separately for preview and production environments. GitHub Actions validates
changes; Vercel handles preview and production builds. Database migrations
should be reviewed and applied as a controlled release step rather than from
pull-request CI.

## Current launch-readiness work

The repository is being hardened incrementally. CI establishes the baseline;
security validation, API tests, browser tests, migration governance,
observability, and legal review are subsequent launch gates.
