-- Add Macy's as an Oracle Cloud HCM source using the Technology category facet.

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
  'Macy''s',
  'macys.com',
  'oracle_hcm',
  'macys-cx-1001',
  'https://ebwh.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001',
  true,
  '{
    "apiBase":"https://ebwh.fa.us2.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
    "publicBase":"https://ebwh.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001",
    "siteNumber":"CX_1001",
    "searchText":"technology",
    "countryCode":"US",
    "selectedCategoriesFacet":"300000365287230"
  }'::jsonb,
  'Oracle Cloud HCM source. Uses Macy''s Technology category facet to avoid broad retail listings.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
