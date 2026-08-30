# Personalized job ranking

Signed-in seekers receive a private reranking of each bounded public search page.
The public search cache remains identical for all visitors; profile data and
personal scores never enter shared cache keys or responses.

Ranking uses canonical profile skills, canonical job titles, location preference,
and experience level. It returns a score and short evidence list. Exact weights
are deterministic and covered by migration contract tests. No demographic fields,
resume text, behavior tracking, embeddings, or paid AI APIs are used.

The database accepts at most 25 requested job IDs, rechecks that each job is
published and unexpired, and derives the profile exclusively from `auth.uid()`.
Anonymous execution is revoked. During a rolling deployment, the existing local
explanation scorer remains the fallback.

## Deployment

1. Apply `20260830180000_personalized_job_ranking.sql`, followed by
   `20260830181500_restore_profile_experience_column.sql`, to environments with
   canonical schema history. If the ranking migration reports that
   `profiles.level_of_experience` is missing, apply the narrow `181500` repair
   first and then rerun `180000`.
2. Run `verify-personalized-job-ranking.sql`; all three permission checks must be
   `true`, and the SQL editor result should be `[]`.
3. Sign in as a seeker with profile skills and confirm job cards reorder and show
   evidence without changing anonymous results.
4. Apply and verify production before deploying the application.
