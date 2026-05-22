-- Add Datavant, Smurfit Westrock, and Oracle technology job sources.
-- Datavant uses Greenhouse, Smurfit Westrock uses a static Avature scraper,
-- and Oracle uses Oracle Cloud HCM with Technology + United States facets.

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
VALUES
  (
    'Datavant',
    'datavant.com',
    'greenhouse',
    'datavant2',
    'https://www.datavant.com/about/careers/open-roles',
    true,
    '{
      "publicBase":"https://www.datavant.com/about/careers/open-roles",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse board source. Adapter imports US engineering/technology roles and removes internships.'
  ),
  (
    'Smurfit Westrock',
    'smurfitwestrock.com',
    'scraper',
    'smurfit-westrock-avature-technology-digital',
    'https://smurfitwestrockta.avature.net/en_US/careers/SearchJobsTechnologyDigital',
    true,
    '{
      "adapter":"avature",
      "category":"Technology Digital",
      "pageSize":10,
      "maxPages":4,
      "publicBase":"https://smurfitwestrockta.avature.net"
    }'::jsonb,
    'Avature static technology/digital source. Scraper adapter imports US engineering/technology roles and removes internships.'
  ),
  (
    'Oracle',
    'oracle.com',
    'oracle_hcm',
    'oracle-jobsearch-technology',
    'https://careers.oracle.com/en/sites/jobsearch/jobs?lastSelectedFacet=CATEGORIES&location=United+States&locationId=300000000149325&selectedCategoriesFacet=300000001917356',
    true,
    '{
      "apiBase":"https://eeho.fa.us2.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
      "publicBase":"https://careers.oracle.com/en/sites/jobsearch",
      "siteNumber":"CX_45001",
      "searchText":"technology",
      "countryCode":"US",
      "selectedLocationsFacet":"300000000149325",
      "selectedCategoriesFacet":"300000001917356"
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
  notes = EXCLUDED.notes,
  updated_at = now();
