# Launch-critical index review

Status: **production inventory captured 2026-08-15**

Run `scripts/sql/production-index-inventory.sql` in production before adding or
dropping indexes. Index presence alone is not proof of usefulness; table size,
scan counters, query shape, selectivity, and `EXPLAIN (ANALYZE, BUFFERS)` on
production-shaped data all matter.

## Application query map

| Area                  | Primary predicates/order                                    | Repository index evidence                                 | Final assessment                        |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| Public job search     | published, posted/expiry, text/location/company and filters | Partial published indexes, trigram indexes, search GIN    | Measured; keyword path optimized        |
| Job source identity   | source name/source ID                                       | Constraint-owned unique source index                      | Covered                                 |
| Job expiration        | published plus `expires_at`                                 | Partial published expiry index                            | Covered                                 |
| Recruiter jobs        | recruiter, optional status, newest created                  | Recruiter/created and recruiter/status/created composites | Covered                                 |
| Applications by user  | user, newest created                                        | User/created composite plus unique user/job               | Covered; remeasure with production data |
| Applications by job   | job, newest created                                         | Job/created composite                                     | Covered                                 |
| Messages              | conversation, created ascending                             | Conversation/created composite                            | Covered structurally; table is empty    |
| Conversations         | either participant, newest activity                         | Participant-one and participant-two activity composites   | Covered structurally; table is empty    |
| Candidate search      | applications joined to recruiter jobs; optional job         | Job/created plus recruiter job indexes                    | Measured; 2.514 ms at current volume    |
| Salary lookups        | release year, occupation, area                              | Release/occupation/area composite                         | Measured and query narrowed             |
| Location autocomplete | `search_locations` RPC                                      | Normalized city/state and ZIP-prefix indexes              | Measured; city-level structure deferred |
| Saved jobs            | user, newest created; user/job toggle                       | User/created composite and unique user/job                | Measured; 1.482 ms at current volume    |

## Production findings

- `jobs`: 1,410 estimated rows, 33 MB, and 783,153 index scans. Public
  search, source identity, expiration, and common filters are indexed.
  Recruiter indexes use `posted_at`, while the dashboard orders by `created_at`.
- `applications`: one estimated row, but its user/job unique index has more
  than 2.4 million scans. Production lacks job/created and user/created indexes.
- `conversations`: currently empty. Its only non-primary index is
  `(participant_one, participant_two)`, while the UI queries either participant
  and orders by `last_message_at`.
- `messages`: currently empty; `(conversation_id, created_at)` matches the UI.
- `saved_jobs`: three estimated live rows. Existing indexes support filtering,
  but not newest-first ordering.
- `locations`: 39,955 estimated rows/18 MB with trigram, state, ZIP,
  coordinates, and uniqueness coverage.
- `salary_benchmarks`: 19,604 estimated rows/11 MB with composite and trigram
  coverage. The release/year/occupation/area uniqueness index is heavily used.
- `job_sources`: 260 estimated rows with source identity and company coverage.
- `profiles`: candidate visibility/resume and skills indexes are present.
- `salary_bls_oews` is absent; the app uses `salary_benchmarks` and safely
  falls back when legacy salary tables are absent.

The inventory identified exact duplicate `jobs` indexes for category, slug,
source identity, and published posted date. Ownership diagnostics were captured
and only exact duplicates were removed; nonidentical overlaps remain.

`20260815150000_add_launch_query_indexes.sql` adds only missing composites for
recruiter jobs, applications, participant activity, and saved-job ordering.

The migration was applied to production and `hiregeneral-test`. Verification
confirmed all seven indexes are present in both environments:

- `idx_jobs_recruiter_created_at`
- `idx_jobs_recruiter_status_created_at`
- `idx_applications_user_created_at`
- `idx_applications_job_created_at`
- `idx_conversations_participant_one_activity`
- `idx_conversations_participant_two_activity`
- `idx_saved_jobs_user_created_at`

## Review rules

- Do not use production `EXPLAIN ANALYZE` for mutations.
- Start with plain `EXPLAIN (FORMAT JSON)` for expensive or uncertain reads.
- Use `EXPLAIN (ANALYZE, BUFFERS)` only for bounded SELECT queries after
  checking table size and expected result limits.
- Add indexes through new forward-only timestamped migrations.
- Prefer indexes matching authorization predicates as well as UI filters.
- Do not remove a low-scan index until its constraint, ingestion, reporting,
  and infrequent operational uses have been checked.

