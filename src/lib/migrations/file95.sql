-- Refresh Acuity's adapter and add the latest requested IBM, Delta, and Kaiser sources.
-- Uses update-then-insert instead of ON CONFLICT because job_sources does not
-- have a unique constraint for the conflict target in every environment.

WITH sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata,
  notes
) AS (
  VALUES
    (
      'Acuity',
      'acuityinc.com',
      'successfactors',
      'acuity-successfactors-technology-data',
      'https://careers.acuityinc.com/search/',
      true,
      '{
        "publicBase":"https://careers.acuityinc.com",
        "locale":"en_US",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","cloud","security"],
        "locationSearch":"United States",
        "companyWebsite":"https://careers.acuityinc.com/search/"
      }'::jsonb,
      'SuccessFactors RSS source. Searches Acuity United States software, engineering, technology, cloud, security, and data roles.'
    ),
    (
      'IBM',
      'ibm.com',
      'scraper',
      'ibm-careers-custom',
      'https://www.ibm.com/careers/search?field_keyword_05[0]=United%20States',
      false,
      '{
        "adapterNeeded":"ibm-careers-search",
        "scopeId":"careers2",
        "appId":"careers",
        "country":"United States",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","cloud","security"],
        "companyWebsite":"https://www.ibm.com/careers/search"
      }'::jsonb,
      'Disabled discovery row. IBM uses a custom embedded careers search app and needs a dedicated adapter before ingestion can be enabled safely.'
    ),
    (
      'Delta Air Lines',
      'delta.com',
      'scraper',
      'delta-avature-careers',
      'https://delta.avature.net/en_US/careers/SearchJobs/?756=93924&756_format=3726&2884=75200&2884_format=3665&listFilterMode=1',
      false,
      '{
        "adapterNeeded":"avature",
        "waf":"aws_challenge",
        "searchText":"technology",
        "country":"United States",
        "jobRecordsPerPage":12,
        "companyWebsite":"https://delta.avature.net/en_US/careers"
      }'::jsonb,
      'Disabled discovery row. Delta careers is Avature and has returned an AWS WAF challenge to anonymous server-side fetches.'
    ),
    (
      'Kaiser Permanente',
      'kaiserpermanente.org',
      'scraper',
      'kaiser-permanente-talentbrew-technology-data',
      'https://www.kaiserpermanentejobs.org/search-jobs?k=&l=&orgIds=641',
      true,
      '{
        "adapter":"talentbrew",
        "publicBase":"https://www.kaiserpermanentejobs.org",
        "orgId":"641",
        "category":"Technology",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","informatics","cloud","security"],
        "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","security","technology","information technology","informatics","architect","cloud"],
        "maxPages":5,
        "companyWebsite":"https://www.kaiserpermanentejobs.org/search-jobs"
      }'::jsonb,
      'TalentBrew source. Searches Kaiser Permanente United States technology, software, informatics, security, cloud, and data roles.'
    )
),
updated AS (
  UPDATE public.job_sources AS job_sources
  SET
    company_name = sources.company_name,
    company_domain = sources.company_domain,
    source_type = sources.source_type,
    source_url = sources.source_url,
    enabled = sources.enabled,
    metadata = sources.metadata,
    notes = sources.notes,
    updated_at = now()
  FROM sources
  WHERE job_sources.source_slug = sources.source_slug
  RETURNING job_sources.source_slug
)
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
SELECT
  sources.company_name,
  sources.company_domain,
  sources.source_type,
  sources.source_slug,
  sources.source_url,
  sources.enabled,
  sources.metadata,
  sources.notes
FROM sources
WHERE NOT EXISTS (
  SELECT 1
  FROM updated
  WHERE updated.source_slug = sources.source_slug
);
