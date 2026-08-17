# Production privacy operations runbook

This runbook turns HireGeneral's privacy policy into production operations. It
must be completed with evidence before destructive retention or account
deletion execution is enabled. Do not place credentials, personal data, signed
URLs, or exported customer records in this repository.

## Owners and approval

| Responsibility                        | Named owner | Approval or review date | Evidence location                |
| ------------------------------------- | ----------- | ----------------------- | -------------------------------- |
| Privacy/legal retention approval      | Pending     | Pending                 | Private compliance system        |
| Production database and restore owner | Pending     | Pending                 | Private operations system        |
| Account-deletion incident owner       | Pending     | Pending                 | Private operations system        |
| Subprocessor inventory owner          | Pending     | Pending                 | Private vendor-management system |

`ACCOUNT_DELETION_EXECUTION_ENABLED` must remain unset or `false` while any
required owner or approval above is pending. Report-only retention checks may
continue.

## Provider retention inventory

This inventory was reconciled with the application on 2026-08-16. It records
documented provider behavior, but the active production plan and dashboard
settings still require private evidence. Do not commit screenshots containing
keys, customer records, or other personal data.

| Provider / system    | Data involved                                                | Documented retention or deletion behavior                                                                                                                                                                                                                                                                                          | Production verification required                                                                                                                            | Status                              |
| -------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Supabase Database    | Profiles, applications, messages, audit and billing metadata | [Supabase backups](https://supabase.com/docs/guides/platform/backups) retain daily backups for 7 days on Pro, 14 days on Team, and up to 30 days on Enterprise. Free projects do not include managed downloadable backups.                                                                                                         | Production Free plan and absence of backups confirmed 2026-08-16. Encrypted daily workflow added; first successful backup and test restore remain required. | Implementation pending verification |
| Supabase Auth        | Identity, session, and Auth audit data                       | Auth identities live in the project database and are removed by the account-deletion worker. The [Supabase plan comparison](https://supabase.com/pricing) currently lists only 1 hour of Auth audit-log retention on Free and 7 or 28 days on paid plans.                                                                          | Capture the production plan and Auth log-retention screen; test one staged Auth deletion.                                                                   | Dashboard evidence required         |
| Supabase Storage     | Resumes and avatars                                          | [Database backups do not contain Storage objects](https://supabase.com/docs/guides/platform/backups#database-backups-do-not-include-storage-objects). Restoring a database can restore object metadata but cannot restore a deleted file.                                                                                          | Test resume/avatar deletion and document any separate Storage backup product or policy.                                                                     | Destructive test required           |
| Vercel runtime logs  | Redacted request, error, and deployment diagnostics          | [Runtime log availability](https://vercel.com/docs/logs/runtime) is plan-dependent: 1 hour on Hobby, 1 day on Pro, 30 days with Observability Plus, and 3 days on Enterprise without the add-on.                                                                                                                                   | Production Hobby plan verified 2026-08-16. Observability metrics expose 12 hours; no Log Drain is configured.                                               | Verified                            |
| Vercel Web Analytics | Anonymous page and referrer analytics                        | [Web Analytics reporting](https://vercel.com/docs/analytics/limits-and-pricing) is plan-dependent: 1 month on Hobby, 12 months on Pro, and up to 24 months with paid analytics/Enterprise. Vercel says its anonymous visitor session hash is [discarded after 24 hours](https://vercel.com/docs/analytics/privacy-policy).         | Vercel Web Analytics is disabled. `NEXT_PUBLIC_ENABLE_ANALYTICS=false` was deployed to Production and Preview on 2026-08-16.                                | Disabled and verified               |
| Resend               | Transactional email content and delivery metadata            | Resend documents [30-day email-data retention on all standard plans](https://resend.com/docs/dashboard/webhooks/how-to-store-webhooks-data).                                                                                                                                                                                       | Free standard Transactional and Marketing subscriptions verified 2026-08-16; no Enterprise retention override.                                              | Verified: 30 days                   |
| Stripe               | Customer, subscription, payment, refund, and dispute records | Payment records may be retained for fraud, tax, accounting, dispute, and other legal obligations. No fixed end-to-end deletion SLA has been established for HireGeneral from public documentation. Deleting a local account must not erase records that legal/privacy requires HireGeneral or Stripe to retain.                    | Legal/privacy must approve the retention basis and record the Stripe data-request/escalation path and contracted SLA.                                       | Legal/contract review required      |
| Google Analytics 4   | Page, device, referral, and configured event data            | [GA4 user/event-level retention](https://support.google.com/analytics/answer/7667196) can be configured to 2 or 14 months; the setting does not remove standard aggregated reports on the same schedule.                                                                                                                           | Provider ID is configured, but the production master analytics flag was set to `false` on 2026-08-16.                                                       | Disabled pending consent            |
| Microsoft Clarity    | Session reconstruction, clicks, scrolls, and heatmaps        | [Clarity retention](https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention) keeps playback data for 30 days and click/heatmap/labeled data for up to 9 months; provider backups are deleted after the applicable period. A single user's data cannot be selectively removed without deleting the project. | Provider ID is configured, but the production master analytics flag was set to `false` on 2026-08-16.                                                       | Disabled pending consent            |
| Error monitoring     | Application errors and redacted diagnostics                  | No third-party error-monitoring SDK was found in the application inventory on 2026-08-16.                                                                                                                                                                                                                                          | Re-run the dependency and environment inventory before launch and whenever a provider is added.                                                             | Not currently configured            |

The application loads Vercel Web Analytics, Google Analytics, and Microsoft
Clarity only in production when `NEXT_PUBLIC_ENABLE_ANALYTICS=true`; Google and
Clarity also require their provider IDs. A provider with no production ID is
inactive, but the disabled state must still be captured in the private
subprocessor register.

Add every production subprocessor before launch. Removing a provider from the
application does not remove its historical deletion obligation.

### Evidence closeout checklist

Store the following in the private operations or vendor-management system:

1. Supabase production plan, backup configuration, Auth log retention, and a
   dated database/Auth/Storage deletion test.
2. Vercel plan, Runtime Logs/Log Drains retention, Web Analytics plan, and the
   production values (enabled/disabled only, never secrets) for analytics.
3. Resend plan and any contract that changes the documented 30-day default.
4. Stripe legal retention decision, data-request contact/path, and deletion
   response target.
5. GA4 retention and consent settings, or evidence that GA4 is disabled.
6. Clarity project, masking, consent, and retention settings, or evidence that
   Clarity is disabled.

After these artifacts are approved, replace each “required” status above with
the evidence record identifier and review date. Provider documentation alone
does not satisfy the account-deletion execution gate.

## Daily report-only review

1. Invoke the internal account-deletion endpoint with `CRON_SECRET` and confirm
   the response says `mode: "report_only"`.
2. Run `public.retention_eligibility_report()` with the service role.
3. Record aggregate counts only. Do not copy user IDs or contact details into
   tickets, chat, or ordinary logs.
4. Investigate unexpected count changes before enabling any destructive job.

## Enabling account deletion execution

Execution may be enabled only after all of the following are true:

- Legal/privacy has approved the 14-day grace period and retained-record rules.
- A recent production backup and a tested restore are recorded privately.
- Supabase database, Auth, and Storage deletion behavior has been verified.
- Stripe cancellation behavior has been tested in the production integration.
- Each active subprocessor has a recorded deletion request path and SLA.
- Alerting exists for a non-zero `failed` deletion-worker response.
- A rollback decision-maker and incident channel are assigned.

Enable `ACCOUNT_DELETION_EXECUTION_ENABLED=true` for production only after this
gate is approved. Run one small batch, verify storage, Auth, database, Stripe,
and audit outcomes, and then allow the daily schedule to continue.

## Backup restore deletion replay

A restored backup can reintroduce data deleted after that backup was created.
The production deletion ledger must therefore be copied to an access-controlled
system outside the restored database. Store only the pseudonymous user UUID,
deletion completion time, and operation status; never store email addresses,
names, resumes, or storage paths in the ledger.

Before restored traffic is made available:

1. Keep the application in maintenance mode.
2. Obtain all completed deletion ledger entries newer than the backup timestamp.
3. Re-run the account-deletion preparation and storage/Auth cleanup for those
   UUIDs using the audited internal process.
4. Confirm each replayed UUID has `deleted_at` and `deletion_completed_at`, no
   private storage objects, and no Supabase Auth identity.
5. Re-issue deletion requests to affected subprocessors when their restored or
   retained data falls within scope.
6. Have the database owner and privacy owner sign off before serving traffic.

If the external deletion ledger is unavailable or incomplete, the restore must
not serve production traffic.

## User request evidence

For an account deletion or export request, retain only operational evidence:

- pseudonymous account UUID;
- request, grace-period expiry, and completion timestamps;
- aggregate success/failure state;
- approved legal-hold or billing-retention reason, when applicable.

Do not place the user's email, phone number, resume, application text, messages,
or demographic responses in an operations ticket.
