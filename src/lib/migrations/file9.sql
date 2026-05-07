-- Additional employer sources for the first curated finance/enterprise batch.
-- Only Workday sources are included because the Workday adapter is implemented.

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
    'Wells Fargo',
    'wellsfargo.com',
    'workday',
    'WellsFargoJobs',
    'https://wf.wd1.myworkdayjobs.com/en-US/WellsFargoJobs',
    true,
    '{"tenant":"wf","site":"WellsFargoJobs","publicBase":"https://wf.wd1.myworkdayjobs.com/en-US/WellsFargoJobs","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'PNC Bank',
    'pnc.com',
    'workday',
    'External',
    'https://pnc.wd5.myworkdayjobs.com/en-US/External',
    true,
    '{"tenant":"pnc","site":"External","publicBase":"https://pnc.wd5.myworkdayjobs.com/en-US/External","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Bank of America',
    'bankofamerica.com',
    'workday',
    'Lateral-US',
    'https://ghr.wd1.myworkdayjobs.com/en-US/Lateral-US',
    true,
    '{"tenant":"ghr","site":"Lateral-US","publicBase":"https://ghr.wd1.myworkdayjobs.com/en-US/Lateral-US","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
