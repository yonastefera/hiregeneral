# Production incident runbooks

These runbooks favor containment, evidence preservation, and reversible
changes. Record the incident start time, affected release, request IDs, actions,
owner, and resolution. Never paste credentials or applicant data into tickets.

## Production outage

1. Confirm impact from two networks and Vercel/Supabase status pages.
2. Identify the first failing release or provider event from structured logs.
3. Stop risky background work and place destructive jobs in report-only mode.
4. Roll back the deployment when the failure began with the current release.
5. Verify sign-in, job search, application submission, and employer access.
6. Document impact, duration, cause, and follow-up controls.

## Database issue

1. Check Supabase health, connection count, latency, storage, and recent SQL.
2. Pause ingestion and nonessential cron jobs; do not disable RLS.
3. Capture query plans and request IDs without exporting candidate records.
4. Apply only a reviewed forward migration. Restore into the test project first
   if recovery is required.
5. Verify RLS isolation and critical mutations before resuming jobs.

## Broken ingestion source

1. Disable only the affected adapter and preserve other sources.
2. Record its last successful fetch, reject count, and upstream response class.
3. Test normalization against saved non-sensitive fixtures.
4. Re-enable with a small batch; confirm freshness and duplicate prevention.

## Stripe webhook backlog

1. Check Stripe delivery attempts and HireGeneral webhook failure events.
2. Confirm signing-secret configuration and raw-body verification.
3. Do not manually change entitlements to hide the problem.
4. Replay failed events from Stripe after the handler is healthy; idempotency
   must make duplicate delivery safe.
5. Verify customer-to-company ownership and resulting audit events.

## Email outage

1. Check Resend status, domain verification, quota, and provider failures.
2. Confirm that no secret, recipient address, or email body appears in logs.
3. Keep OTP and reset responses enumeration-safe; display a service notice if
   delivery is broadly unavailable.
4. Retry only provider-safe transactional messages and avoid duplicate sends.

## Compromised credential

1. Revoke or rotate the credential at its provider immediately.
2. Update all scoped environments and redeploy; never expose the old value.
3. Review access/audit logs from the earliest possible exposure time.
4. Rotate dependent credentials and sessions when compromise could propagate.
5. Notify affected parties and counsel when legally required.

## Accidental admin-role assignment

1. Remove the role using the approved privileged path and preserve audit rows.
2. Revoke active sessions and review admin actions taken during the window.
3. Reverse unauthorized changes with forward, auditable operations.
4. Determine how the assignment bypassed approval and add a regression test.

## Bad deployment rollback

1. Identify the last known-good immutable Vercel deployment.
2. Promote or roll back to it; do not force-push history as incident response.
3. Confirm environment variables and database migrations remain compatible.
4. Run critical production smoke tests and create a forward fix.

## Data-deletion request

Follow the production privacy runbook. Verify identity, start the grace period,
allow cancellation during that period, execute only through the service-role
deletion worker, record completion without personal data, and track backup and
subprocessor propagation separately.
