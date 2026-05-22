-- Add T-Mobile and Thermo Fisher technology job sources.
-- Caterpillar and RTX are recorded as disabled discovery records because
-- their careers pages returned 403 challenges to the ingestion client.
-- Hilton uses Taleo for application submission, so the Phenom adapter should
-- send candidates to Hilton's public job detail pages first.

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
    'T-Mobile',
    't-mobile.com',
    'workday',
    't-mobile-external',
    'https://tmobile.wd1.myworkdayjobs.com/en-US/External',
    true,
    '{
      "tenant":"tmobile",
      "site":"External",
      "publicBase":"https://tmobile.wd1.myworkdayjobs.com/en-US/External",
      "searchText":"software",
      "appliedFacets":{
        "Job_Family_Group":["426b19690b7b1036f85d91748cc80a51"],
        "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"]
      },
      "pageSize":20,
      "maxPages":3
    }'::jsonb,
    'Workday source narrowed to US Information Technology roles before defensive engineering filters.'
  ),
  (
    'Thermo Fisher Scientific',
    'thermofisher.com',
    'phenom',
    'thermo-fisher-phenom',
    'https://jobs.thermofisher.com/global/en/c/it-data-tech-jobs',
    true,
    '{
      "widgetApiEndpoint":"https://jobs.thermofisher.com/widgets",
      "refNum":"TFSCGLOBAL",
      "baseUrl":"https://jobs.thermofisher.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"it-data-tech",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics"],
      "selectedFields":{"category":["IT, Data & Tech"]},
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source. Searches Thermo Fisher IT, Data & Tech roles before defensive US/engineering filters.'
  ),
  (
    'Caterpillar',
    'caterpillar.com',
    'scraper',
    'caterpillar-careers-blocked',
    'https://careers.caterpillar.com/en/jobs/?search=software&country=United%20States',
    false,
    '{
      "adapterNeeded":"blocked_careers_page",
      "blockedStatus":403,
      "searchText":"software",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery record. Caterpillar careers returned a 403 challenge to the ingestion client during discovery.'
  ),
  (
    'RTX',
    'rtx.com',
    'scraper',
    'rtx-careers-blocked',
    'https://careers.rtx.com/global/en/search-results?keywords=software&from=0&s=1',
    false,
    '{
      "adapterNeeded":"blocked_careers_page",
      "blockedStatus":403,
      "searchText":"software",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery record. RTX careers returned a 403 challenge to the ingestion client during discovery.'
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
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{preferPublicJobUrl}',
    'true'::jsonb,
    true
  ),
  notes = 'Phenom source narrowed to Hilton technology roles before US/engineering filters. Uses public Hilton job detail pages before application handoff.',
  updated_at = now()
WHERE source_type = 'phenom'
  AND source_slug = 'hilton-phenom';

UPDATE public.job_sources
SET
  metadata = '{
    "tenant":"tmobile",
    "site":"External",
    "publicBase":"https://tmobile.wd1.myworkdayjobs.com/en-US/External",
    "searchText":"software",
    "appliedFacets":{
      "Job_Family_Group":["426b19690b7b1036f85d91748cc80a51"],
      "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"]
    },
    "pageSize":20,
    "maxPages":3
  }'::jsonb,
  notes = 'Workday source narrowed to US Information Technology roles before defensive engineering filters.',
  updated_at = now()
WHERE source_type = 'workday'
  AND source_slug = 't-mobile-external';
