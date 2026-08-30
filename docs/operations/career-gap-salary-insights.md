# Career-gap and salary insights

`/career-insights` is a private seeker workspace built from evidence the user
provided and public market data.

- Timeline analysis merges overlapping work-history intervals and identifies only
  periods of at least 60 days between recorded roles. It does not infer a reason,
  score employability, or treat time between roles as negative.
- Skill opportunities use the authenticated profile's canonical title and skills,
  reviewed title-to-skill graph edges, and counts of active mapped jobs.
- Salary context uses BLS OEWS data when available, or actual salary-bearing active
  job postings. The personalized page suppresses the salary API's generic fallback
  estimate because it is not sufficiently sourced for a personal insight.

No demographic data, resume body, behavioral tracking, embeddings, or paid AI APIs
are used. Anonymous callers cannot execute the skill-opportunity function.

## Deployment

1. Apply `20260830193000_current_profile_skill_opportunities.sql` to test.
2. Run `verify-career-insights.sql`; all three checks must be `true`, and the SQL
   editor result must be `[]`.
3. Sign in as a seeker and test profiles with missing, overlapping, gapped, and
   current work history.
4. Confirm salary values identify either BLS or active-job evidence.
5. Apply and verify production before deploying the application.
