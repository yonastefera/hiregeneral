-- Additional Workday employer sources.
-- These can run through the existing Workday adapter, except Primerica which
-- is recorded disabled until a custom/scraper adapter is implemented.

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
    'AIG',
    'aig.com',
    'workday',
    'aig',
    'https://aig.wd1.myworkdayjobs.com/en-US/aig',
    true,
    '{"tenant":"aig","site":"aig","publicBase":"https://aig.wd1.myworkdayjobs.com/en-US/aig","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Wolters Kluwer',
    'wolterskluwer.com',
    'workday',
    'wolters-kluwer-external',
    'https://wk.wd3.myworkdayjobs.com/External',
    true,
    '{"tenant":"wk","site":"External","publicBase":"https://wk.wd3.myworkdayjobs.com/External","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Moog',
    'moog.com',
    'workday',
    'MOOG_External_Career_Site',
    'https://moog.wd5.myworkdayjobs.com/en-US/MOOG_External_Career_Site',
    true,
    '{"tenant":"moog","site":"MOOG_External_Career_Site","publicBase":"https://moog.wd5.myworkdayjobs.com/en-US/MOOG_External_Career_Site","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Stanley Black & Decker',
    'stanleyblackanddecker.com',
    'workday',
    'Stanley_Black_Decker_Career_Site',
    'https://sbdinc.wd1.myworkdayjobs.com/Stanley_Black_Decker_Career_Site',
    true,
    '{"tenant":"sbdinc","site":"Stanley_Black_Decker_Career_Site","publicBase":"https://sbdinc.wd1.myworkdayjobs.com/Stanley_Black_Decker_Career_Site","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Sun Life',
    'sunlife.com',
    'workday',
    'Experienced-Jobs',
    'https://sunlife.wd3.myworkdayjobs.com/en-US/Experienced-Jobs',
    true,
    '{"tenant":"sunlife","site":"Experienced-Jobs","publicBase":"https://sunlife.wd3.myworkdayjobs.com/en-US/Experienced-Jobs","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Northwestern Mutual',
    'northwesternmutual.com',
    'workday',
    'CORPORATE-CAREERS',
    'https://northwesternmutual.wd5.myworkdayjobs.com/en-US/CORPORATE-CAREERS',
    true,
    '{"tenant":"northwesternmutual","site":"CORPORATE-CAREERS","publicBase":"https://northwesternmutual.wd5.myworkdayjobs.com/en-US/CORPORATE-CAREERS","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'NCR Voyix',
    'ncrvoyix.com',
    'workday',
    'ext_us',
    'https://ncr.wd1.myworkdayjobs.com/ext_us',
    true,
    '{"tenant":"ncr","site":"ext_us","publicBase":"https://ncr.wd1.myworkdayjobs.com/ext_us","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Snap Finance',
    'snapfinance.com',
    'workday',
    'Snap_External_Careers',
    'https://snapfinance.wd1.myworkdayjobs.com/Snap_External_Careers',
    true,
    '{"tenant":"snapfinance","site":"Snap_External_Careers","publicBase":"https://snapfinance.wd1.myworkdayjobs.com/Snap_External_Careers","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Primerica',
    'primerica.com',
    'scraper',
    'primerica-corporate-careers',
    'https://primerica.com/public/primerica-corporate-careers.html',
    false,
    '{"adapterNeeded":"primerica_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until a Primerica careers adapter or scraper is implemented.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
