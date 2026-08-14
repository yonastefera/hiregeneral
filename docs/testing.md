# HireGeneral test program

## Local checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:migrations
npm run build
npm run test:e2e
```

Playwright runs against `npm run start`, so build the application first. Set
`PLAYWRIGHT_BASE_URL` to test an already-running deployment instead.

## Supabase RLS integration tests

RLS tests must only use a disposable, dedicated Supabase test project. They are
disabled unless `RUN_RLS_INTEGRATION=1` is explicitly set.

Required variables:

```text
RUN_RLS_INTEGRATION=1
SUPABASE_TEST_URL=
SUPABASE_TEST_ANON_KEY=
SUPABASE_TEST_SERVICE_ROLE_KEY=
SUPABASE_TEST_SEEKER_EMAIL=seeker@hiregeneral.test
SUPABASE_TEST_SEEKER_PASSWORD=
SUPABASE_TEST_RECRUITER_A_EMAIL=recruiter-a@hiregeneral.test
SUPABASE_TEST_RECRUITER_A_PASSWORD=
SUPABASE_TEST_RECRUITER_B_EMAIL=recruiter-b@hiregeneral.test
SUPABASE_TEST_RECRUITER_B_PASSWORD=
SUPABASE_TEST_ADMIN_EMAIL=admin@hiregeneral.test
SUPABASE_TEST_ADMIN_PASSWORD=
```

The project must contain fixtures owned by Recruiter B, including at least one
job. Store these variables in the ignored `.env.rls.test` file and run
`npm run test:rls` after applying all migrations to that project.

Never point these variables at production. The service-role credential is used
only as the control client that confirms the hidden fixture exists.

## Authenticated end-to-end journeys

The public job-search smoke test runs in CI. Full seeker, employer, billing, and
admin journeys require deterministic seeded users, an email confirmation inbox
hook, disposable resume fixtures, and Stripe test-mode fixtures. Those journeys
should be enabled only after that isolated environment is available; they must
not mutate shared staging or production data.

## Dependency scanning

`npm run security:audit` scans production dependencies. It is initially
non-blocking in CI so existing advisories remain visible while framework and
transitive upgrades are handled deliberately. Remove `continue-on-error` once
the current critical advisory is remediated.
