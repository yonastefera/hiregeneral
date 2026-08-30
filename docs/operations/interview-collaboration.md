# Interview collaboration and scorecards

Company owners can add existing HireGeneral employer accounts as team admins or
interviewers. Membership is company-scoped; it does not grant access to other
companies, candidate databases, billing, or applicant-facing profile data.

Authorized teammates can review the company's applicants and submit private
interview scorecards. Each scorecard records the interview round, 1–5 overall
rating, recommendation, one to twelve rated criteria with evidence, and an
optional summary. A reviewer can update their scorecard for the same interview
round, but cannot edit another reviewer's feedback.

Scorecards are intentionally excluded from applicant APIs and timelines. They
must never be copied into candidate-visible status notes automatically.

## Deployment

1. Apply `20260830080000_team_collaboration_and_scorecards.sql` to the dedicated
   test project.
2. Run `docs/operations/verify-interview-collaboration.sql`; every value must be
   `true`.
3. Add a second test recruiter to the hiring team.
4. Confirm the teammate can view company applicants and submit a scorecard but
   cannot edit another reviewer's scorecard.
5. Confirm the job seeker cannot read any scorecard row.
6. Apply and verify the migration in production, then deploy the application.

Removing a teammate immediately removes their company access while preserving
their historical scorecards for audit continuity.
