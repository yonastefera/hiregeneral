-- Additional requested employer sources.
-- Cox can run today through the Workday adapter.
-- The remaining sources are recorded disabled until their adapters are implemented.

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
    'Cox Communications',
    'cox.com',
    'workday',
    'Cox_External_Career_Site_1',
    'https://cox.wd1.myworkdayjobs.com/en-US/Cox_External_Career_Site_1',
    true,
    '{"tenant":"cox","site":"Cox_External_Career_Site_1","publicBase":"https://cox.wd1.myworkdayjobs.com/en-US/Cox_External_Career_Site_1","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'CNN',
    'cnn.com',
    'scraper',
    'warner-bros-discovery-cnn',
    'https://careers.wbd.com/global/en/search-results',
    false,
    '{"adapterNeeded":"phenom_or_scraper","parentCompany":"Warner Bros. Discovery","searchText":"CNN technology"}'::jsonb,
    'Disabled until a WBD/Phenom-style adapter is implemented.'
  ),
  (
    'Disney',
    'disney.com',
    'scraper',
    'disney-careers',
    'https://www.disneycareers.com/en/search_jobs',
    false,
    '{"adapterNeeded":"disney_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until a Disney careers adapter or scraper is implemented.'
  ),
  (
    'Marriott International',
    'marriott.com',
    'scraper',
    'marriott-careers',
    'https://careers.marriott.com/jobs',
    false,
    '{"adapterNeeded":"marriott_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until a Marriott careers adapter or scraper is implemented.'
  ),
  (
    'Progressive Insurance',
    'progressive.com',
    'scraper',
    'progressive-careers',
    'https://careers.progressive.com/search/jobs/',
    false,
    '{"adapterNeeded":"progressive_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until a Progressive careers adapter or scraper is implemented.'
  ),
  (
    'Morgan Stanley',
    'morganstanley.com',
    'scraper',
    'morgan-stanley-eightfold',
    'https://morganstanley.eightfold.ai/careers?domain=morganstanley.com',
    false,
    '{"adapterNeeded":"eightfold","searchText":"technology"}'::jsonb,
    'Disabled until an Eightfold adapter is implemented.'
  ),
  (
    'Red Ventures',
    'redventures.com',
    'scraper',
    'red-ventures-careers',
    'https://www.redventures.com/careers/positions/open',
    false,
    '{"adapterNeeded":"scraper","searchText":"technology"}'::jsonb,
    'Disabled until a Red Ventures scraper is implemented.'
  ),
  (
    'UnitedHealth Group',
    'unitedhealthgroup.com',
    'scraper',
    'unitedhealth-group-careers',
    'https://www.unitedhealthgroup.com/careers/en/work.html',
    false,
    '{"adapterNeeded":"unitedhealth_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until a UnitedHealth careers adapter or scraper is implemented.'
  ),
  (
    'Piedmont Healthcare',
    'piedmont.org',
    'scraper',
    'piedmont-healthcare-careers',
    'https://piedmontcareers.org/job/',
    false,
    '{"adapterNeeded":"piedmont_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until a Piedmont careers adapter or scraper is implemented.'
  ),
  (
    'Emory Healthcare',
    'emoryhealthcare.org',
    'scraper',
    'emory-healthcare-careers',
    'https://www.emoryhealthcare.org/careers/',
    false,
    '{"adapterNeeded":"emory_or_icims_or_scraper","searchText":"technology"}'::jsonb,
    'Disabled until an Emory careers adapter or scraper is implemented.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