## Overlap-removal gate

Before removing any `jobs` index, run
`scripts/sql/jobs-index-overlap-diagnostics.sql`. An index owned by a primary,
unique, or exclusion constraint must not be dropped directly. Scan counters are
cumulative and can reset, so zero scans alone are not sufficient evidence for
removal. A removal candidate must have an equivalent retained index, no
constraint ownership, and no distinct predicate, expression, ordering, or
operator class required by an application query.

## Exact duplicate cleanup

Production diagnostics identified five exact duplicate `jobs` indexes. The
forward-only migration
`20260815153000_remove_exact_duplicate_job_indexes.sql` removes them while
retaining equivalent coverage:

| Removed index                  | Retained equivalent                               |
| ------------------------------ | ------------------------------------------------- |
| `idx_jobs_category`            | `jobs_category_idx`                               |
| `idx_jobs_slug`                | constraint-owned `jobs_slug_key`                  |
| `idx_jobs_slug_unique`         | constraint-owned `jobs_slug_key`                  |
| `idx_jobs_source_unique`       | constraint-owned `jobs_source_name_source_id_key` |
| `idx_jobs_published_posted_at` | `jobs_published_posted_at_idx`                    |

The migration intentionally leaves all partial, ordered, trigram, and otherwise
overlapping-but-nonidentical indexes in place pending query-plan evidence.

The dedicated test environment did not contain the four production-retained
equivalents before this cleanup. The follow-up migration
`20260815154500_restore_canonical_job_indexes.sql` idempotently restores those
indexes and unique constraints, closing that environment-parity gap without
altering production objects that are already present.

## Query-plan capture

Plan review begins with the default public job feed because it is the primary
visitor query and retrieves up to 1,000 active candidates before application
level company diversification. Run `scripts/sql/explain-public-job-feed.sql`
in production and retain its JSON output. The statement is a bounded,
read-only `SELECT`; `ANALYZE` executes only that read.

Production feed-plan result captured 2026-08-15:

- 692 rows returned in 29.591 ms; all 323 execution buffers were cache hits.
- PostgreSQL scanned `idx_jobs_published_employment_type`, then filtered 299 of
  991 published rows and performed a 153 kB in-memory quicksort.
- The canonical `jobs_published_posted_at_idx` exactly matches the status
  predicate and requested ordering but was not selected at the current small
  table size. No additional feed index is justified yet; remeasure as the jobs
  table grows and after routine statistics refreshes.

The next capture uses
`scripts/sql/explain-public-job-keyword-search.sql` to measure the API's
four-field `ILIKE` keyword path with the same active-window and result cap.

Production keyword-plan result captured 2026-08-15:

- 363 rows returned in 601.275 ms despite all 2,155 execution buffers being
  cache hits.
- PostgreSQL again scanned `idx_jobs_published_employment_type`; it evaluated
  all four wildcard predicates for 991 rows, removed 628, and sorted matches.
- The estimate of 54 matches versus 363 actual indicates poor selectivity
  estimation for the four-field `OR` predicate.
- Before replacing the predicate with the existing indexed `search_text`
  column, run `scripts/sql/job-search-text-equivalence.sql` to verify column
  maintenance and result equivalence.

The equivalence check found that the unmanaged production `search_text` column
matched only 116 of 455 four-field matches and missed 339 results. Migration
`20260815160000_canonicalize_job_search_text.sql` therefore backfills and
trigger-maintains the column from title, company, description, and category in
all environments. The jobs API then uses one `search_text ILIKE` predicate so
the existing GIN trigram index can service the keyword filter without changing
search semantics.

Post-migration production verification found exact equivalence: all 455
four-field `software` matches were present in `search_text`, with zero null,
missing, or additional matches. Run
`scripts/sql/explain-indexed-public-job-keyword-search.sql` to compare the
indexed post-fix plan against the 601.275 ms baseline.

Post-fix keyword-plan result captured 2026-08-15:

- 363 active matches returned in 107.248 ms, an 82% reduction and approximately
  5.6x improvement over the 601.275 ms baseline.
- PostgreSQL used `jobs_search_text_trgm_idx`; its bitmap index scan completed
  in 0.38 ms and produced 592 candidate rows with no lossy heap blocks or index
  recheck removals.
- Active-window filtering removed 229 candidates, followed by a 95 kB in-memory
  quicksort. All execution buffers were cache hits.
