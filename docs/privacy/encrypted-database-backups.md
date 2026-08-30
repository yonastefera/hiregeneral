# Encrypted Supabase database backups

HireGeneral's Supabase Free project does not include managed downloadable
backups. The repository therefore provides a weekly GitHub Actions workflow that
creates two client-side `age`-encrypted artifacts retained for seven days:

- a PostgreSQL custom-format dump covering `public`, `auth`, and `storage`;
- a tar archive containing the bytes from every Supabase Storage bucket.

The database artifact covers Auth identities and Storage metadata. The Storage
artifact covers the actual private resume, avatar, and other object bytes. A
recoverable backup requires the matching pair.

## Security model

- GitHub stores the production database URL as an environment secret.
- GitHub stores only the public `age` recipient, which cannot decrypt backups.
- The private `age` identity stays offline with the designated restore owner.
- The workflow never writes a plaintext database dump to disk.
- Storage objects exist briefly in a permission-restricted temporary directory
  on the ephemeral runner and are deleted after streaming encryption.
- Artifacts contain an encrypted custom-format dump and its SHA-256 checksum.
- Backups expire from GitHub after seven days.

Do not put the private identity, database URL, decrypted dump, or exported user
data in the repository, Vercel, tickets, or chat.

## One-time setup

1. Install `age` on the restore owner's trusted workstation. On macOS with
   Homebrew:

   ```bash
   brew install age
   ```

2. Create an identity in a secure location outside the repository:

   ```bash
   age-keygen -o /absolute/private/location/hiregeneral-backup-identity.txt
   ```

   Move an encrypted copy of this identity to offline recovery storage. Record
   the printed `age1...` public recipient separately.

3. In GitHub, create an environment named `production-backup`. Restrict who can
   modify its secrets and, if the plan supports it, require an approved reviewer
   for manual runs.

4. Add this environment secret:
   - `SUPABASE_PRODUCTION_DB_URL`: the production Supabase direct database
     connection string. Use the direct connection when GitHub supports IPv6;
     otherwise use the Supavisor session-mode connection string. Never use the
     browser API key.
   - `SUPABASE_PRODUCTION_URL`: the production project API URL.
   - `SUPABASE_PRODUCTION_SERVICE_ROLE_KEY`: used only by this restricted
     backup environment to read private Storage buckets. Despite the legacy
     variable name, this may contain a recommended Supabase `sb_secret_...`
     backend key.

5. Add this environment variable:
   - `BACKUP_AGE_RECIPIENT`: the public `age1...` recipient. This value is safe
     for encryption but cannot decrypt a backup.

6. Run **Encrypted database backup** manually from GitHub Actions. Confirm that
   the run uploads one `.dump.age`, one `.tar.age`, and a checksum for each.
   Do not publish or extract either artifact.

The workflow then runs every Sunday at 07:17 UTC. GitHub schedules can be delayed, so
alert on a missing successful run rather than relying on an exact start time.

## Restore drill against the test project

Download one encrypted artifact onto the trusted restore workstation. Install
Docker, Node.js, and `age`, then set the following values without committing
them:

```bash
export RESTORE_SUPABASE_DB_URL='test-project-database-connection-string'
export RESTORE_EXPECTED_HOST='exact-test-database-hostname'
export PRODUCTION_DATABASE_HOST='exact-production-database-hostname'
export RESTORE_AGE_IDENTITY='/absolute/private/location/hiregeneral-backup-identity.txt'
export ALLOW_TEST_DATABASE_RESTORE='YES_I_UNDERSTAND'
npm run db:restore:test -- /absolute/path/to/hiregeneral-database-TIMESTAMP.dump.age

export RESTORE_SUPABASE_URL='https://test-project.supabase.co'
export RESTORE_SUPABASE_SERVICE_ROLE_KEY='test-project-service-role-key'
export PRODUCTION_SUPABASE_URL='https://production-project.supabase.co'
export ALLOW_TEST_STORAGE_RESTORE='YES_I_UNDERSTAND'
npm run storage:restore:test -- /absolute/path/to/hiregeneral-storage-TIMESTAMP.tar.age
```

The database restore uses `--clean --if-exists` and is destructive to the test
project's `public`, `auth`, and `storage` schemas. The Storage restore overwrites
same-named test objects. Both commands refuse their configured production
target. Confirm every URL and hostname before running either command.

After restore, run at minimum:

```bash
npm run test:migrations
npm run test:rls
```

Also verify representative row counts, application startup, resume metadata,
account-deletion records, and access with anonymous, seeker, recruiter, and
admin test clients. Record the drill date and aggregate results privately.

## Recovery limitations

- Auth sessions captured in a backup may be expired or invalidated by provider
  configuration and must be verified during the restore drill.
- Bucket configuration and object metadata come from the database artifact;
  object bytes come from the separate Storage artifact.
- Stripe, Resend, Vercel, GA4, and Clarity data are outside this backup.
- A restored backup can reintroduce records deleted after the backup timestamp;
  replay the external deletion ledger before restored traffic is served.
