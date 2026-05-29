-- Add Charles Schwab, Sentara, U.S. Bank, State Street, BNY, Goldman Sachs,
-- First Citizens, M&T Bank, Huntington, and Fifth Third technology sources.

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
    'Charles Schwab',
    'schwab.com',
    'scraper',
    'charles-schwab-talentbrew',
    'https://www.schwabjobs.com/search-jobs/software/33727/1',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://www.schwabjobs.com",
      "companyWebsite":"https://www.schwabjobs.com/search-jobs",
      "orgId":"33727",
      "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
      "maxPages":8,
      "category":"Technology"
    }'::jsonb,
    'Radancy/TalentBrew source. Imports Schwab United States software, data, and technology roles after defensive filters.'
  ),
  (
    'Sentara Health',
    'sentara.com',
    'scraper',
    'sentara-mcloud-technology',
    'https://www.sentaracareers.com/job-search-results/?keyword=software&pg=2',
    true,
    '{
      "adapter":"mcloud",
      "apiBase":"https://jobsapi-internal.m-cloud.io/api",
      "organization":"1981",
      "facets":["ats_portalid:Workday"],
      "category":"Technology",
      "requiredTerms":["software","developer","engineer","information technology","data","analytics","data science","data engineering","data governance","cloud","security","cyber"],
      "companyWebsite":"https://www.sentaracareers.com/job-search-results/?keyword=software",
      "pageSize":50,
      "maxPages":4
    }'::jsonb,
    'M-Cloud careers source. Imports Sentara United States technology roles from the Workday-backed careers API.'
  ),
  (
    'U.S. Bank',
    'usbank.com',
    'phenom',
    'us-bank-phenom',
    'https://careers.usbank.com/global/en/search-results?utm_source=homepage&utm_medium=button',
    true,
    '{
      "widgetApiEndpoint":"https://careers.usbank.com/widgets",
      "refNum":"UBNAGLOBAL",
      "baseUrl":"https://careers.usbank.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","digital"],
      "selectedFields":{
        "country":["United States"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches U.S. Bank United States technology roles before defensive engineering filters.'
  ),
  (
    'State Street',
    'statestreet.com',
    'phenom',
    'state-street-phenom',
    'https://careers.statestreet.com/global/en/search-results?m=3',
    true,
    '{
      "widgetApiEndpoint":"https://careers.statestreet.com/widgets",
      "refNum":"STSTGLOBAL",
      "baseUrl":"https://careers.statestreet.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","digital"],
      "selectedFields":{
        "country":["United States"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches State Street United States technology roles before defensive engineering filters.'
  ),
  (
    'BNY',
    'bny.com',
    'oracle_hcm',
    'bny-oracle-hcm-technology-us',
    'https://eofe.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/BNY-Careers/jobs?keyword=software+&lastSelectedFacet=LOCATIONS&mode=location&selectedLocationsFacet=300000000378743',
    true,
    '{
      "apiBase":"https://eofe.fa.us2.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
      "publicBase":"https://eofe.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/BNY-Careers/jobs",
      "siteNumber":"BNY-Careers",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "selectedLocationsFacet":"300000000378743",
      "countryCode":"US",
      "pageSize":50,
      "maxPages":8
    }'::jsonb,
    'Oracle HCM source. Imports BNY United States software and technology roles from the public candidate experience API.'
  ),
  (
    'Goldman Sachs',
    'goldmansachs.com',
    'scraper',
    'goldman-sachs-higher',
    'https://higher.gs.com/',
    true,
    '{
      "adapter":"goldman-higher",
      "apiUrl":"https://api-higher.gs.com/gateway/api/v1/graphql",
      "publicBase":"https://higher.gs.com",
      "companyWebsite":"https://www.goldmansachs.com/careers",
      "searchTerms":["software","developer","engineering","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "category":"Engineering",
      "pageSize":20,
      "maxPages":5
    }'::jsonb,
    'Goldman Higher GraphQL source. Imports Goldman Sachs United States engineering and technology roles from public open roles.'
  ),
  (
    'First Citizens Bank',
    'firstcitizens.com',
    'scraper',
    'first-citizens-jibe-technology',
    'https://jobs.firstcitizens.com/jobs?categories=Information%20Security%7CInformation%20Technology%7CTech%20%26%20Healthcare&page=1',
    true,
    '{
      "adapter":"jibe",
      "apiUrl":"https://jobs.firstcitizens.com/api/jobs",
      "publicBase":"https://jobs.firstcitizens.com",
      "category":"Technology",
      "query":{
        "categories":"Information Security|Information Technology|Tech & Healthcare",
        "internal":"false",
        "separator":"|",
        "facetField":"tags1|tags2|tags4"
      },
      "maxPages":8,
      "companyWebsite":"https://jobs.firstcitizens.com/jobs?categories=Information%20Security%7CInformation%20Technology%7CTech%20%26%20Healthcare&page=1"
    }'::jsonb,
    'Jibe/iCIMS source. Imports First Citizens United States information security and technology roles from the public jobs API.'
  ),
  (
    'M&T Bank',
    'mtb.com',
    'workday',
    'mtb-workday-technology',
    'https://mtb.wd5.myworkdayjobs.com/MTB?q=data',
    true,
    '{
      "tenant":"mtb",
      "site":"MTB",
      "apiBase":"https://mtb.wd5.myworkdayjobs.com/wday/cxs/mtb/MTB",
      "publicBase":"https://mtb.wd5.myworkdayjobs.com/MTB",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "pageSize":20,
      "maxPages":6
    }'::jsonb,
    'Workday source. Searches M&T Bank technology roles before defensive United States and engineering filters.'
  ),
  (
    'Huntington Bank',
    'huntington.com',
    'scraper',
    'huntington-activate-technology',
    'https://huntington-careers.com/search/searchjobs?categoryid=7f3e8f84-e78b-4521-bb0f-5b434866102e&radius=25',
    true,
    '{
      "adapter":"activate",
      "category":"Technology",
      "categoryIds":["7f3e8f84-e78b-4521-bb0f-5b434866102e"],
      "pageSize":10,
      "maxPages":5,
      "companyWebsite":"https://huntington-careers.com/search/searchjobs?categoryid=7f3e8f84-e78b-4521-bb0f-5b434866102e&radius=25"
    }'::jsonb,
    'Activate careers source. Imports Huntington United States technology roles from listing JSON and detail JobPosting schema.'
  ),
  (
    'Fifth Third Bank',
    '53.com',
    'workday',
    'fifth-third-workday-technology',
    'https://fifththird.wd5.myworkdayjobs.com/53careers?jobFamilyGroup=5d81a4de586e014889e3ac247a0b18aa',
    true,
    '{
      "tenant":"fifththird",
      "site":"53careers",
      "apiBase":"https://fifththird.wd5.myworkdayjobs.com/wday/cxs/fifththird/53careers",
      "publicBase":"https://fifththird.wd5.myworkdayjobs.com/53careers",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "appliedFacets":{
        "jobFamilyGroup":["5d81a4de586e014889e3ac247a0b18aa"]
      },
      "pageSize":20,
      "maxPages":6
    }'::jsonb,
    'Workday source. Searches Fifth Third technology job-family roles before defensive United States and engineering filters.'
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
