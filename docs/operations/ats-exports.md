# ATS integrations and exports

HireGeneral provides a company-scoped application interchange boundary at
`GET /api/employers/exports/applications`.

## Formats

- `format=csv` returns UTF-8 CSV for spreadsheet and ATS import workflows.
- `format=json` returns export version `1` for connector scripts and internal
  reporting tools.
- `jobId=all` exports every company job. A company-owned job UUID limits the
  export to one role.

The response includes application and job identifiers, candidate contact fields,
current status and pipeline stage, relevant application answers, and timestamps.
It excludes resumes, cover notes, scorecards, demographics, and internal user IDs.

## Controls

- Only authenticated company owners and administrators may export.
- Queries are explicitly scoped to the caller's company as well as protected by
  row-level security.
- Exports are limited to the newest 5,000 applications and ten requests per day.
- Responses use private no-store caching headers.
- CSV cells that spreadsheet software could interpret as formulas are prefixed
  safely before quoting.
- Every successful export is written to the security audit log with company,
  format, filter, and row count metadata.

This interchange layer does not claim native two-way synchronization with an ATS.
Vendor-specific OAuth, credential storage, delivery retries, and reconciliation
must be implemented and tested before advertising a native integration.