- The consolidated index is effective. Do not add another keyword index at the
  current scale; remeasure if latency or job volume rises materially.

The next public-path review runs
`scripts/sql/explain-location-autocomplete.sql` against the live, bounded
`search_locations('new')` RPC and the 39,955-row locations table.

Production location-plan baseline captured 2026-08-15:

- The function returned eight rows in 650.269 ms with 1,180 cache-hit buffers
  and no disk reads.
- The live function normalizes predicates with `lower(city)` and
  `lower(state)`, but existing indexes cover raw `city` and `state`; its ZIP
  branch also performs a prefix search without a pattern-operator index.
- Migration `20260815163000_optimize_location_autocomplete.sql` canonicalizes
  the function and adds matching lower-city trigram, lower-state equality, and
  ZIP prefix indexes. Remeasure the same RPC after applying it.

Post-migration outer plan captured 2026-08-15:

- Eight rows returned in 283.533 ms, a 56% reduction and approximately 2.3x
  improvement over the 650.269 ms baseline.
- The declared `ROWS 8` corrected the planner estimate from 1,000 rows to eight.
- Latency remains high for interactive autocomplete, while `Function Scan`
  hides the internal bottleneck. Run
  `scripts/sql/explain-location-autocomplete-inner.sql` to expose the mirrored
  function body's scan, ranking, and sorting nodes before further changes.

The expanded location plan confirmed that all three new indexes participate in
a `BitmapOr`. The index phase completed in 17.905 ms and produced 797 ZIP-level
rows; deduplication yielded 455 city/state rows before the top-eight ranking.
The remaining latency is therefore dominated by heap processing and city/state
deduplication, not missing predicate indexes. A future materialized city-level
search structure could avoid repeated ZIP rows, but it requires an explicit
refresh/maintenance design and is not justified as an incidental index change.

The next review runs `scripts/sql/explain-salary-benchmark-lookup.sql` for the
primary 2025 software-engineer OEWS code lookup against 19,604 salary rows.

Production salary-plan baseline captured 2026-08-15:

- The lookup used `salary_benchmarks_latest_location_idx` with exact release
  year and occupation-code conditions.
- It nevertheless fetched all 552 geographic rows and took 435.416 ms from
  cache because location scoring occurred only after transfer to the API.
- The API now applies a semantics-preserving location candidate filter before
  scoring: national/remote searches request only national rows, while local
  searches retain national, state, city, and state-name candidates.
- Run `scripts/sql/explain-narrowed-salary-benchmark-lookup.sql` to measure the
  common national path against the 552-row baseline.

Post-fix national salary plan captured 2026-08-15:

- One benchmark row returned in 6.353 ms instead of 552 rows in 435.416 ms,
  approximately a 98.5% latency reduction and 68x improvement.
- PostgreSQL used `salary_benchmarks_lookup_idx` with release year, occupation
  code, and area type as index conditions. No new salary index is required.

The next authenticated-path review runs
`scripts/sql/explain-employer-candidate-list.sql` for the application-to-job
join and newest-first ordering used by the employer candidate list.

Production employer-candidate plan captured 2026-08-15:

- One application returned in 2.514 ms with seven cache-hit buffers and no disk
  reads.
- PostgreSQL correctly used `jobs_pkey` for the join. A sequential scan of the
  one-row applications table is cheaper than an index scan at current volume.
- The recruiter and application composite indexes remain aligned with the
  growth query shape; remeasure once production contains meaningful applicant
  volume.

The next review runs `scripts/sql/explain-saved-jobs-list.sql` for the
user-scoped, newest-first saved-job list and job join.

Production saved-jobs plan captured 2026-08-15:

- One saved job returned in 1.482 ms with seven cache-hit buffers and no disk
  reads.
- PostgreSQL correctly used `jobs_pkey` for the join. A sequential scan of the
  three-row saved-jobs table is cheaper at current volume; the
  `(user_id, created_at DESC)` index is aligned for future growth.

## Review conclusion

All launch index-review query families now have either measured production
plans or structurally matching indexes where production tables are empty or too
small to yield representative planner behavior. Exact duplicate indexes were
removed without losing constraint coverage. Public keyword search and salary
lookup received measured query-shape improvements. Location autocomplete now
uses matching predicate indexes; further material improvement is explicitly
deferred to a maintained city-level search structure rather than another
overlapping index.
