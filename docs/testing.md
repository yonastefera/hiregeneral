# HireGeneral test program

## Local checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:migrations
npm run test:schema-bundle
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

The password values are credentials for seeded test fixtures only. The public
HireGeneral interface is passwordless. Authenticated Playwright tests establish
real Supabase session cookies programmatically so they do not send email OTPs,
depend on an inbox, or consume transactional-email quota. The public
authentication spec separately mocks delivery and verifies the email-code UI,
request payload, safe invalid-code response, and post-verification routing.

The project must contain fixtures owned by Recruiter B, including at least one
job. Store these variables in the ignored `.env.rls.test` file and run
`npm run test:rls` after applying all migrations to that project.

Never point these variables at production. The service-role credential is used
only as the control client that confirms the hidden fixture exists.

## Authenticated end-to-end journeys

The public job-search, seeker/employer registration, and password-reset browser
tests run in CI. Authentication requests are intercepted in the browser tests,
so they validate UI payloads and feedback without creating accounts or sending
email.

Full authenticated seeker, employer, billing, and admin journeys require the
application server itself to use the dedicated test-project URL and publishable
key, plus deterministic seeded users, disposable resume fixtures, and Stripe
test-mode fixtures. Those journeys must never mutate shared staging or
production data.

The authenticated runner builds into `.next-e2e-auth`, starts on port 3100, and
refuses the known production Supabase project. It is deliberately opt-in:

```bash
RUN_AUTHENTICATED_E2E=1 npm run test:e2e:authenticated
```

Locally, it reads the ignored `.env.rls.test`. In CI, credentials are supplied
directly by GitHub Actions secrets. The runner maps those credentials only into
its build and server child processes and runs tests serially. Authenticated
specs must restore any fixture state they modify.

CI runs these journeys only when the repository variable
`RUN_AUTHENTICATED_E2E` equals `1`. Configure the `SUPABASE_TEST_*` repository
secrets listed above before enabling it. Failed runs retain Playwright traces
and screenshots for seven days.

## Dependency scanning

`npm run security:audit` scans production dependencies. It is initially
non-blocking in CI so existing advisories remain visible while framework and
transitive upgrades are handled deliberately. Remove `continue-on-error` once
the current critical advisory is remediated.
