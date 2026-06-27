-- Add the next requested source pool entries.
-- MSK is parked disabled because its current public search page uses a custom
-- Umbraco/Radancy response shape that needs a dedicated adapter.

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
      'Memorial Sloan Kettering Cancer Center',
      'mskcc.org',
      'scraper',
      'msk-umbraco-technology-data',
      'https://careers.mskcc.org/search-jobs?Keyword=&Department=&Location=',
      false,
      '{
        "adapterNeeded":"umbraco-radancy-jobs",
        "publicBase":"https://careers.mskcc.org",
        "searchEndpoint":"https://careers.mskcc.org/umbraco/Surface/Jobs/Search",
        "departments":["Data Science & Analytics","Informatics & Information Technology"],
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","informatics","security"],
        "companyWebsite":"https://careers.mskcc.org/search-jobs"
      }'::jsonb,
      'Disabled discovery row. MSK exposes a custom Umbraco/Radancy search surface; enable after adding a dedicated adapter for the rendered search fragments/API.'
    ),
    (
      'Ro',
      'ro.co',
      'lever',
      'ro',
      'https://ro.co/careers/#open-roles',
      true,
      '{
        "publicBase":"https://jobs.lever.co/ro",
        "companyWebsite":"https://ro.co/careers"
      }'::jsonb,
      'Lever source. Imports Ro United States engineering, data, security, and technology roles from the public Lever board.'
    ),
    (
      'Flatiron Health',
      'flatiron.com',
      'greenhouse',
      'flatironhealth',
      'https://flatiron.com/careers/open-positions',
      true,
      '{
        "publicBase":"https://flatiron.com/careers/open-positions",
        "companyWebsite":"https://flatiron.com/careers/open-positions"
      }'::jsonb,
      'Greenhouse source. Imports Flatiron Health United States engineering and technology roles from the public Greenhouse board.'
    ),
    (
      'Acuity',
      'acuityinc.com',
      'scraper',
      'acuity-successfactors-technology-data',
      'https://careers.acuityinc.com/search/',
      true,
      '{
        "adapter":"successfactors-tile",
        "publicBase":"https://careers.acuityinc.com",
        "category":"Technology",
        "companyWebsite":"https://careers.acuityinc.com/search/"
      }'::jsonb,
      'SuccessFactors tile source. Imports Acuity United States software, product, data, engineering, and technology roles from the public search page.'
    ),
    (
      'Netflix',
      'netflix.com',
      'scraper',
      'netflix-eightfold',
      'https://explore.jobs.netflix.net/careers?location=United%20States&pid=790316328892&domain=netflix.com&sort_by=relevance&triggerGoButton=true',
      true,
      '{
        "adapter":"eightfold",
        "apiBase":"https://explore.jobs.netflix.net",
        "domain":"netflix.com",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud"],
        "location":"United States",
        "category":"Technology",
        "sortBy":"relevance",
        "pageSize":10,
        "maxPages":5,
        "sourceTimeoutMs":120000,
        "fetchDetails":false,
        "enhanceDetails":false,
        "companyWebsite":"https://jobs.netflix.com"
      }'::jsonb,
      'Eightfold source. Refreshes Netflix to search United States technology, software, data, ML, platform, cloud, and security roles while avoiding slow detail fetches.'
    ),
    (
      'Mozilla',
      'mozilla.org',
      'scraper',
      'mozilla',
      'https://www.mozilla.org/en-US/careers/feed/',
      true,
      '{
        "adapter":"atom-feed",
        "feedUrl":"https://www.mozilla.org/en-US/careers/feed/",
        "publicBase":"https://www.mozilla.org",
        "locationFallback":"United States",
        "category":"Technology",
        "companyWebsite":"https://www.mozilla.org/en-US/careers/listings/",
        "maxJobs":80,
        "requireUs":false,
        "requireEngineering":false,
        "excludedTerms":["student worker"]
      }'::jsonb,
      'Atom/RSS feed source. Imports current Mozilla careers feed roles broadly and removes student-worker/internship postings.'
    ),
    (
      'Applied Systems',
      'appliedsystems.com',
      'scraper',
      'applied-systems-icims-technology-data',
      'https://globalcareers-appliedsystems.icims.com/jobs/search?ss=1&searchLocation=12781--',
      true,
      '{
        "adapter":"icims",
        "publicBase":"https://globalcareers-appliedsystems.icims.com",
        "searchUrl":"https://globalcareers-appliedsystems.icims.com/jobs/search?ss=1&searchLocation=12781--",
        "category":"Technology",
        "companyWebsite":"https://globalcareers-appliedsystems.icims.com/jobs/search",
        "maxJobs":50
      }'::jsonb,
      'iCIMS source. Imports Applied Systems United States engineering, software, data, and technology roles from the public iCIMS board.'
    ),
    (
      '2U',
      '2u.com',
      'greenhouse',
      '2u',
      'https://2u.com/careers/jobs/?keyword=&team=&location=215',
      true,
      '{
        "publicBase":"https://2u.com/careers/jobs/",
        "companyWebsite":"https://2u.com/careers/jobs/",
        "departmentTerms":["Technology"],
        "locationTerms":["Crystal City","US Remote"]
      }'::jsonb,
      'Greenhouse source. Imports 2U United States and remote engineering/technology roles from the public Greenhouse board.'
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
    notes = sources.notes
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
