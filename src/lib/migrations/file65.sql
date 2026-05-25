UPDATE public.job_sources
SET
  source_url = 'https://careers.expediagroup.com/jobs/?keyword=software',
  metadata = metadata || '{
    "adapter":"appcast",
    "publicBase":"https://careers.expediagroup.com",
    "companyWebsite":"https://careers.expediagroup.com/jobs/",
    "category":"Technology",
    "maxPages":1
  }'::jsonb,
  notes = 'Appcast careers source. Imports visible US software/technology roles from Expedia Group careers and applies defensive engineering filters.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'expedia-group-appcast';

UPDATE public.job_sources
SET
  metadata = metadata || '{
    "language":"undefined",
    "keyword":"software"
  }'::jsonb,
  notes = 'Fox careers source. Imports US software/information technology roles from the Fox careers search endpoint.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'fox-careers-technology';
