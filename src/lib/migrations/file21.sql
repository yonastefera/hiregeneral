-- Add American Express as an Oracle Cloud HCM source.
-- Uses Technology + United States facets to keep the feed focused.

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
  'American Express',
  'americanexpress.com',
  'oracle_hcm',
  'american-express-cx-1',
  'https://careers.americanexpress.com/en/sites/CX_1/jobs?lastSelectedFacet=CATEGORIES&selectedCategoriesFacet=300000081299474&selectedLocationsFacet=300000000229164',
  true,
  '{
    "apiBase":"https://egug.fa.us2.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
    "publicBase":"https://careers.americanexpress.com/en/sites/CX_1",
    "siteNumber":"CX_1",
    "searchText":"technology",
    "countryCode":"US",
    "selectedLocationsFacet":"300000000229164",
    "selectedCategoriesFacet":"300000081299474"
  }'::jsonb,
  'Oracle Cloud HCM source. Uses Technology and United States facets before defensive US/engineering filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
