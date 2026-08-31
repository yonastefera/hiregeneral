# Database migrations

## Canonical location

`src/lib/migrations` is HireGeneral's canonical migration tree. The 115 SQL
files captured by `migration-baseline.json` are immutable historical artifacts.
This includes `file1.sql` through `file98.sql`, the existing eight-digit dated
files, and the one nested historical migration. Do not rename, edit, move,
squash, or delete them.

The legacy names predate the current convention. Their authoritative execution
order is recorded once in `migration-baseline.json` and consumed by both
validation and disposable schema reconstruction. The numbered files are grouped
as follows:

- `file1.sql`–`file4.sql`: initial schema, authorization, Storage, and profiles;
- `file5.sql`–`file37.sql`: ingestion foundations and early ATS sources;
- `file38.sql`–`file47.sql`: enrichment, salary, employer, billing, and contact;
- `file48.sql`–`file69.sql`: expanded employer-source coverage;
- `file70.sql`: canonical salary benchmark structure;
- `file71.sql`–`file98.sql`: later curated employer-source coverage.

This catalog is documentation, not permission to replay individual historical
files against an existing environment.

All future migrations must be forward-only files at this directory's root with
the format:

```text
YYYYMMDDHHMMSS_descriptive_snake_case.sql
```

Use UTC and a unique 14-digit timestamp. Correct a deployed migration with a
new migration; never rewrite history. `npm run test:migrations` enforces the
immutable baseline and future naming policy.

## Production history

Repository filenames do not prove which statements were applied in production.
Run the read-only query in `scripts/sql/production-migration-history.sql` in the
production SQL Editor, export the result, and record it in
`docs/database/production-migration-history.md`. Do not use migration repair,
rename files, or establish a new remote baseline until that comparison is
complete.

## Local bootstrap and production-shaped validation

Use a disposable local Supabase stack or empty non-production Supabase-shaped
database. Never point these commands at production.

```bash
npm run test:migrations
npm run test:schema-bundle
RUN_MIGRATION_INTEGRATION=1 \
MIGRATION_TEST_PROJECT_REF='your_disposable_project_ref' \
MIGRATION_TEST_DATABASE_URL='postgresql://…disposable-database…' \
npm run test:migrations:integration
```

The integration runner refuses the known production project, builds the exact
ordered schema bundle, enables `ON_ERROR_STOP`, and applies it with `psql`.
Discard the database after the test; the historical migrations include data
changes and are not intended to be replayed over an existing environment.

## Generated database types

Install and authenticate the Supabase CLI, then choose one source:

```bash
# Linked remote project (requires SUPABASE_ACCESS_TOKEN)
SUPABASE_PROJECT_REF=your_test_project_ref npm run db:types

# Local Supabase
SUPABASE_TYPES_LOCAL=1 npm run db:types

# CI drift check
SUPABASE_PROJECT_REF=your_test_project_ref \
SUPABASE_TYPES_CHECK=1 npm run db:types
```

Generation replaces `src/lib/supabase/types.ts` atomically and rejects output
that does not contain the expected `Database` type.

## Backup and rollback

Before a production migration:

1. Confirm a recent Supabase backup exists and record its timestamp.
2. Take a logical backup when the change risk warrants it.
3. Test the forward migration against a restored, production-shaped database.
4. Record verification queries, expected locks, and the rollback decision.

Schema changes are forward-only. Prefer a compensating migration for rollback.
Restore from backup only for destructive corruption where a compensating
migration cannot safely recover the data; a restore has a larger blast radius
and requires a maintenance window. Never place credentials or backup files in
the repository.
