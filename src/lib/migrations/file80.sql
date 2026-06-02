-- Add the next requested healthcare, energy, retail, and technology sources.
-- Enabled rows use existing TalentBrew, SuccessFactors, Workday, and Oracle HCM
-- adapters. Blocked/custom surfaces are preserved as disabled discovery rows
-- until dedicated adapters are added.

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
    'BD',
    'bd.com',
    'scraper',
    'bd-talentbrew-technology',
    'https://jobs.bd.com/en/search-jobs?acm=ALL&alrpm=ALL&ascf=[%7B%22key%22:%22custom_fields.CareerArea%22,%22value%22:%22Corporate%22%7D]',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.bd.com/en",
      "orgId":"159",
      "category":"Information Technology",
      "searchTerms":["software","developer","engineer","information technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","information technology","architect","cloud"],
      "maxPages":4,
      "companyWebsite":"https://jobs.bd.com/en/search-jobs"
    }'::jsonb,
    'TalentBrew source. Searches BD corporate technology, software, security, and data roles, then keeps US engineering/data roles.'
  ),
  (
    'PSEG',
    'pseg.com',
    'scraper',
    'pseg-successfactors-technology',
    'https://jobs.pseg.com/search/?optionsFacetsDD_department=Information+Technology',
    true,
    '{
      "adapter":"successfactors-tile",
      "publicBase":"https://jobs.pseg.com",
      "category":"Information Technology",
      "companyWebsite":"https://jobs.pseg.com/search/"
    }'::jsonb,
    'SuccessFactors tile source. Imports PSEG information technology roles from the rendered public search page.'
  ),
  (
    'Verisk',
    'verisk.com',
    'oracle_hcm',
    'verisk-oracle-hcm-technology',
    'https://fa-ewmy-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs?lastSelectedFacet=CATEGORIES&selectedCategoriesFacet=300000007039317',
    true,
    '{
      "apiBase":"https://fa-ewmy-saasfaprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
      "publicBase":"https://fa-ewmy-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs",
      "siteNumber":"CX_1",
      "selectedCategoriesFacet":"300000007039317",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "countryCode":"US",
      "pageSize":50,
      "maxPages":6
    }'::jsonb,
    'Oracle HCM source. Uses the requested Verisk category facet and searches software, technology, security, and data roles in the United States.'
  ),
  (
    'Sanofi',
    'sanofi.com',
    'scraper',
    'sanofi-talentbrew-technology',
    'https://jobs.sanofi.com/en/search-jobs',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.sanofi.com/en",
      "orgId":"2649",
      "category":"Digital",
      "searchTerms":["software","developer","engineer","digital","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","digital","architect","cloud"],
      "maxPages":5,
      "companyWebsite":"https://jobs.sanofi.com/en/search-jobs"
    }'::jsonb,
    'TalentBrew source. Searches Sanofi digital, technology, software, security, and data roles, then keeps US engineering/data roles.'
  ),
  (
    'BASF',
    'basf.com',
    'successfactors',
    'basf-successfactors-technology',
    'https://basf.jobs/?locale=en_US&currentPage=1&pageSize=10&category=Applications+Technology&category=Information+Technology+%26+Services&addresses%2Fcountry=United+States',
    true,
    '{
      "publicBase":"https://basf.jobs",
      "locale":"en_US",
      "searchTexts":["software","developer","engineer","information technology","applications technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "locationSearch":"United States",
      "companyWebsite":"https://basf.jobs/?locale=en_US"
    }'::jsonb,
    'SuccessFactors source. Searches BASF applications and information technology roles, then keeps United States engineering/data roles.'
  ),
  (
    'BECU',
    'becu.org',
    'workday',
    'becu-workday-technology',
    'https://becu.wd1.myworkdayjobs.com/External?jobFamilyGroup=a1d4a94251101001b6def988973b0000&jobFamilyGroup=c972c35a0ff51001bab7151f8c900000',
    true,
    '{
      "tenant":"becu",
      "site":"External",
      "apiBase":"https://becu.wd1.myworkdayjobs.com/wday/cxs/becu/External",
      "publicBase":"https://becu.wd1.myworkdayjobs.com/External",
      "searchTexts":["data engineer","data science","data analytics","software engineer","cloud security","technology"],
      "appliedFacets":{
        "jobFamilyGroup":["a1d4a94251101001b6def988973b0000","c972c35a0ff51001bab7151f8c900000"]
      },
      "pageSize":20,
      "maxPages":4,
      "maxPostings":80,
      "detailConcurrency":3,
      "sourceTimeoutMs":180000
    }'::jsonb,
    'Workday source. Uses the requested BECU technology and data analytics family facets with capped detail fetches.'
  ),
  (
    'Tyler Technologies',
    'tylertech.com',
    'scraper',
    'tyler-technologies-custom-technology',
    'https://www.tylertech.com/careers/job-openings#f:@mrc_jobtype=[Job%20Type,Software%20Engineering]',
    false,
    '{
      "adapterNeeded":"tyler-careers-search",
      "category":"Software Engineering",
      "companyWebsite":"https://www.tylertech.com/careers/job-openings"
    }'::jsonb,
    'Disabled discovery row. Tyler Technologies exposes a custom filtered careers page and needs a dedicated endpoint adapter before importing.'
  ),
  (
    'Alkami',
    'alkami.com',
    'workday',
    'alkami-workday-technology',
    'https://alkami.wd12.myworkdayjobs.com/Alkami',
    true,
    '{
      "tenant":"alkami",
      "site":"Alkami",
      "apiBase":"https://alkami.wd12.myworkdayjobs.com/wday/cxs/alkami/Alkami",
      "publicBase":"https://alkami.wd12.myworkdayjobs.com/Alkami",
      "searchTexts":["data engineer","data science","data analytics","software engineer","cloud security","technology"],
      "pageSize":20,
      "maxPages":4,
      "maxPostings":80,
      "detailConcurrency":3,
      "sourceTimeoutMs":180000
    }'::jsonb,
    'Workday source. Searches Alkami software, technology, security, and data roles with capped detail fetches.'
  ),
  (
    'GoPuff',
    'gopuff.com',
    'scraper',
    'gopuff-cloudflare-careers',
    'https://www.gopuff.com/go/careers',
    false,
    '{
      "adapterNeeded":"gopuff-careers",
      "blockedBy":"cloudflare",
      "companyWebsite":"https://www.gopuff.com/go/careers"
    }'::jsonb,
    'Disabled discovery row. GoPuff careers returns a Cloudflare challenge to anonymous server-side ingestion requests.'
  ),
  (
    'Energy Transfer',
    'energytransfer.com',
    'scraper',
    'energy-transfer-selectminds-technology',
    'https://energytransfer.referrals.selectminds.com/landingpages/information-technology-opportunities-at-energy-transfer-family-of-partnerships-21',
    false,
    '{
      "adapterNeeded":"selectminds",
      "category":"Information Technology",
      "companyWebsite":"https://energytransfer.referrals.selectminds.com"
    }'::jsonb,
    'Disabled discovery row. Energy Transfer uses a SelectMinds referrals board that is blocked for anonymous server-side requests and needs a dedicated adapter.'
  ),
  (
    'Tenet Healthcare',
    'tenethealth.com',
    'scraper',
    'tenet-health-talentbrew-technology',
    'https://jobs.tenethealth.com/search-jobs',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.tenethealth.com",
      "orgId":"1127",
      "category":"Information Technology",
      "searchTerms":["software","developer","engineer","information technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "requiredTerms":["software","developer","engineer","data","analytics","data science","data engineering","data governance","security","technology","information technology","architect","cloud"],
      "maxPages":5,
      "companyWebsite":"https://jobs.tenethealth.com/search-jobs"
    }'::jsonb,
    'TalentBrew source. Searches Tenet Healthcare information technology, software, security, and data roles, then keeps US engineering/data roles.'
  ),
  (
    'Airswift',
    'airswift.com',
    'scraper',
    'airswift-hubspot-technology',
    'https://www.airswift.com/jobs?search=&location=United+States&verticals_discipline=86052668456&sector=*&employment_type=*&date_published=*',
    false,
    '{
      "adapterNeeded":"airswift-jobs",
      "platform":"hubspot-custom",
      "category":"Technology",
      "location":"United States",
      "companyWebsite":"https://www.airswift.com/jobs"
    }'::jsonb,
    'Disabled discovery row. Airswift jobs are rendered through a HubSpot/custom search surface and need a dedicated jobs endpoint adapter.'
  ),
  (
    'Dayforce',
    'dayforce.com',
    'scraper',
    'dayforce-jam-portal',
    'https://jobs.dayforcehcm.com/jam/CANDIDATEPORTAL',
    false,
    '{
      "adapterNeeded":"dayforce-candidate-portal",
      "companyWebsite":"https://jobs.dayforcehcm.com/jam/CANDIDATEPORTAL"
    }'::jsonb,
    'Disabled discovery row. Dayforce JAM uses a Dayforce candidate portal with APIs not yet supported by the importer.'
  ),
  (
    'Harman',
    'harman.com',
    'scraper',
    'harman-custom-careers',
    'https://jobsearch.harman.com/en_US/careers/JobDetail/eCommerce-Content-Specialist/30525',
    false,
    '{
      "adapterNeeded":"harman-careers",
      "blockedBy":"direct-job-error",
      "companyWebsite":"https://jobsearch.harman.com"
    }'::jsonb,
    'Disabled discovery row. The supplied Harman job URL redirects to a platform error for anonymous direct requests and needs a dedicated careers adapter.'
  ),
  (
    'Barco',
    'barco.com',
    'successfactors',
    'barco-successfactors-technology',
    'https://jobs.barco.com/job/Beaverton-Software-Engineer-OR-97005/1241467001/',
    true,
    '{
      "publicBase":"https://jobs.barco.com",
      "locale":"en_US",
      "searchTexts":["software","developer","engineer","data","analytics","data science","data engineering","data governance","cloud","security"],
      "locationSearch":"United States",
      "companyWebsite":"https://jobs.barco.com"
    }'::jsonb,
    'SuccessFactors source. Searches Barco software, engineering, security, and data roles, then keeps United States roles.'
  ),
  (
    'Alice + Olivia',
    'aliceandolivia.com',
    'scraper',
    'alice-and-olivia-custom-careers',
    'https://www.aliceandolivia.com/careers.html',
    false,
    '{
      "adapterNeeded":"alice-and-olivia-careers",
      "platform":"salesforce-commerce-custom",
      "companyWebsite":"https://www.aliceandolivia.com/careers.html"
    }'::jsonb,
    'Disabled discovery row. Alice + Olivia careers is a custom commerce-site careers page and needs a dedicated adapter before importing.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = now();
