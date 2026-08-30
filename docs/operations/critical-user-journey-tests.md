# Critical user-journey tests

The authenticated Playwright suite validates complete marketplace journeys
against the dedicated disposable Supabase test project. It must never target
production.

## Covered journeys

- seeker profile editing and ownership
- job saving and state restoration
- evidence-based application coaching, resume upload, submission, and duplicate
  prevention
- saved-search creation, alert-frequency updates, reopening, and deletion
- employer company editing and owned draft creation
- candidate and resume isolation between employers
- pipeline movement, candidate-visible responses, private interview scorecards,
  and seeker application timelines
- isolated seeker/employer messaging and replay protection
- billing access boundaries and safe behavior without Stripe
- administrator ingestion monitoring and role redirects

Each mutating test restores its original fixture state in a `finally` block.
The runner executes serially, refuses the known production Supabase project,
and requires an explicit opt-in flag. Failed CI runs retain screenshots and
traces for seven days.

Run locally only with the dedicated test credentials:

```bash
RUN_AUTHENTICATED_E2E=1 npm run test:e2e:authenticated
```
