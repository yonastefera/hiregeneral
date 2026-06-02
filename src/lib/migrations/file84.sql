-- Enable Tyler Technologies jobs through its public Coveo careers search.

UPDATE public.job_sources
SET
  source_type = 'scraper',
  source_url = 'https://www.tylertech.com/careers/job-openings',
  enabled = true,
  metadata = '{
    "adapter":"coveo",
    "publicBase":"https://www.tylertech.com",
    "organizationId":"tylertechnologiesincprod",
    "searchHub":"TylerCareers",
    "category":"Software Engineering",
    "searchTerms":["software engineer","associate software engineer","senior software engineer","data engineer","data scientist","security engineer","devops","cloud engineer","platform engineer","database engineer","systems engineer"],
    "requiredTerms":["software","developer","engineer","data","security","devops","cloud","platform","database","SQL","API",".NET","Java","Python","JavaScript","TypeScript","AWS","Azure"],
    "titleTerms":["software","developer","engineer","data","security","devops","cloud","platform","database","systems"],
    "excludedTitleTerms":["account","sales","marketing","consultant","implementation","customer service","support representative","trainer"],
    "pageSize":25,
    "maxPages":4,
    "companyWebsite":"https://www.tylertech.com/careers/job-openings"
  }'::jsonb,
  notes = 'Coveo source. Extracts Tyler Technologies public careers search token and imports software, data, cloud, platform, DevOps, and security roles.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'tyler-technologies-custom-technology';
