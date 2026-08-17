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

Record values from the active production plan and contract. Marketing pages or
generic documentation are not sufficient evidence when the contracted value is
available.

| Provider / system                        | Data involved                                                | Backup or deletion window                                | Verified on | Evidence location                | Status  |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | ----------- | -------------------------------- | ------- |
| Supabase Database                        | Profiles, applications, messages, audit and billing metadata | Pending plan verification                                | Pending     | Private operations system        | Blocked |
| Supabase Auth                            | Identity and session data                                    | Pending plan verification                                | Pending     | Private operations system        | Blocked |
| Supabase Storage                         | Resumes and avatars                                          | Pending plan verification                                | Pending     | Private operations system        | Blocked |
| Vercel                                   | Runtime logs, deployment and cache data                      | Pending plan verification                                | Pending     | Private operations system        | Blocked |
| Resend                                   | Transactional email delivery metadata                        | Pending contract verification                            | Pending     | Private vendor-management system | Blocked |
| Stripe                                   | Customer, subscription, payment and dispute records          | Pending legal and contract verification                  | Pending     | Private compliance system        | Blocked |
| Analytics and error monitoring providers | Redacted product and diagnostic events                       | Confirm enabled providers and their configured retention | Pending     | Private vendor-management system | Blocked |

Add every production subprocessor before launch. Removing a provider from the
application does not remove its historical deletion obligation.

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
