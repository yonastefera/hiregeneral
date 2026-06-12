-- Add Guardian Life, AmTrust, Oscar Health, EmblemHealth, and Highmark Health sources.
-- Oscar Health and EmblemHealth are parked until dedicated adapters are added.

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
      'Guardian Life',
      'guardianlife.com',
      'workday',
      'guardian-life-workday-technology',
      'https://guardianlife.wd5.myworkdayjobs.com/Guardian-Life-Careers?jobFamilyGroup=bd712756cc3801ad2237d907ec653ed0&locations=7b5044eed500454fb4f93fa6ebaa040a&locations=25aed0ba583c4d669186997724bc572f&locations=5bb94884913b4e8c98d00634c6cab717',
      true,
      '{
        "tenant":"guardianlife",
        "site":"Guardian-Life-Careers",
        "apiBase":"https://guardianlife.wd5.myworkdayjobs.com/wday/cxs/guardianlife/Guardian-Life-Careers",
        "publicBase":"https://guardianlife.wd5.myworkdayjobs.com/Guardian-Life-Careers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "jobFamilyGroup":["bd712756cc3801ad2237d907ec653ed0"],
          "locations":["7b5044eed500454fb4f93fa6ebaa040a","25aed0ba583c4d669186997724bc572f","5bb94884913b4e8c98d00634c6cab717"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Searches Guardian Life technology, data, analytics, software, cloud, security, and AI roles for the selected family group and locations.'
    ),
    (
      'AmTrust Financial Services',
      'amtrustfinancial.com',
      'scraper',
      'amtrust-icims-technology',
      'https://careers-amtrustgroup.icims.com/jobs/search?ss=1&searchCategory=8730&searchLocation=12781--',
      true,
      '{
        "adapter":"icims",
        "publicBase":"https://careers-amtrustgroup.icims.com",
        "searchUrl":"https://careers-amtrustgroup.icims.com/jobs/search?ss=1&searchCategory=8730&searchLocation=12781--",
        "category":"Technology",
        "companyWebsite":"https://careers-amtrustgroup.icims.com/jobs/search",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "maxJobs":50
      }'::jsonb,
      'iCIMS source. Imports AmTrust United States technology, data, analytics, software, cloud, security, and AI roles from category 8730.'
    ),
    (
      'Oscar Health',
      'hioscar.com',
      'scraper',
      'oscar-health-careers',
      'https://www.hioscar.com/careers/search?department=-1&location=-1',
      false,
      '{
        "adapterNeeded":"hioscar-careers-api",
        "companyWebsite":"https://www.hioscar.com/careers/search",
        "publicBase":"https://www.hioscar.com/careers",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"]
      }'::jsonb,
      'Parked source. Oscar Health renders career results through a client-side app; enable after adding a dedicated hioscar careers API adapter.'
    ),
    (
      'EmblemHealth',
      'emblemhealth.com',
      'scraper',
      'emblemhealth-selectminds-technology',
      'https://careers.emblemhealth.com/jobs/search/3695823',
      false,
      '{
        "adapterNeeded":"selectminds",
        "searchId":"3695823",
        "publicBase":"https://careers.emblemhealth.com",
        "apiBase":"https://cognizanthc.referrals.selectminds.com",
        "companyWebsite":"https://careers.emblemhealth.com/jobs/search/3695823",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"]
      }'::jsonb,
      'Parked source. EmblemHealth uses the SelectMinds/Taleo search flow; enable after adding a generic SelectMinds adapter.'
    ),
    (
      'Highmark Health',
      'highmarkhealth.org',
      'scraper',
      'highmark-health-paradox-hnas',
      'https://careers.highmarkhealth.org/jobs?keyword=HNAS',
      true,
      '{
        "adapter":"paradox-preload",
        "category":"Technology",
        "companyWebsite":"https://careers.highmarkhealth.org/jobs",
        "maxPages":1,
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai","HNAS"]
      }'::jsonb,
      'Paradox preload source. Imports Highmark Health HNAS and technology-adjacent roles from the public preload job search payload.'
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
