# Data privacy and retention

This document records HireGeneral's product-level privacy controls. It is an
engineering policy, not legal advice. Legal counsel should review these periods
before launch and whenever the product enters a new jurisdiction.

## Access and visibility

| Data                                 | Default access                                   | Additional authorized access                                                                                  |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Candidate profile                    | Candidate only; new profiles are private         | Recruiters with an eligible application, or recruiters entitled to search a profile the candidate made public |
| Resume                               | Candidate only in private storage                | A five-minute signed link after the server verifies application or candidate-database access                  |
| Application and its submitted resume | Candidate and recruiter responsible for that job | Administrators only for documented support, security, or legal work                                           |
| Messages                             | Conversation participants                        | Administrators only for documented support, security, or legal work                                           |
| Contact submissions                  | Authorized support/admin workflows               | No public or recruiter access                                                                                 |
| Demographic responses                | Candidate only                                   | No recruiter, employer candidate-list, resume-database, ranking, matching, or hiring-decision access          |

Changing profile visibility does not erase an application already delivered to
an employer. The account settings page must explain this distinction before a
candidate makes a profile discoverable.

## Data minimization

Gender, ethnicity, veteran status, disability status, and self-description
fields are optional. They must not be used in search, ranking, matching,
recommendations, applicant review, or employer-facing exports. Their continued
collection requires a documented business purpose and legal review. If that
purpose is not approved before launch, remove these questions and delete the
stored values.

These responses are stored separately from general profiles in an owner-only
table. General profile rows do not contain demographic columns.

Application notes must never be placed in analytics events or ordinary logs.
Resumes, phone numbers, email addresses, employment history, and demographic
responses are sensitive values and must be removed or masked by the structured
logger's redactor.

## User controls

- Users can download a no-cache JSON export of their account data.
- Users can delete an uploaded resume independently of their account.
- Account deletion has a 14-day cancellation grace period. Final deletion must
  not run before `deletion_requested_at + 14 days`.
- Notification preferences record consent state, including global unsubscribe.
  Transactional messages required to operate an account remain separate from
  marketing consent.
- Each successful account-settings preference change appends a redacted
  `account.communication_preferences_updated` security-audit event. It records
  channel booleans and the settings source, but no email address or content.

## Retention schedule

These are the engineering defaults to implement and verify before production
automation is enabled:

| Record                                | Default retention                          | Deletion trigger                                                                  |
| ------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| Contact messages                      | 12 months                                  | `created_at` exceeds 12 months                                                    |
| Read notifications                    | 180 days                                   | Read and older than 180 days                                                      |
| Ingestion runs                        | 30 days                                    | Existing operational cleanup job                                                  |
| Imported jobs without user references | Closed/expired plus 7 days                 | Existing operational cleanup job                                                  |
| Applications                          | 24 months after last update                | Only after the associated hiring activity is closed and no legal hold applies     |
| Conversations and messages            | 24 months after last conversation activity | Delete the conversation so dependent messages are removed consistently            |
| Security and role audit logs          | 24 months                                  | Age threshold, except records under an incident or legal hold                     |
| Billing records                       | Provider and statutory requirements        | Do not delete merely because the account is deleted; pseudonymize where permitted |

The application, message, audit, and billing periods require legal approval
before destructive scheduled jobs are enabled. Until then, report eligible row
counts without deleting those records.

## Account deletion workflow

1. Authenticate the requester and record the deletion request.
2. Allow cancellation for 14 full days.
3. At grace-period expiry, stop active sessions and subscriptions as required.
4. Delete private storage objects, including resumes and avatars.
5. Delete or anonymize database records in a transaction, preserving only data
   that has an approved legal, fraud-prevention, billing, or security basis.
6. Record completion without copying personal values into the audit event.
7. Propagate deletion to search indexes, caches, analytics, and subprocessors.

The internal deletion worker uses `CRON_SECRET` authentication and processes at
most ten accounts per invocation. It remains report-only unless
`ACCOUNT_DELETION_EXECUTION_ENABLED=true`. Responses contain aggregate counts
only; they never expose user identifiers, emails, or storage paths.
The production scheduler invokes it daily at 05:30 UTC. Active Stripe
subscriptions are cancelled before any database anonymization; a Stripe failure
stops that account and leaves it eligible for a later retry.

## Backups and deletion propagation

Database backups cannot generally support selective row deletion. Deleted data
may therefore remain encrypted and inaccessible in rotating backups until the
provider's backup-retention window expires. A restored backup must replay the
deletion ledger before serving traffic. Document the actual Supabase backup
window and every subprocessor's deletion SLA in the production runbook.

## Verification requirements

- Regression tests prevent protected demographic columns from entering
  employer candidate and resume-database loaders.
- RLS integration tests verify private-profile and cross-employer isolation.
- Export and deletion endpoints test unauthenticated, failure, rate-limit, and
  successful boundaries.
- Retention jobs first run in report-only mode and publish row counts. A human
  reviews the counts before deletion is enabled.
