# Employer hiring analytics

The employer dashboard reports measured, company-scoped hiring activity. It does
not use paid AI services or fabricated benchmark claims.

## Metrics

- Applications compare the selected 30-day period with the preceding 30 days.
- Funnel totals show candidates who reached reviewed, interviewed, or offered.
  They use immutable application status events, so later status changes do not
  erase earlier funnel progress.
- Average first response measures the time between application submission and
  the first employer status action.
- Daily applications show the most recent 14 days from the 30-day result.
- Job performance is available with the existing premium analytics entitlement
  and returns at most the ten highest-volume roles.

The dashboard intentionally does not report job views. The application does not
currently collect reliable view events, so displaying that metric would be
misleading.

## Privacy and authorization

`employer_hiring_analytics` derives the company from the authenticated recruiter's
team membership. Callers cannot supply a company identifier. The function returns
aggregates only and does not expose candidate profiles, resumes, scorecards, or
demographic information. Anonymous execution is revoked.

## Deployment

1. Apply `20260830103000_employer_hiring_analytics.sql` and
   `20260830110000_restrict_employer_hiring_analytics.sql` to the test project.
2. Run `docs/operations/verify-employer-hiring-analytics.sql`; every column must
   return `true`.
3. Confirm the employer dashboard loads for an owner or team member and that a
   user outside the company cannot access its data.
4. Apply the migration to production, run the same verification, and deploy the
   application.
