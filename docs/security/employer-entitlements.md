# Employer entitlement policy

Reviewed: 2026-08-02

Entitlements are evaluated by `public.current_employer_entitlements()` and
enforced again by database triggers and Row Level Security. UI visibility is
informational only.

| Capability                      |                  Starter or inactive |                        Active Growth |                           Active Pro |
| ------------------------------- | -----------------------------------: | -----------------------------------: | -----------------------------------: |
| Active jobs                     |           Company `active_job_limit` |           Company `active_job_limit` |           Company `active_job_limit` |
| Public resume database          |                                   No |                                  Yes |                                  Yes |
| Candidate invitations per month |                                    0 |                                  100 |                                1,000 |
| Employer messages per month     |                                   50 |                                  500 |                                5,000 |
| Premium analytics               |                                   No |                                   No |                                  Yes |
| Boosts                          | One stored credit per selected boost | One stored credit per selected boost | One stored credit per selected boost |

Recruiters on every plan retain access to profiles belonging to applicants for
their own jobs. Administrators bypass plan limits. Subscription states other
than `active` and `trialing` receive Starter entitlements.
