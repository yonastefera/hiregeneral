# HireGeneral legal launch checklist

The public legal drafts are an engineering implementation aid, not legal advice
and not approved launch documents. A licensed attorney must approve them before
`legalPolicyRelease.approvalStatus` is changed to `published` and
`acceptanceRequired` is enabled.

## Confirmed business inputs

- Intended entity: HireGeneral LLC (formation pending)
- Public mailing address: 1165 Spring Wood Connector, Atlanta, GA 30328
- Legal contact: legal@hiregeneral.com
- Privacy contact: privacy@hiregeneral.com
- Support contact: support@hiregeneral.com
- Proposed governing law: Georgia
- Proposed exclusive venue: state and federal courts serving Fulton County,
  Georgia
- Proposed dispute process: 30-day good-faith informal resolution period,
  followed by court proceedings; no arbitration or class waiver is included in
  the draft

## Counsel approval required

- Confirm the entity exists and the legal name/address are accurate.
- Approve governing law, venue, dispute, liability, indemnity, and billing terms.
- Confirm applicant-data, employment-agency, equal-opportunity, job-accuracy,
  and marketplace disclaimers.
- Confirm state privacy notices, retention periods, cookie/analytics consent,
  international access, and subprocessor disclosures.
- Decide whether separate employer data-processing terms are required.
- Assign final immutable version IDs and effective dates.

## Publication procedure

1. Apply counsel's final text without changing product claims that have not been
   verified against the implementation.
2. Change the policy version IDs in `src/legal/policy-release.ts`.
3. Set `approvalStatus` to `published` and `acceptanceRequired` to `true`.
4. Apply the legal-policy-acceptance migration in production and test.
5. Verify new users cannot choose a workspace without accepting both linked
   policies and that both version records are written.
6. Retain prior policy versions and acceptance records.
