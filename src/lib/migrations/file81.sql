-- Clean Eightfold search URLs that were originally captured from single-job
-- detail links. The adapter uses source_url to bootstrap a session, so keeping
-- pid out of the URL helps it ingest the full search result set.

UPDATE public.job_sources
SET
  source_url = 'https://searchjobs.libertymutualgroup.com/careers?department=Data%20Science&department=Technology&department=Analytics&domain=libertymutual.com&sort_by=relevance&triggerGoButton=true',
  metadata = metadata || '{
    "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"]
  }'::jsonb,
  notes = 'Eightfold source. Searches Liberty Mutual software, technology, data science, analytics, cloud, and security roles in the United States.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'liberty-mutual-eightfold-technology';

UPDATE public.job_sources
SET
  source_url = 'https://careers.newyorklife.com/careers?Category=technology&Category=data%20%2F%20ai&domain=newyorklife.com&sort_by=relevance&triggerGoButton=true',
  metadata = metadata || '{
    "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"]
  }'::jsonb,
  notes = 'Eightfold source. Searches New York Life software, technology, data/AI, analytics, cloud, and security roles in the United States.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'new-york-life-eightfold-technology';
