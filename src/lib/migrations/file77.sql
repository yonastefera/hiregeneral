-- Add the next requested retail, insurance, agriculture, and financial services sources.
-- Enabled rows use existing platform adapters. UKG, Gap, and Prudential are
-- kept as disabled discovery rows until their custom/blocked surfaces have
-- dedicated import paths.

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
    'Express',
    'express.com',
    'scraper',
    'express-activate-technology',
    'https://careers.express.com/search/searchjobs?keyword=software+',
    true,
    '{
      "adapter":"activate",
      "categoryIds":["5f50a6c2-c2b8-4aef-8f16-8bd4c1f79ebf"],
      "category":"Technology",
      "maxPages":5,
      "companyWebsite":"https://careers.express.com/search/searchjobs"
    }'::jsonb,
    'Activate source. Imports Express information technology roles from the official careers search endpoint.'
  ),
  (
    'Big Lots',
    'biglots.com',
    'scraper',
    'big-lots-ukg-technology',
    'https://myhrcenter.rec.pro.ukg.net/VAR1003VARW/JobBoard/130290fb-239c-4d7f-a808-643cd4aaf114/?q=&o=postedDateDesc&w=&wc=&we=&wpst=&f5=OkWRUvwb6EOwVUD5Uhbz5w',
    false,
    '{
      "adapterNeeded":"ukg-rec",
      "companyWebsite":"https://myhrcenter.rec.pro.ukg.net/VAR1003VARW/JobBoard/130290fb-239c-4d7f-a808-643cd4aaf114/"
    }'::jsonb,
    'Disabled discovery row. Big Lots uses a UKG Recruiting job board with internal search APIs that need a dedicated UKG adapter.'
  ),
  (
    'Gap Inc.',
    'gapinc.com',
    'scraper',
    'gap-custom-technology',
    'https://www.gapinc.com/en-us/careers/job-search?category=Technology%2FIT%20(Technology%20and%20Digital)&query=software&currentPage=1&sort=score',
    false,
    '{
      "adapterNeeded":"gap-careers-search",
      "category":"Technology/IT (Technology and Digital)",
      "searchText":"software",
      "companyWebsite":"https://www.gapinc.com/en-us/careers/job-search"
    }'::jsonb,
    'Disabled discovery row. Gap careers is a custom corporate job search surface and needs a dedicated adapter before automated imports.'
  ),
  (
    'Chipotle',
    'chipotle.com',
    'scraper',
    'chipotle-talentbrew-technology',
    'https://jobs.chipotle.com/search-jobs?acm=ALL&alrpm=ALL&ascf=[%7B%22key%22:%22custom_fields.jobCategory%22,%22value%22:%22Information+Technology%22%7D]',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.chipotle.com",
      "orgId":"282",
      "category":"Information Technology",
      "searchTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","architect","cloud"],
      "maxPages":3,
      "companyWebsite":"https://jobs.chipotle.com/search-jobs"
    }'::jsonb,
    'TalentBrew source. Searches Chipotle technology roles and keeps US engineering/data roles through defensive filters.'
  ),
  (
    'Berkshire Hathaway Energy',
    'brkenergy.com',
    'oracle_hcm',
    'brk-energy-oracle-hcm-technology',
    'https://careers.brkenergy.com/search?mode=location',
    true,
    '{
      "apiBase":"https://fa-essf-saasfaprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
      "publicBase":"https://fa-essf-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs",
      "siteNumber":"CX_1",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "countryCode":"US",
      "pageSize":50,
      "maxPages":8
    }'::jsonb,
    'Oracle HCM source. Searches Berkshire Hathaway Energy technology roles in the United States.'
  ),
  (
    'Ally',
    'ally.com',
    'scraper',
    'ally-avature-data-technology',
    'https://ally.avature.net/careers/SearchJobs/Data?listFilterMode=1&jobRecordsPerPage=6&',
    true,
    '{
      "adapter":"avature",
      "pageSize":6,
      "pageSizeParam":"jobRecordsPerPage",
      "offsetParam":"jobOffset",
      "category":"Data and Technology",
      "country":"United States",
      "requiredTerms":["data","analytics","data science","data engineering","data governance","software","developer","engineer","technology","security","cloud"],
      "maxPages":8,
      "companyWebsite":"https://ally.avature.net/careers"
    }'::jsonb,
    'Avature source. Imports Ally data and technology roles, then keeps United States engineering/data roles.'
  ),
  (
    'GEICO',
    'geico.com',
    'workday',
    'geico-workday-technology',
    'https://geico.wd1.myworkdayjobs.com/External?jobFamilyGroup=da128ce5a1dc103e7c09aaa3fe312266',
    true,
    '{
      "tenant":"geico",
      "site":"External",
      "apiBase":"https://geico.wd1.myworkdayjobs.com/wday/cxs/geico/External",
      "publicBase":"https://geico.wd1.myworkdayjobs.com/External",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "appliedFacets":{
        "jobFamilyGroup":["da128ce5a1dc103e7c09aaa3fe312266"]
      },
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Uses the requested GEICO technology family facet and keeps US roles through defensive filters.'
  ),
  (
    'State Farm',
    'statefarm.com',
    'scraper',
    'state-farm-jibe-technology',
    'https://jobs.statefarm.com/main/jobs?keywords=Software%20Engineer&sortBy=relevance&page=1',
    true,
    '{
      "adapter":"jibe",
      "apiUrl":"https://jobs.statefarm.com/api/jobs",
      "publicBase":"https://jobs.statefarm.com/main",
      "category":"Technology and UX",
      "query":{
        "keywords":"Software Engineer",
        "sortBy":"relevance"
      },
      "searchQueries":[
        {"keywords":"Software Engineer","sortBy":"relevance"},
        {"keywords":"Data Engineer","sortBy":"relevance"},
        {"keywords":"Data Analytics","sortBy":"relevance"},
        {"keywords":"Data Science","sortBy":"relevance"},
        {"keywords":"Data Governance","sortBy":"relevance"}
      ],
      "maxPages":4,
      "companyWebsite":"https://jobs.statefarm.com/main/jobs"
    }'::jsonb,
    'Jibe source. Imports State Farm software engineering roles from the public jobs API.'
  ),
  (
    'Allstate',
    'allstate.com',
    'scraper',
    'allstate-mcloud-technology',
    'https://www.allstate.jobs/job-search-results/?category[]=Data%2C%20Research%2C%20%26%20Strategy&category[]=Operations&category[]=Technology&compliment[]=United%20States%20of%20America',
    true,
    '{
      "adapter":"mcloud",
      "apiBase":"https://jobsapi-internal.m-cloud.io/api",
      "organization":"2030",
      "category":"Technology",
      "facets":[
        "primary_category:Data, Research, & Strategy~Operations~Technology",
        "compliment:United States of America",
        "ats_portalid:Workday-MuleAPI-External",
        "is_internal:allstate_careers"
      ],
      "pageSize":50,
      "maxPages":4,
      "companyWebsite":"https://www.allstate.jobs/job-search-results/"
    }'::jsonb,
    'M-Cloud source. Updates the existing Allstate source to include the requested data, operations, technology, and United States facets.'
  ),
  (
    'Cargill',
    'cargill.com',
    'scraper',
    'cargill-talentbrew-technology',
    'https://careers.cargill.com/en/search-jobs?acm=ALL&alrpm=ALL&ascf=[%7B%22key%22:%22job_type%22,%22value%22:%22Professional%22%7D]',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://careers.cargill.com/en",
      "orgId":"23251",
      "category":"Technology",
      "searchTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","architect","cloud"],
      "maxPages":4,
      "companyWebsite":"https://careers.cargill.com/en/search-jobs"
    }'::jsonb,
    'TalentBrew source. Searches Cargill professional technology-related roles and keeps US engineering/data roles through defensive filters.'
  ),
  (
    'Liberty Mutual',
    'libertymutual.com',
    'scraper',
    'liberty-mutual-eightfold-technology',
    'https://searchjobs.libertymutualgroup.com/careers?department=Data%20Science&department=Technology&department=Analytics&pid=618516012328&domain=libertymutual.com&sort_by=relevance&triggerGoButton=false&triggerGoButton=true',
    true,
    '{
      "adapter":"eightfold",
      "apiBase":"https://searchjobs.libertymutualgroup.com",
      "domain":"libertymutual.com",
      "searchText":"technology",
      "searchTexts":["technology","data","analytics","data science","data engineering","data governance"],
      "location":"United States",
      "sortBy":"relevance",
      "pageSize":10,
      "maxPages":8,
      "companyWebsite":"https://searchjobs.libertymutualgroup.com/careers"
    }'::jsonb,
    'Eightfold source. Searches Liberty Mutual technology, data science, and analytics roles in the United States.'
  ),
  (
    'Farmers Insurance',
    'farmersinsurance.com',
    'successfactors',
    'farmers-successfactors-it',
    'https://jobs.farmersinsurance.com/go/IT/8753402/',
    true,
    '{
      "rssUrl":"https://jobs.farmersinsurance.com/services/rss/category/?catid=8753402",
      "publicBase":"https://jobs.farmersinsurance.com",
      "searchText":"technology",
      "locale":"en_US",
      "companyWebsite":"https://jobs.farmersinsurance.com/go/IT/8753402/"
    }'::jsonb,
    'SuccessFactors source. Imports Farmers Insurance IT roles from the official category RSS feed.'
  ),
  (
    'Nationwide',
    'nationwide.com',
    'workday',
    'nationwide-workday-technology',
    'https://nationwide.wd1.myworkdayjobs.com/Nationwide_Career',
    true,
    '{
      "tenant":"nationwide",
      "site":"Nationwide_Career",
      "apiBase":"https://nationwide.wd1.myworkdayjobs.com/wday/cxs/nationwide/Nationwide_Career",
      "publicBase":"https://nationwide.wd1.myworkdayjobs.com/Nationwide_Career",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Nationwide careers exposes Workday apply URLs; searches technology terms and keeps US roles through defensive filters.'
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
    'Disabled discovery row. Prudential careers currently returns an Incapsula block to anonymous server-side ingestion requests.'
  ),
  (
    'New York Life',
    'newyorklife.com',
    'scraper',
    'new-york-life-eightfold-technology',
    'https://careers.newyorklife.com/careers?location=Atlanta%2C%20Georgia%2C%20US&pid=40897402&Category=technology&Category=data%20%2F%20ai&domain=newyorklife.com&sort_by=relevance&triggerGoButton=true',
    true,
    '{
      "adapter":"eightfold",
      "apiBase":"https://careers.newyorklife.com",
      "domain":"newyorklife.com",
      "searchText":"technology",
      "searchTexts":["technology","data","analytics","data science","data engineering","data governance"],
      "location":"United States",
      "sortBy":"relevance",
      "pageSize":10,
      "maxPages":8,
      "companyWebsite":"https://careers.newyorklife.com/careers"
    }'::jsonb,
    'Eightfold source. Searches New York Life technology and data/AI roles in the United States.'
  ),
  (
    'MassMutual',
    'massmutual.com',
    'scraper',
    'massmutual-talentbrew-technology',
    'https://careers.massmutual.com/search-jobs',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://careers.massmutual.com",
      "orgId":"7243",
      "category":"Technology",
      "searchTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","architect","cloud"],
      "maxPages":4,
      "companyWebsite":"https://careers.massmutual.com/technology-jobs"
    }'::jsonb,
    'TalentBrew source. Searches MassMutual technology roles and keeps US engineering/data roles through defensive filters.'
  ),
  (
    'Corebridge Financial',
    'corebridgefinancial.com',
    'workday',
    'corebridge-workday-technology',
    'https://corebridgefinancial.wd1.myworkdayjobs.com/CorebridgeFinancial?jobFamilyGroup=e4908cb6c4854e3a9f3654dbc2e7087c',
    true,
    '{
      "tenant":"corebridgefinancial",
      "site":"CorebridgeFinancial",
      "apiBase":"https://corebridgefinancial.wd1.myworkdayjobs.com/wday/cxs/corebridgefinancial/CorebridgeFinancial",
      "publicBase":"https://corebridgefinancial.wd1.myworkdayjobs.com/CorebridgeFinancial",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "appliedFacets":{
        "jobFamilyGroup":["e4908cb6c4854e3a9f3654dbc2e7087c"]
      },
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Uses the requested Corebridge technology family facet and keeps US roles through defensive filters.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_type = EXCLUDED.source_type,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = now();
