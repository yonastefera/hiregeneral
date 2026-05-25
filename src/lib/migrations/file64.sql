-- Add Paramount, Expedia Group, Fox, Jellyfish, and Citi career-board sources.

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
    'Paramount',
    'paramount.com',
    'successfactors',
    'paramount-successfactors',
    'https://careers.paramount.com/search/',
    true,
    '{
      "locale":"en_US",
      "publicBase":"https://careers.paramount.com",
      "searchText":"technology",
      "rssUrl":"https://careers.paramount.com/services/rss/job/?locale=en_US&keywords=(technology)"
    }'::jsonb,
    'SuccessFactors RSS source. Adapter imports US engineering/technology roles and removes internships.'
  ),
  (
    'Expedia Group',
    'expediagroup.com',
    'scraper',
    'expedia-group-appcast',
    'https://careers.expediagroup.com/jobs/?keyword=software',
    true,
    '{
      "adapter":"appcast",
      "publicBase":"https://careers.expediagroup.com",
      "companyWebsite":"https://careers.expediagroup.com/jobs/",
      "category":"Technology",
      "maxPages":1
    }'::jsonb,
    'Appcast careers source. Imports visible US technology roles from Expedia Group careers and applies defensive engineering filters.'
  ),
  (
    'Fox Corporation',
    'fox.com',
    'scraper',
    'fox-careers-technology',
    'https://www.foxcareers.com/Search/SearchResults?jobFunction=Information%20Technology_Technology&country=United%20States%20of%20America',
    true,
    '{
      "adapter":"fox",
      "apiUrl":"https://www.foxcareers.com/Search/JobsList/",
      "publicBase":"https://www.foxcareers.com",
      "companyWebsite":"https://www.foxcareers.com/Search/SearchResults?jobFunction=Information%20Technology_Technology&country=United%20States%20of%20America",
      "jobFunction":"Information Technology_Technology",
      "country":"United States of America",
      "location":"",
      "brand":"",
      "language":"undefined",
      "category":"Technology",
      "maxPages":4
    }'::jsonb,
    'Fox careers source. Imports US information technology roles from the Fox careers search endpoint.'
  ),
  (
    'Jellyfish',
    'jellyfish.co',
    'ashby',
    'jellyfish',
    'https://jellyfish.co/company/careers/jobs/',
    true,
    '{"boardName":"Jellyfish"}'::jsonb,
    'Ashby source. Adapter imports US engineering roles and removes internships.'
  ),
  (
    'Citi',
    'citi.com',
    'scraper',
    'citi-talentbrew',
    'https://jobs.citi.com/search-jobs/software/287/1',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.citi.com",
      "companyWebsite":"https://jobs.citi.com/search-jobs",
      "orgId":"287",
      "searchTerms":["software","developer","engineer","technology","cloud","data"],
      "maxPages":10,
      "category":"Technology"
    }'::jsonb,
    'Citi TalentBrew/Radancy source. Imports US technology roles from Citi job search pages.'
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
  enabled = false,
  notes = 'Superseded by citi-talentbrew.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'citi-eightfold-careers';
