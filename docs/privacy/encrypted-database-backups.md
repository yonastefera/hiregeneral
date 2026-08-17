# Encrypted Supabase database backups

HireGeneral's Supabase Free project does not include managed downloadable
backups. The repository therefore provides a daily GitHub Actions workflow that
streams the production `public` schema directly into client-side `age`
encryption and retains only the encrypted artifact for seven days.

This does **not** back up Supabase Storage objects. Resumes and avatars require
a separate encrypted object-backup process before account-deletion execution
can be enabled.

## Security model

- GitHub stores the production database URL as an environment secret.
- GitHub stores only the public `age` recipient, which cannot decrypt backups.
- The private `age` identity stays offline with the designated restore owner.
- The workflow never writes a plaintext database dump to disk.
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

5. Add this environment variable:
   - `BACKUP_AGE_RECIPIENT`: the public `age1...` recipient. This value is safe
     for encryption but cannot decrypt a backup.

6. Run **Encrypted database backup** manually from GitHub Actions. Confirm that
   the run uploads one `.dump.age` file and one `.sha256` file. Do not publish or
   extract the artifact.

The workflow then runs daily at 07:17 UTC. GitHub schedules can be delayed, so
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
npm run db:restore:test -- /absolute/path/to/hiregeneral-public-TIMESTAMP.dump.age
```

The restore command uses `--clean --if-exists` and is destructive to the test
project's `public` schema. It refuses a host mismatch and refuses the configured
production hostname. Confirm the URLs and hostnames before running it.

After restore, run at minimum:

```bash
npm run test:migrations
npm run test:rls
```

Also verify representative row counts, application startup, resume metadata,
account-deletion records, and access with anonymous, seeker, recruiter, and
admin test clients. Record the drill date and aggregate results privately.

## Recovery limitations

- Auth identities and password/session material are not restored by this
  public-schema procedure.
- Storage files are not included.
- Stripe, Resend, Vercel, GA4, and Clarity data are outside this backup.
- A restored backup can reintroduce records deleted after the backup timestamp;
  replay the external deletion ledger before restored traffic is served.
