# Advanced candidate search

The employer resume database supports job-relative ranking plus structured
filters for required skills, location, experience level, industry, highest
degree, relocation preference, and resume availability. Employers can order
results by match evidence or recent profile activity.

Structured filters are applied before candidate mapping and signed-resume URL
generation. This keeps expensive private-storage work limited to relevant
results. Search requests are authenticated, entitlement-gated, bounded, and
rate-limited.

The match score is deterministic and explainable. It uses overlap with the
selected job's structured skills, title/headline alignment, and profile
completeness. It does not use demographic information, inferred protected
attributes, interview scorecards, or paid AI services. Candidate cards show the
strongest available reasons instead of presenting the score as unexplained AI.

The existing `idx_profiles_skills_gin`, public-profile discovery, and
public-resume indexes support the primary filters. Review real production query
plans before adding more indexes; do not add speculative indexes for rarely
used filters.

## Operational checks

- Confirm an employer without the candidate-database entitlement receives 403.
- Confirm private profiles and profiles without employer-access consent never
  appear.
- Confirm required-skill filters narrow results before resume URLs are signed.
- Confirm job seekers, unauthenticated users, and unrelated employers cannot
  call the database successfully.
- Monitor 429 responses before increasing the search rate limit.
