-- Add the next media, retail, and technology company ingestion sources.
-- Uses update-then-insert instead of ON CONFLICT because job_sources does not
-- have a unique constraint for the conflict target in every environment.

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
      'CarGurus',
      'cargurus.com',
      'phenom',
      'cargurus-phenom-technology-data',
      'https://careers.cargurus.com/us/en/search-results',
      true,
      '{
        "widgetApiEndpoint":"https://careers.cargurus.com/widgets",
        "refNum":"CABCARUS",
        "baseUrl":"https://careers.cargurus.com/us/en",
        "locale":"en_us",
        "country":"us",
        "pageName":"search-results",
        "siteType":"external",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud","product"],
        "pageSize":25,
        "maxPages":6,
        "preferPublicJobUrl":true,
        "companyWebsite":"https://careers.cargurus.com/us/en/search-results"
      }'::jsonb,
      'Phenom source. Imports CarGurus United States software, technology, data, analytics, AI, platform, cloud, security, and product roles.'
    ),
    (
      'Philip Morris International',
      'pmi.com',
      'phenom',
      'pmi-phenom-information-technology',
      'https://join.pmicareers.com/gb/en/c/information-technology-jobs',
      true,
      '{
        "widgetApiEndpoint":"https://join.pmicareers.com/widgets",
        "refNum":"PMIPMIGB",
        "baseUrl":"https://join.pmicareers.com/gb/en",
        "locale":"en_gb",
        "country":"gb",
        "pageName":"information-technology",
        "siteType":"external",
        "selectedFields":{"category":["Information Technology"]},
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud","product"],
        "pageSize":25,
        "maxPages":6,
        "preferPublicJobUrl":true,
        "companyWebsite":"https://join.pmicareers.com/gb/en/c/information-technology-jobs"
      }'::jsonb,
      'Phenom source. Uses the PMI information technology category and keeps imported roles focused on software, technology, data, AI, platform, cloud, security, and product work.'
    ),
    (
      'Colgate-Palmolive',
      'colgatepalmolive.com',
      'successfactors',
      'colgate-successfactors-technology',
      'https://jobs.colgate.com/search/?searchResultView=LIST',
      true,
      '{
        "publicBase":"https://jobs.colgate.com",
        "locale":"en_US",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud"],
        "locationSearch":"United States",
        "companyWebsite":"https://jobs.colgate.com/search/"
      }'::jsonb,
      'SuccessFactors source. Imports United States information technology, software, data, analytics, AI, platform, cloud, and security roles.'
    ),
    (
      'Foot Locker',
      'footlocker.com',
      'scraper',
      'foot-locker-jibe-digital-technology',
      'https://careers.footlocker.com/jobs?tags9=North%20America&page=1&categories=Digital%7CTechnology',
      true,
      '{
        "adapter":"jibe",
        "apiUrl":"https://careers.footlocker.com/api/jobs",
        "publicBase":"https://careers.footlocker.com",
        "category":"Digital and Technology",
        "searchQueries":[
          {"categories":"Digital|Technology","tags9":"North America"},
          {"keywords":"software","categories":"Digital|Technology","tags9":"North America"},
          {"keywords":"data","categories":"Digital|Technology","tags9":"North America"},
          {"keywords":"security","categories":"Digital|Technology","tags9":"North America"}
        ],
        "maxPages":6,
        "companyWebsite":"https://careers.footlocker.com/jobs"
      }'::jsonb,
      'Jibe source. Imports Foot Locker North America digital, technology, software, data, analytics, and security roles.'
    ),
    (
      'Hearts & Science',
      'omnicommedia.com',
      'greenhouse',
      'omgushs',
      'https://boards-api.greenhouse.io/v1/boards/omgushs/jobs?content=true',
      true,
      '{
        "companyWebsite":"https://omnicommedia.com/careers/us/hearts-science/",
        "requireUs":true
      }'::jsonb,
      'Greenhouse source. Imports Hearts & Science United States roles from the public Omnicom board.'
    ),
    (
      'Omnicom Media Network',
      'omnicommedia.com',
      'greenhouse',
      'omgus',
      'https://boards-api.greenhouse.io/v1/boards/omgus/jobs?content=true',
      true,
      '{
        "companyWebsite":"https://omnicommedia.com/careers/us/omnicom-media-network/",
        "requireUs":true
      }'::jsonb,
      'Greenhouse source. Imports Omnicom Media Network United States roles from the public Omnicom board.'
    ),
    (
      'Optimum',
      'optimum.com',
      'successfactors',
      'optimum-successfactors-technology-data',
      'https://www.optimumcareers.com/search/',
      true,
      '{
        "publicBase":"https://www.optimumcareers.com",
        "locale":"en_US",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud"],
        "locationSearch":"United States",
        "companyWebsite":"https://www.optimumcareers.com/search/"
      }'::jsonb,
      'SuccessFactors source. Imports Optimum United States software, technology, data, analytics, AI, platform, cloud, and security roles.'
    ),
    (
      'Horizon Media',
      'horizonmedia.com',
      'workday',
      'horizon-media-workday-technology-data',
      'https://horizonmedia.wd1.myworkdayjobs.com/CareerOpportunities',
      true,
      '{
        "tenant":"horizonmedia",
        "site":"CareerOpportunities",
        "apiBase":"https://horizonmedia.wd1.myworkdayjobs.com/wday/cxs/horizonmedia/CareerOpportunities",
        "publicBase":"https://horizonmedia.wd1.myworkdayjobs.com/CareerOpportunities",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud","product"],
        "appliedFacets":{
          "locations":["e355b8e7e4f3106279a8d1bcc64e95e9","e355b8e7e4f3106279a8d598fe6b95f2"]
        },
        "pageSize":20,
        "maxPages":8
      }'::jsonb,
      'Workday source. Uses the requested Horizon Media location facets and imports software, technology, data, analytics, AI, platform, cloud, security, and product roles.'
    ),
    (
      'News Corp',
      'newscorp.com',
      'scraper',
      'newscorp-nlx-solr-technology-data',
      'https://careers.newscorp.com/locations/usa/jobs/',
      true,
      '{
        "adapter":"nlx-solr",
        "apiBase":"https://prod-search-api.jobsyn.org/api",
        "endpoint":"v1/solr/search",
        "origin":"careers.newscorp.com",
        "category":"Technology",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud","product"],
        "pageSize":15,
        "maxPages":5,
        "companyWebsite":"https://careers.newscorp.com/locations/usa/jobs/"
      }'::jsonb,
      'NLX/Solr source. Imports News Corp United States software, technology, data, analytics, AI, platform, cloud, security, and product roles.'
    ),
    (
      'Oliver',
      'oliverinside.ai',
      'greenhouse',
      'oliverusa',
      'https://boards-api.greenhouse.io/v1/boards/oliverusa/jobs?content=true',
      false,
      '{
        "companyWebsite":"https://oliverinside.ai/careers",
        "requireUs":true,
        "adapterNeeded":"review-non-technology-greenhouse-board"
      }'::jsonb,
      'Backlog source. Oliver USA is a valid Greenhouse board, but the current public roles are account, creative, social, and program roles rather than technology or data jobs.'
    ),
    (
      'Uline',
      'uline.com',
      'scraper',
      'uline-custom-careers',
      'https://www.uline.jobs/JobSearchResults?culture=en&search=Corporate&location=Pleasant%20Prairie%2C%20Wisconsin',
      false,
      '{
        "adapterNeeded":"uline-job-search",
        "requestedUrl":"https://www.uline.jobs/JobSearchResults?culture=en&search=Corporate&location=Pleasant%20Prairie%2C%20Wisconsin"
      }'::jsonb,
      'Backlog source. Uline uses a custom careers search experience and needs a dedicated adapter before enabling ingestion.'
    ),
    (
      'IBM',
      'ibm.com',
      'scraper',
      'ibm-careers-custom',
      'https://www.ibm.com/careers/search?field_keyword_05[0]=United%20States',
      false,
      '{
        "adapterNeeded":"ibm-careers-search",
        "requestedUrl":"https://www.ibm.com/careers/search?field_keyword_05[0]=United%20States"
      }'::jsonb,
      'Backlog source. IBM careers search needs a dedicated adapter before enabling ingestion.'
    ),
    (
      'IPG Mediabrands',
      'ipgmediabrands.com',
      'scraper',
      'ipg-mediabrands-greenhouse-html',
      'https://careers.ipgmediabrands.com/postings/?gh_search=&department=&interest=&location=United+States#ghjobs',
      false,
      '{
        "adapterNeeded":"greenhouse-wordpress-html",
        "requestedUrl":"https://careers.ipgmediabrands.com/postings/?gh_search=&department=&interest=&location=United+States#ghjobs"
      }'::jsonb,
      'Backlog source. IPG Mediabrands renders Greenhouse jobs through a WordPress plugin and needs a small HTML/board adapter before enabling ingestion.'
    ),
    (
      'Take-Two Interactive',
      'take2games.com',
      'scraper',
      'take-two-custom-careers',
      'https://careers.take2games.com/jobs?office=73329',
      false,
      '{
        "adapterNeeded":"take-two-next-careers",
        "requestedUrl":"https://careers.take2games.com/jobs?office=73329"
      }'::jsonb,
      'Backlog source. Take-Two uses a custom Next.js careers experience and needs a dedicated adapter before enabling ingestion.'
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
    notes = sources.notes,
    updated_at = now()
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
