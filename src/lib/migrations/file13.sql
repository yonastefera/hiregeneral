-- Additional employer sources requested for the marketplace seed list.
-- Enabled rows use adapters we already support. Disabled rows are recorded as
-- adapter backlog so we can add them deliberately without breaking ingestion.

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
    'Truist Financial Corporation',
    'truist.com',
    'workday',
    'truist-careers',
    'https://truist.wd1.myworkdayjobs.com/en-US/Careers',
    true,
    '{"tenant":"truist","site":"Careers","publicBase":"https://truist.wd1.myworkdayjobs.com/en-US/Careers","searchText":"technology"}'::jsonb,
    'Workday source. Covers Truist and former SunTrust career postings. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'McKesson Corporation',
    'mckesson.com',
    'workday',
    'mckesson-external-careers',
    'https://mckesson.wd3.myworkdayjobs.com/en-US/External_Careers',
    true,
    '{"tenant":"mckesson","site":"External_Careers","publicBase":"https://mckesson.wd3.myworkdayjobs.com/en-US/External_Careers","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'PwC',
    'pwc.com',
    'workday',
    'pwc-us-experienced-careers',
    'https://pwc.wd3.myworkdayjobs.com/en-US/US_Experienced_Careers',
    true,
    '{"tenant":"pwc","site":"US_Experienced_Careers","publicBase":"https://pwc.wd3.myworkdayjobs.com/en-US/US_Experienced_Careers","searchText":"technology"}'::jsonb,
    'Workday source for US experienced careers. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Accenture',
    'accenture.com',
    'workday',
    'accenture-careers',
    'https://accenture.wd103.myworkdayjobs.com/en-US/AccentureCareers',
    true,
    '{"tenant":"accenture","site":"AccentureCareers","publicBase":"https://accenture.wd103.myworkdayjobs.com/en-US/AccentureCareers","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'DIRECTV',
    'directv.com',
    'workday',
    'directv-careers',
    'https://directv.wd1.myworkdayjobs.com/en-US/Careers',
    true,
    '{"tenant":"directv","site":"Careers","publicBase":"https://directv.wd1.myworkdayjobs.com/en-US/Careers","searchText":"technology"}'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Citi Group',
    'citi.com',
    'scraper',
    'citi-eightfold-careers',
    'https://jobs.citi.com/location/united-states-jobs/287/6252001/2',
    false,
    '{"adapterNeeded":"eightfold_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an Eightfold/Citi careers adapter is implemented.'
  ),
  (
    'American Express',
    'americanexpress.com',
    'scraper',
    'american-express-careers',
    'https://www.americanexpress.com/en-us/careers/career-areas/',
    false,
    '{"adapterNeeded":"american_express_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an American Express careers adapter or scraper is implemented.'
  ),
  (
    'Visa',
    'visa.com',
    'scraper',
    'visa-careers',
    'https://corporate.visa.com/en/jobs/',
    false,
    '{"adapterNeeded":"visa_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until a Visa careers adapter or scraper is implemented.'
  ),
  (
    'Credit Karma',
    'creditkarma.com',
    'rss',
    'credit-karma-jobs-feed',
    'https://www.creditkarma.com/careers/jobs/feed',
    false,
    '{"adapterNeeded":"rss","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until the RSS adapter is implemented.'
  ),
  (
    'ADP',
    'adp.com',
    'scraper',
    'adp-careers',
    'https://jobs.adp.com/',
    false,
    '{"adapterNeeded":"adp_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an ADP careers adapter or scraper is implemented.'
  ),
  (
    'SunTrust Bank',
    'truist.com',
    'scraper',
    'suntrust-truist-alias',
    'https://careers.truist.com/us/en/c/technology-jobs',
    false,
    '{"aliasFor":"Truist Financial Corporation","searchText":"technology","country":"United States"}'::jsonb,
    'SunTrust is now part of Truist. Kept disabled as an alias; use the enabled Truist Workday source.'
  ),
  (
    'Inspire Brands',
    'inspirebrands.com',
    'scraper',
    'inspire-brands-careers',
    'https://careers.inspirebrands.com/us/en/c/other-jobs',
    false,
    '{"adapterNeeded":"inspire_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an Inspire Brands careers adapter or scraper is implemented.'
  ),
  (
    'Newell Brands',
    'newellbrands.com',
    'scraper',
    'newell-taleo-careers',
    'https://nwl.taleo.net/careersection/2/jobsearch.ftl?lang=en',
    false,
    '{"adapterNeeded":"taleo","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until a Taleo adapter is implemented.'
  ),
  (
    'Intercontinental Exchange',
    'ice.com',
    'scraper',
    'ice-careers',
    'https://careers.ice.com/jobs?country=United%20States&page=1',
    false,
    '{"adapterNeeded":"ice_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an ICE careers adapter or scraper is implemented.'
  ),
  (
    'LexisNexis',
    'lexisnexis.com',
    'scraper',
    'lexisnexis-careers',
    'https://www.lexisnexis.com/systems/careers/job-search.html?r=10&s=0',
    false,
    '{"adapterNeeded":"lexisnexis_or_scraper","searchText":"software engineering","country":"United States"}'::jsonb,
    'Disabled until a LexisNexis careers adapter or scraper is implemented.'
  ),
  (
    'Travelport',
    'travelport.com',
    'scraper',
    'travelport-oracle-cloud-careers',
    'https://ejzg.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/requisitions?mode=location',
    false,
    '{"adapterNeeded":"oracle_cloud_hcm","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an Oracle Cloud HCM adapter is implemented.'
  ),
  (
    'Siemens',
    'siemens.com',
    'scraper',
    'siemens-careers',
    'https://jobs.siemens.com/careers',
    false,
    '{"adapterNeeded":"siemens_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until a Siemens careers adapter or scraper is implemented.'
  ),
  (
    'Hexagon',
    'hexagon.com',
    'scraper',
    'hexagon-careers',
    'https://hexagon.com/company/careers/job-listings#jl_country=United%20States&nearme=1',
    false,
    '{"adapterNeeded":"successfactors_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until a Hexagon careers adapter or scraper is implemented.'
  ),
  (
    'Red Ventures',
    'redventures.com',
    'scraper',
    'red-ventures-careers',
    'https://www.redventures.com/careers/overview',
    false,
    '{"adapterNeeded":"red_ventures_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until a Red Ventures careers adapter or scraper is implemented.'
  ),
  (
    'Nucor Corporation',
    'nucor.com',
    'scraper',
    'nucor-careers',
    'https://nucor.com/careers',
    false,
    '{"adapterNeeded":"nucor_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until a Nucor careers adapter or scraper is implemented.'
  ),
  (
    'Ally Bank',
    'ally.com',
    'scraper',
    'ally-bank-careers',
    'https://www.ally.com/about/careers/',
    false,
    '{"adapterNeeded":"ally_or_scraper","searchText":"technology","country":"United States"}'::jsonb,
    'Disabled until an Ally careers adapter or scraper is implemented.'
  ),
  (
    'Northrop Grumman',
    'northropgrumman.com',
    'scraper',
    'northrop-grumman-careers',
    'https://www.northropgrumman.com/careers/information-technology-careers',
    false,
    '{"adapterNeeded":"northrop_or_scraper","searchText":"information technology","country":"United States"}'::jsonb,
    'Disabled until a Northrop Grumman careers adapter or scraper is implemented.'
  ),
  (
    'Atrium Health',
    'atriumhealth.org',
    'scraper',
    'atrium-health-careers',
    'https://careers.atriumhealth.org/search/jobs/in?location=&page=2&q=software#jobs-section',
    false,
    '{"adapterNeeded":"atrium_or_scraper","searchText":"software","country":"United States"}'::jsonb,
    'Disabled until an Atrium Health careers adapter or scraper is implemented.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
