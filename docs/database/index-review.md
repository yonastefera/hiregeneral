# Launch-critical index review

Status: **production inventory captured 2026-08-15**

Run `scripts/sql/production-index-inventory.sql` in production before adding or
dropping indexes. Index presence alone is not proof of usefulness; table size,
scan counters, query shape, selectivity, and `EXPLAIN (ANALYZE, BUFFERS)` on
production-shaped data all matter.

## Application query map

| Area                  | Primary predicates/order                                    | Repository index evidence                                 | Initial assessment               |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------- | -------------------------------- |
| Public job search     | published, posted/expiry, text/location/company and filters | Partial published indexes, trigram indexes, search GIN    | Measure RPC/direct plans         |
| Job source identity   | source name/source ID                                       | Unique source index; source enabled/company indexes       | Likely covered                   |
| Job expiration        | published plus `expires_at`                                 | Partial published expiry index                            | Likely covered                   |
| Recruiter jobs        | recruiter, optional status, newest created                  | Recruiter/created and recruiter/status/created composites | Covered                          |
| Applications by user  | user, newest created                                        | Unique user/job begins with user; no created ordering     | Measure sort cost                |
| Applications by job   | job, newest created                                         | Job/created composite                                     | Covered                          |
| Messages              | conversation, created ascending                             | Conversation/created composite                            | Covered                          |
| Conversations         | either participant, newest activity                         | One participant-one/participant-two composite             | Potential OR/order gap           |
| Candidate search      | applications joined to recruiter jobs; optional job         | Job/created plus recruiter job indexes                    | Measure join plan                |
| Salary lookups        | release year, occupation, area; trigram text                | Composite and trigram indexes                             | Likely covered                   |
| Location autocomplete | `search_locations` RPC                                      | City trigram, state, ZIP, uniqueness                      | Inspect live RPC definition/plan |
| Saved jobs            | user, newest created; user/job toggle                       | User index and unique user/job                            | Measure sort cost                |

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

The inventory also shows duplicate or overlapping `jobs` indexes for category,
slug, source identity, and published posted date. They are not removed because
constraint ownership and representative plans have not yet been captured.

`20260815150000_add_launch_query_indexes.sql` adds only missing composites for
recruiter jobs, applications, participant activity, and saved-job ordering.

## Review rules

- Do not use production `EXPLAIN ANALYZE` for mutations.
- Start with plain `EXPLAIN (FORMAT JSON)` for expensive or uncertain reads.
- Use `EXPLAIN (ANALYZE, BUFFERS)` only for bounded SELECT queries after
  checking table size and expected result limits.
- Add indexes through new forward-only timestamped migrations.
- Prefer indexes matching authorization predicates as well as UI filters.
- Do not remove a low-scan index until its constraint, ingestion, reporting,
  and infrequent operational uses have been checked.
