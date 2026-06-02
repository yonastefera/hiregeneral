-- Add the next requested technology/data job sources.
-- Enabled rows use existing adapters. Getro, Paradox, NLX Solr, and
-- Incapsula-blocked Prudential are kept as disabled discovery rows until
-- dedicated import paths are added.

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
    'Samsung',
    'samsung.com',
    'workday',
    'samsung-workday-technology',
    'https://sec.wd3.myworkdayjobs.com/Samsung_Careers?Location_Country=bc33aa3152ec42d4995f4791a106ed09',
    true,
    '{
      "tenant":"sec",
      "site":"Samsung_Careers",
      "apiBase":"https://sec.wd3.myworkdayjobs.com/wday/cxs/sec/Samsung_Careers",
      "publicBase":"https://sec.wd3.myworkdayjobs.com/Samsung_Careers",
      "searchTexts":["data engineer","data science","data analytics","software engineer","cloud security","technology"],
      "appliedFacets":{
        "Location_Country":["bc33aa3152ec42d4995f4791a106ed09"]
      },
      "pageSize":20,
      "maxPages":2,
      "maxPostings":60,
      "detailConcurrency":3,
      "sourceTimeoutMs":180000
    }'::jsonb,
    'Workday source. Uses the requested United States location facet and searches software, technology, security, and data terms.'
  ),
  (
    'Intel',
    'intel.com',
    'workday',
    'intel-workday-technology',
    'https://intel.wd1.myworkdayjobs.com/en-US/External',
    true,
    '{
      "tenant":"intel",
      "site":"External",
      "apiBase":"https://intel.wd1.myworkdayjobs.com/wday/cxs/intel/External",
      "publicBase":"https://intel.wd1.myworkdayjobs.com/External",
      "searchTexts":["data engineer","data science","data analytics","software engineer","cloud security","technology"],
      "pageSize":20,
      "maxPages":2,
      "maxPostings":60,
      "detailConcurrency":3,
      "sourceTimeoutMs":180000
    }'::jsonb,
    'Workday source. Searches Intel external roles for software, technology, security, and data terms.'
  ),
  (
    'Thrive Capital Network',
    'thrivecap.com',
    'scraper',
    'thrive-capital-getro-it',
    'https://jobs.thrivecap.com/jobs?filter=eyJzZWFyY2hhYmxlX2xvY2F0aW9ucyI6WyJVbml0ZWQgU3RhdGVzIl0sImpvYl9mdW5jdGlvbnMiOlsiSVQiXX0%3D',
    false,
    '{
      "adapterNeeded":"getro",
      "category":"IT",
      "location":"United States",
      "companyWebsite":"https://jobs.thrivecap.com/jobs"
    }'::jsonb,
    'Disabled discovery row. Thrive Capital uses a Getro portfolio-company job board; add a Getro adapter before importing network roles.'
  ),
  (
    'Skechers',
    'skechers.com',
    'phenom',
    'skechers-phenom-technology',
    'https://careers.skechers.com/us/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.skechers.com/widgets",
      "refNum":"SRJSVUUS",
      "baseUrl":"https://careers.skechers.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "selectedFields":{"country":["United States of America","United States"]},
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches Skechers software, technology, security, and data roles in the United States.'
  ),
  (
    'Avis Budget Group',
    'avisbudgetgroup.com',
    'scraper',
    'avis-budget-paradox-technology',
    'https://www.avisbudgetgroup.jobs/?filter%5Bcf_hiring_type%5D%5B0%5D=REC_Corporate_Technology',
    false,
    '{
      "adapterNeeded":"paradox-preload",
      "category":"REC_Corporate_Technology",
      "companyWebsite":"https://www.avisbudgetgroup.jobs/jobs"
    }'::jsonb,
    'Disabled discovery row. Avis Budget exposes corporate technology jobs in a Paradox preload payload; add a Paradox adapter before importing.'
  ),
  (
    'Burlington Stores',
    'burlingtonstores.com',
    'scraper',
    'burlington-nlx-solr-technology',
    'https://burlingtonstores.jobs/position-category/information-technology/jobs/',
    false,
    '{
      "adapterNeeded":"nlx-solr",
      "category":"Information Technology",
      "companyWebsite":"https://burlingtonstores.jobs"
    }'::jsonb,
    'Disabled discovery row. Burlington uses an NLX/Nuxt Solr careers surface and needs a dedicated adapter.'
  ),
  (
    'Quest Diagnostics',
    'questdiagnostics.com',
    'scraper',
    'quest-diagnostics-talentbrew-technology',
    'https://careers.questdiagnostics.com/search-jobs',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://careers.questdiagnostics.com",
      "orgId":"38852",
      "category":"Technology",
      "searchTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","architect","cloud"],
      "maxPages":4,
      "companyWebsite":"https://careers.questdiagnostics.com/search-jobs"
    }'::jsonb,
    'TalentBrew source. Searches Quest Diagnostics technology and data roles, then keeps US engineering/data roles through defensive filters.'
  ),
  (
    'Prudential',
    'prudential.com',
    'scraper',
    'prudential-incapsula-technology',
    'https://jobs.prudential.com/us-en/search?LocationCountry=United+States+of+America&Job_Category=Technology',
    false,
    '{
      "adapterNeeded":"prudential-careers",
      "blockedBy":"incapsula",
      "category":"Technology",
      "country":"United States",
      "companyWebsite":"https://jobs.prudential.com/us-en/search"
    }'::jsonb,
    'Disabled discovery row. Prudential careers still returns an Incapsula block to anonymous server-side ingestion requests.'
  ),
  (
    'Panasonic North America',
    'panasonic.com',
    'scraper',
    'panasonic-jibe-technology',
    'https://careers.na.panasonic.com/jobs?categories=IT%7CProject%20Management%7CTechnical%20Service%20and%20Repair&page=1',
    true,
    '{
      "adapter":"jibe",
      "apiUrl":"https://careers.na.panasonic.com/api/jobs",
      "publicBase":"https://careers.na.panasonic.com",
      "category":"IT",
      "query":{
        "categories":"IT|Project Management|Technical Service and Repair"
      },
      "searchQueries":[
        {"categories":"IT|Project Management|Technical Service and Repair"},
        {"keywords":"Software Engineer"},
        {"keywords":"Data Engineer"},
        {"keywords":"Data Analytics"},
        {"keywords":"Data Science"},
        {"keywords":"Data Governance"},
        {"keywords":"Cloud Security"}
      ],
      "maxPages":6,
      "companyWebsite":"https://careers.na.panasonic.com/jobs"
    }'::jsonb,
    'Jibe source. Searches Panasonic North America IT/category roles plus explicit software and data keyword queries.'
  ),
  (
    'Match Group',
    'matchgroup.com',
    'scraper',
    'match-group-eightfold-technology',
    'https://join.matchgroupcareers.com/careers?domain=gotinder.com&sort_by=relevance&triggerGoButton=true',
    false,
    '{
      "adapterNeeded":"eightfold-domain-filter",
      "apiBase":"https://join.matchgroupcareers.com",
      "domain":"gotinder.com",
      "searchText":"technology",
      "searchTexts":["technology","software","engineer","data","analytics","data science","data engineering","data governance","security"],
      "location":"United States",
      "sortBy":"relevance",
      "pageSize":10,
      "maxPages":8,
      "companyWebsite":"https://join.matchgroupcareers.com/careers"
    }'::jsonb,
    'Disabled discovery row. The existing Eightfold adapter reaches Match Group, but this board returns broad roles without a tighter domain/category filter.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = now();
