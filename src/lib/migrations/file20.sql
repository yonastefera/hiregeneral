-- Add JPMorgan Chase as an Oracle Cloud HCM source.
-- Uses Software Engineering + United States facets to avoid broad branch/client roles.

INSERT INTO public.job_sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata,
  notes
)
VALUES (
  'JPMorgan Chase',
  'jpmorganchase.com',
  'oracle_hcm',
  'jpmorgan-chase-cx-1001',
  'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs?lastSelectedFacet=CATEGORIES&selectedCategoriesFacet=300000086152753&selectedLocationsFacet=300000000289738',
  true,
  '{
    "apiBase":"https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
    "publicBase":"https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001",
    "siteNumber":"CX_1001",
    "searchText":"technology",
    "countryCode":"US",
    "selectedLocationsFacet":"300000000289738",
    "selectedCategoriesFacet":"300000086152753"
  }'::jsonb,
  'Oracle Cloud HCM source. Uses Software Engineering and United States facets before defensive US/engineering filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
