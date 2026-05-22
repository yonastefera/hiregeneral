-- Add Boeing and M3 sources, and widen JPMorgan Chase technology ingestion.

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
    'Boeing',
    'boeing.com',
    'scraper',
    'boeing-talentbrew',
    'https://jobs.boeing.com/search-jobs/software/185/1',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.boeing.com",
      "companyWebsite":"https://jobs.boeing.com",
      "orgId":"185",
      "searchTerms":["software","cybersecurity","data","information technology","systems engineer"],
      "maxPages":8,
      "category":"Technology"
    }'::jsonb,
    'Boeing TalentBrew/Radancy source. Imports US technology roles from Boeing job search pages.'
  ),
  (
    'M3',
    'm3as.com',
    'greenhouse',
    'm3',
    'https://job-boards.greenhouse.io/m3',
    true,
    '{"publicBase":"https://job-boards.greenhouse.io/m3"}'::jsonb,
    'Greenhouse source for M3 hospitality technology roles.'
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

UPDATE public.job_sources
SET
  source_url = 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs?keyword=technology&location=United%20States',
  metadata = '{
    "apiBase":"https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
    "publicBase":"https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001",
    "siteNumber":"CX_1001",
    "searchTexts":["software","software engineering","developer","cloud","data engineering","technology"],
    "countryCode":"US",
    "pageSize":50,
    "maxPages":12
  }'::jsonb,
  notes = 'Oracle Cloud HCM source. Widened to multiple technology keywords without a single category facet; adapter still applies defensive US/engineering filters.',
  updated_at = now()
WHERE source_type = 'oracle_hcm'
  AND source_slug = 'jpmorgan-chase-cx-1001';
