-- Add Playrix, Cortland, and XPO technology job sources.
-- Playrix uses a narrow custom scraper adapter against its public JSON careers endpoint.
-- Cortland is Greenhouse; it may import few or zero roles unless the board has real tech/engineering jobs.
-- XPO uses a SuccessFactors corporate category RSS feed.

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
    'Playrix',
    'playrix.com',
    'scraper',
    'playrix-careers',
    'https://playrix.com/job/open',
    true,
    '{
      "adapter":"playrix",
      "apiUrl":"https://playrix.com/api/v1/index.php?action=job/getList",
      "publicBase":"https://playrix.com",
      "defaultLocation":"Remote"
    }'::jsonb,
    'Playrix JSON careers source. Custom scraper adapter imports software/game technology roles and removes internships.'
  ),
  (
    'Cortland',
    'cortland.com',
    'greenhouse',
    'cortland',
    'https://job-boards.greenhouse.io/cortland?field_5271946009%5B%5D=9739646009',
    true,
    '{
      "sourceFilter":"field_5271946009=9739646009",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse board source. Adapter imports US engineering/technology roles and removes internships; hosted field filter is recorded for traceability.'
  ),
  (
    'XPO',
    'xpo.com',
    'successfactors',
    'xpo-corporate-successfactors',
    'https://jobs.xpo.com/go/Corporate/2520200/',
    true,
    '{
      "publicBase":"https://jobs.xpo.com",
      "locale":"en_US",
      "searchText":"technology",
      "rssUrl":"https://jobs.xpo.com/services/rss/category/?catid=2520200"
    }'::jsonb,
    'SuccessFactors corporate category RSS source. Adapter imports US engineering/technology roles and removes internships.'
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
