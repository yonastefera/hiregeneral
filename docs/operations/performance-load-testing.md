# Performance and load testing

HireGeneral includes a dependency-free, read-only load test for the public job
search API. It measures error rate plus p50 and p95 latency for browse, keyword,
and location searches.

The launch thresholds match the operational search objective:

- p95 latency at or below 1,500 ms
- error rate at or below 5%

## Safety

The runner uses GET requests only, limits concurrency to 50 and total requests
to 1,000, and refuses `hiregeneral.com` and its subdomains. Because a local app
can still connect to a production database, every run requires explicit
non-production confirmation. A remote preview also requires a separate remote
target acknowledgement.

Run against an already-started local production build:

```bash
npm run build
npm run start
LOAD_TEST_CONFIRM_NON_PRODUCTION=1 npm run test:load
```

Run against a disposable remote preview:

```bash
LOAD_TEST_BASE_URL=https://non-production-preview.example \
LOAD_TEST_ALLOW_REMOTE=1 \
LOAD_TEST_CONFIRM_NON_PRODUCTION=1 \
npm run test:load
```

Optional bounded controls are `LOAD_TEST_REQUESTS`, `LOAD_TEST_CONCURRENCY`,
`LOAD_TEST_TIMEOUT_MS`, `LOAD_TEST_MAX_P95_MS`, and
`LOAD_TEST_MAX_ERROR_RATE`. A threshold failure exits nonzero so the runner can
be used as a release gate after a stable performance baseline is established.
