-- Add Con Edison, L3Harris, Moog, Applied Materials, TTM Technologies,
-- Etsy, DoubleVerify, Yext, Bristol Myers Squibb, Regeneron,
-- NewYork-Presbyterian, and NYU Langone sources.

WITH sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata,
  notes
) AS (
  VALUES
    (
      'Con Edison',
      'coned.com',
      'oracle_hcm',
      'con-edison-oracle-hcm-technology',
      'https://ejcu.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1033/jobs?lastSelectedFacet=AttributeChar15&selectedFlexFieldsFacets=%22AttributeChar15%7CYes%22&utm_medium=jobshare',
      true,
      '{
        "apiBase":"https://ejcu.fa.us6.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
        "publicBase":"https://ejcu.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1033",
        "siteNumber":"CX_1033",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "countryCode":"US",
        "pageSize":50,
        "maxPages":8,
        "companyWebsite":"https://www.coned.com/en/about-us/careers"
      }'::jsonb,
      'Oracle HCM source. Searches Con Edison United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'L3Harris',
      'l3harris.com',
      'scraper',
      'l3harris-talentbrew-technology-data',
      'https://careers.l3harris.com/en/search-jobs',
      true,
      '{
        "adapter":"talentbrew",
        "publicBase":"https://careers.l3harris.com",
        "orgId":"4832",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "category":"Technology",
        "companyWebsite":"https://careers.l3harris.com/en/search-jobs",
        "maxPages":6
      }'::jsonb,
      'TalentBrew source. Searches L3Harris software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Moog',
      'moog.com',
      'workday',
      'moog-workday-technology-data',
      'https://moog.wd5.myworkdayjobs.com/MOOG_External_Career_Site?jobFamilyGroup=5601b8111949102e1272107617f80002&jobFamilyGroup=5601b8111949102e1271ebe2e1eb0002',
      true,
      '{
        "tenant":"moog",
        "site":"MOOG_External_Career_Site",
        "apiBase":"https://moog.wd5.myworkdayjobs.com/wday/cxs/moog/MOOG_External_Career_Site",
        "publicBase":"https://moog.wd5.myworkdayjobs.com/MOOG_External_Career_Site",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "jobFamilyGroup":["5601b8111949102e1272107617f80002","5601b8111949102e1271ebe2e1eb0002"]
        },
        "pageSize":20,
        "maxPages":8,
        "companyWebsite":"https://www.moog.com/careers.html"
      }'::jsonb,
      'Workday source. Imports Moog United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Applied Materials',
      'appliedmaterials.com',
      'scraper',
      'applied-materials-eightfold-technology-data',
      'https://careers.appliedmaterials.com/careers?domain=appliedmaterials.com&triggerGoButton=false&start=40&pid=790316205459&sort_by=relevance&filter_country=United+States+of+America',
      true,
      '{
        "adapter":"eightfold",
        "apiBase":"https://careers.appliedmaterials.com",
        "domain":"appliedmaterials.com",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "location":"United States",
        "category":"Technology",
        "sortBy":"relevance",
        "pageSize":10,
        "maxPages":4,
        "fetchDetails":false,
        "enhanceDetails":false,
        "sourceTimeoutMs":120000,
        "companyWebsite":"https://careers.appliedmaterials.com/careers"
      }'::jsonb,
      'Eightfold source. Searches Applied Materials United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'TTM Technologies',
      'ttm.com',
      'workday',
      'ttm-technologies-workday-technology-data',
      'https://ttmtech.wd5.myworkdayjobs.com/jobs?jobFamilyGroup=8af57f794bfa0140c4e31a652c58b36e&jobFamilyGroup=8af57f794bfa01971ebc0a652c58a76e&jobFamilyGroup=8af57f794bfa012a208030652c58dd6e&jobFamilyGroup=8af57f794bfa01e9326e09652c58a36e&jobFamilyGroup=d146c89e3e790101ab9c84468c180000&jobFamilyGroup=85fa7ea6d2b30101add8dfb267630000',
      true,
      '{
        "tenant":"ttmtech",
        "site":"jobs",
        "apiBase":"https://ttmtech.wd5.myworkdayjobs.com/wday/cxs/ttmtech/jobs",
        "publicBase":"https://ttmtech.wd5.myworkdayjobs.com/jobs",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "jobFamilyGroup":["8af57f794bfa0140c4e31a652c58b36e","8af57f794bfa01971ebc0a652c58a76e","8af57f794bfa012a208030652c58dd6e","8af57f794bfa01e9326e09652c58a36e","d146c89e3e790101ab9c84468c180000","85fa7ea6d2b30101add8dfb267630000"]
        },
        "pageSize":20,
        "maxPages":8,
        "companyWebsite":"https://www.ttm.com/en/careers"
      }'::jsonb,
      'Workday source. Imports TTM Technologies United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Etsy',
      'etsy.com',
      'scraper',
      'etsy-clinch-technology-data',
      'https://careers.etsy.com/jobs/search?page=1&country_codes%5B%5D=US&query=',
      false,
      '{
        "adapterNeeded":"clinch",
        "publicBase":"https://careers.etsy.com",
        "searchUrl":"https://careers.etsy.com/jobs/search?page=1&country_codes%5B%5D=US&query=",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "companyWebsite":"https://careers.etsy.com/jobs/search"
      }'::jsonb,
      'Parked source. Etsy uses a Clinch careers page; enable after adding a generic Clinch adapter.'
    ),
    (
      'DoubleVerify',
      'doubleverify.com',
      'scraper',
      'doubleverify-careers',
      'https://doubleverify.com/company/careers#jobs',
      false,
      '{
        "adapterNeeded":"doubleverify-hubspot-careers",
        "publicBase":"https://doubleverify.com",
        "searchUrl":"https://doubleverify.com/company/careers#jobs",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "companyWebsite":"https://doubleverify.com/company/careers"
      }'::jsonb,
      'Parked source. DoubleVerify loads roles through a custom HubSpot careers script; enable after adding a dedicated adapter.'
    ),
    (
      'Yext',
      'yext.com',
      'scraper',
      'yext-careers',
      'https://www.yext.com/careers/open-positions',
      false,
      '{
        "adapterNeeded":"yext-directory-careers",
        "publicBase":"https://www.yext.com",
        "searchUrl":"https://www.yext.com/careers/open-positions",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "companyWebsite":"https://www.yext.com/careers/open-positions"
      }'::jsonb,
      'Parked source. Yext exposes a custom careers directory page; enable after adding a dedicated adapter.'
    ),
    (
      'Bristol Myers Squibb',
      'bms.com',
      'scraper',
      'bms-eightfold-technology-data',
      'https://jobs.bms.com/careers?triggerGoButton=true&triggerGoButton=false&primary_job_rbu=global+product+development+%26+supply&start=0&location=United+States&pid=137481152792&sort_by=distance&filter_include_remote=1&filter_family=information+technology%2Cengineering%2Cquality',
      true,
      '{
        "adapter":"eightfold",
        "apiBase":"https://jobs.bms.com",
        "domain":"bms.com",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "location":"United States",
        "category":"Technology",
        "sortBy":"relevance",
        "pageSize":10,
        "maxPages":4,
        "fetchDetails":false,
        "enhanceDetails":false,
        "sourceTimeoutMs":120000,
        "companyWebsite":"https://jobs.bms.com/careers"
      }'::jsonb,
      'Eightfold source. Searches Bristol Myers Squibb United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Regeneron',
      'regeneron.com',
      'scraper',
      'regeneron-careers-technology-data',
      'https://careers.regeneron.com/en/jobs/?keyword=&country=United+States+of+America&category=CNV_Data_Science_and_Analytics&category=CNV_Information_Technology&pagesize=20#results',
      false,
      '{
        "adapterNeeded":"cloudflare-protected-careers",
        "publicBase":"https://careers.regeneron.com",
        "searchUrl":"https://careers.regeneron.com/en/jobs/?keyword=&country=United+States+of+America&category=CNV_Data_Science_and_Analytics&category=CNV_Information_Technology&pagesize=20#results",
        "categories":["CNV_Data_Science_and_Analytics","CNV_Information_Technology"],
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "companyWebsite":"https://careers.regeneron.com/en/jobs/"
      }'::jsonb,
      'Parked source. Regeneron blocks server-side fetches with Cloudflare; enable after adding a compatible adapter or ingestion strategy.'
    ),
    (
      'NewYork-Presbyterian',
      'nyp.org',
      'scraper',
      'newyork-presbyterian-talentbrew-technology-data',
      'https://careers.nyp.org/search-jobs',
      true,
      '{
        "adapter":"talentbrew",
        "publicBase":"https://careers.nyp.org",
        "orgId":"19715",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "category":"Technology",
        "companyWebsite":"https://careers.nyp.org/search-jobs",
        "maxPages":6
      }'::jsonb,
      'TalentBrew source. Searches NewYork-Presbyterian software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'NYU Langone Health',
      'nyulangone.org',
      'scraper',
      'nyu-langone-mcloud-health-it',
      'https://jobs.nyulangone.org/job-search-results/?parent_category[]=IT%2FHealth%20IT%2FInformatics',
      true,
      '{
        "adapter":"mcloud",
        "apiBase":"https://jobsapi-internal.m-cloud.io/api",
        "organization":"1637",
        "facets":["ats_portalid:Silkroad~Silkroad_Winthrop"],
        "category":"Health IT",
        "requiredTerms":["software","developer","engineer","information technology","informatics","data","analytics","data science","data engineering","data governance","cloud","security","cyber","ai"],
        "companyWebsite":"https://jobs.nyulangone.org/job-search-results/?parent_category[]=IT%2FHealth%20IT%2FInformatics",
        "pageSize":50,
        "maxPages":6
      }'::jsonb,
      'M-Cloud/CWS source. Imports NYU Langone United States IT, health IT, informatics, data, cloud, security, and AI roles.'
    )
),
updated AS (
  UPDATE public.job_sources AS job_sources
  SET
    company_name = sources.company_name,
    company_domain = sources.company_domain,
    source_type = sources.source_type,
    source_url = sources.source_url,
    enabled = sources.enabled,
    metadata = sources.metadata,
    notes = sources.notes
  FROM sources
  WHERE job_sources.source_slug = sources.source_slug
  RETURNING job_sources.source_slug
)
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
SELECT
  sources.company_name,
  sources.company_domain,
  sources.source_type,
  sources.source_slug,
  sources.source_url,
  sources.enabled,
  sources.metadata,
  sources.notes
FROM sources
WHERE NOT EXISTS (
  SELECT 1
  FROM updated
  WHERE updated.source_slug = sources.source_slug
);
