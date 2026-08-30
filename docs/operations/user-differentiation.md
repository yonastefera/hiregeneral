# User differentiation operations

Phase 3 adds five connected capabilities without sending candidate data to a
paid AI provider:

1. Saved searches with daily or weekly email alerts.
2. Explainable, rule-based job matching.
3. Job freshness and source trust indicators.
4. Private PDF/DOCX resume parsing and application autofill.
5. Application timelines with employer status responses.

## Saved searches and alerts

`saved_searches` stores user-owned search filters and alert frequency.
`saved_search_alert_jobs` prevents the same saved search from emailing the same
job twice. The daily `/api/internal/job-alerts` cron processes searches that are
due while respecting the user's job-alert notification preference.

The cron requires `CRON_SECRET` and sends mail only when `RESEND_API_KEY` is
configured. Keep alert batches bounded; increase frequency by changing which
saved searches are due, not by adding more cron schedules.

## Matching and trust indicators

Match explanations use only job requirements and the candidate's headline,
experience level, location, and skills. Demographic fields must never enter
matching or ranking. The displayed reasons are intentionally explainable and
must remain consistent with the score calculation in
`src/lib/jobs/match-explanation.ts`.

Freshness and source labels describe observed job data. They are not employer
identity verification. Do not display a verified badge unless a separate,
audited employer-verification process exists.

## Resume parsing and autofill

Parsing runs on HireGeneral infrastructure using open-source PDF and DOCX text
extractors. Resume contents are not sent to an external AI provider and the
extracted text is not persisted. The parser returns conservative suggestions
for empty application fields; the candidate reviews them before submission.

The endpoint accepts only the authenticated user's stored resume path, limits
the stored file to 5 MB, and rate-limits parsing. Legacy `.doc` resumes remain
uploadable but are not parsed automatically. Never log resume text or add it to
analytics events.

## Application timelines and employer responses

Employers update applications through
`employer_update_application_status`. The database function verifies job
ownership, updates the current status, and appends the candidate-visible event
in one transaction. Direct browser writes to `application_status_events` are
revoked.

Employer-managed statuses are `reviewing`, `interview`, `offer`, and
`rejected`. Rejected and withdrawn applications are closed. Response notes are
optional, visible to the candidate, and limited to 1,000 characters.

## Deployment order

1. Apply `20260829223000_saved_searches_and_alerts.sql`.
2. Apply `20260829234500_application_timeline_and_responses.sql`.
3. Run `docs/operations/verify-user-differentiation.sql`.
4. Deploy the application.
5. Save a search in the test project and run the alert endpoint once.
6. Submit a test application, change its status as its owning recruiter, and
   confirm the applicant sees the response in the timeline.

Do not test these workflows with production user accounts or production email
recipients.

## Rollback behavior

Disable the job-alert cron before investigating unexpected alert volume. The
application timeline migration is additive; if the employer update UI must be
disabled, roll back the application deployment while preserving event history.
Do not drop timeline events as an operational rollback.
