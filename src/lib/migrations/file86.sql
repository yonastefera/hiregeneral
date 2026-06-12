-- Add the next batch of technology/data job sources.
-- Caterpillar remains disabled because its public careers page is Cloudflare-blocked
-- from server-side ingestion in this environment.

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
      'Allspring Global Investments',
      'allspringglobal.com',
      'scraper',
      'allspring-icims-technology-data',
      'https://careers-allspringglobal.icims.com/jobs/search?hashed=-625854159&mobile=false&width=1756&height=500&bga=true&needsRedirect=false&jan1offset=-300&jun1offset=-240',
      true,
      '{
        "adapter":"icims",
        "category":"Technology",
        "companyWebsite":"https://careers-allspringglobal.icims.com/jobs/search",
        "publicBase":"https://careers-allspringglobal.icims.com",
        "maxJobs":50
      }'::jsonb,
      'iCIMS source. Imports US technology, software, security, analytics, and data roles.'
    ),
    (
      'OTR Capital',
      'otrcapital.com',
      'greenhouse',
      'otrcapital1',
      'https://job-boards.greenhouse.io/otrcapital1',
      true,
      '{
        "companyWebsite":"https://www.otrcapital.com/careers",
        "publicBase":"https://job-boards.greenhouse.io/otrcapital1",
        "searchText":"technology"
      }'::jsonb,
      'Greenhouse source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Hermeus',
      'hermeus.com',
      'lever',
      'hermeus',
      'https://jobs.lever.co/hermeus',
      true,
      '{
        "companyWebsite":"https://www.hermeus.com/careers",
        "publicBase":"https://jobs.lever.co/hermeus",
        "searchText":"technology"
      }'::jsonb,
      'Lever source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Pinterest',
      'pinterest.com',
      'greenhouse',
      'pinterest',
      'https://www.pinterestcareers.com/jobs/?search=&pagesize=20#results',
      true,
      '{
        "companyWebsite":"https://www.pinterestcareers.com/jobs/",
        "publicBase":"https://www.pinterestcareers.com/jobs/",
        "searchText":"technology"
      }'::jsonb,
      'Existing Greenhouse source refreshed from the current Pinterest careers URL.'
    ),
    (
      'Mercor',
      'mercor.com',
      'ashby',
      'mercor',
      'https://www.mercor.com/careers/',
      true,
      '{
        "boardName":"mercor",
        "companyWebsite":"https://www.mercor.com/careers/",
        "publicBase":"https://jobs.ashbyhq.com/mercor",
        "searchText":"technology"
      }'::jsonb,
      'Ashby source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Vanta',
      'vanta.com',
      'ashby',
      'vanta',
      'https://www.vanta.com/company/careers#open-roles',
      true,
      '{
        "boardName":"vanta",
        "companyWebsite":"https://www.vanta.com/company/careers",
        "publicBase":"https://jobs.ashbyhq.com/vanta",
        "searchText":"technology"
      }'::jsonb,
      'Ashby source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Southern Glazer''s Wine & Spirits',
      'southernglazers.com',
      'scraper',
      'southern-glazers-technology',
      'https://jobs.southernglazers.com/?country=US&state=&city=&category=IT&spage=1',
      true,
      '{
        "adapter":"southern-glazers",
        "category":"Information Technology",
        "companyWebsite":"https://jobs.southernglazers.com/",
        "publicBase":"https://jobs.southernglazers.com",
        "maxPages":3
      }'::jsonb,
      'Server-rendered careers source. Imports US IT, software, data, QA, SAP, platform, and security roles.'
    ),
    (
      'Caterpillar',
      'caterpillar.com',
      'scraper',
      'caterpillar-careers-blocked',
      'https://careers.caterpillar.com/en/jobs/?search=&team=Technology%2C+Digital+and+Data&country=United+States+of+America#results',
      false,
      '{
        "adapterNeeded":"cloudflare_blocked_careers_page",
        "blockedStatus":403,
        "category":"Technology, Digital and Data",
        "country":"United States of America",
        "companyWebsite":"https://careers.caterpillar.com/en/jobs/"
      }'::jsonb,
      'Updated requested Caterpillar technology/data URL. Kept disabled because the careers page returns a Cloudflare block to server-side ingestion.'
    )
)
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
WHERE job_sources.source_slug = sources.source_slug;

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
      'Allspring Global Investments',
      'allspringglobal.com',
      'scraper',
      'allspring-icims-technology-data',
      'https://careers-allspringglobal.icims.com/jobs/search?hashed=-625854159&mobile=false&width=1756&height=500&bga=true&needsRedirect=false&jan1offset=-300&jun1offset=-240',
      true,
      '{
        "adapter":"icims",
        "category":"Technology",
        "companyWebsite":"https://careers-allspringglobal.icims.com/jobs/search",
        "publicBase":"https://careers-allspringglobal.icims.com",
        "maxJobs":50
      }'::jsonb,
      'iCIMS source. Imports US technology, software, security, analytics, and data roles.'
    ),
    (
      'OTR Capital',
      'otrcapital.com',
      'greenhouse',
      'otrcapital1',
      'https://job-boards.greenhouse.io/otrcapital1',
      true,
      '{
        "companyWebsite":"https://www.otrcapital.com/careers",
        "publicBase":"https://job-boards.greenhouse.io/otrcapital1",
        "searchText":"technology"
      }'::jsonb,
      'Greenhouse source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Hermeus',
      'hermeus.com',
      'lever',
      'hermeus',
      'https://jobs.lever.co/hermeus',
      true,
      '{
        "companyWebsite":"https://www.hermeus.com/careers",
        "publicBase":"https://jobs.lever.co/hermeus",
        "searchText":"technology"
      }'::jsonb,
      'Lever source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Pinterest',
      'pinterest.com',
      'greenhouse',
      'pinterest',
      'https://www.pinterestcareers.com/jobs/?search=&pagesize=20#results',
      true,
      '{
        "companyWebsite":"https://www.pinterestcareers.com/jobs/",
        "publicBase":"https://www.pinterestcareers.com/jobs/",
        "searchText":"technology"
      }'::jsonb,
      'Existing Greenhouse source refreshed from the current Pinterest careers URL.'
    ),
    (
      'Mercor',
      'mercor.com',
      'ashby',
      'mercor',
      'https://www.mercor.com/careers/',
      true,
      '{
        "boardName":"mercor",
        "companyWebsite":"https://www.mercor.com/careers/",
        "publicBase":"https://jobs.ashbyhq.com/mercor",
        "searchText":"technology"
      }'::jsonb,
      'Ashby source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Vanta',
      'vanta.com',
      'ashby',
      'vanta',
      'https://www.vanta.com/company/careers#open-roles',
      true,
      '{
        "boardName":"vanta",
        "companyWebsite":"https://www.vanta.com/company/careers",
        "publicBase":"https://jobs.ashbyhq.com/vanta",
        "searchText":"technology"
      }'::jsonb,
      'Ashby source. Imports US engineering, technology, data, and security roles.'
    ),
    (
      'Southern Glazer''s Wine & Spirits',
      'southernglazers.com',
      'scraper',
      'southern-glazers-technology',
      'https://jobs.southernglazers.com/?country=US&state=&city=&category=IT&spage=1',
      true,
      '{
        "adapter":"southern-glazers",
        "category":"Information Technology",
        "companyWebsite":"https://jobs.southernglazers.com/",
        "publicBase":"https://jobs.southernglazers.com",
        "maxPages":3
      }'::jsonb,
      'Server-rendered careers source. Imports US IT, software, data, QA, SAP, platform, and security roles.'
    ),
    (
      'Caterpillar',
      'caterpillar.com',
      'scraper',
      'caterpillar-careers-blocked',
      'https://careers.caterpillar.com/en/jobs/?search=&team=Technology%2C+Digital+and+Data&country=United+States+of+America#results',
      false,
      '{
        "adapterNeeded":"cloudflare_blocked_careers_page",
        "blockedStatus":403,
        "category":"Technology, Digital and Data",
        "country":"United States of America",
        "companyWebsite":"https://careers.caterpillar.com/en/jobs/"
      }'::jsonb,
      'Updated requested Caterpillar technology/data URL. Kept disabled because the careers page returns a Cloudflare block to server-side ingestion.'
    )
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
  FROM public.job_sources AS job_sources
  WHERE job_sources.source_slug = sources.source_slug
);
