-- Add Lazard, Evercore, TD Bank, Cantor Fitzgerald/BGC, AllianceBernstein,
-- M&T Bank, Flagstar, ICE, Nasdaq, and Neuberger Berman technology/data sources.

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
      'Lazard',
      'lazard.com',
      'oracle_hcm',
      'lazard-oracle-hcm-professional-careers',
      'https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardProfessionalCareers/jobs',
      true,
      '{
        "apiBase":"https://icbpjb.fa.ocs.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
        "publicBase":"https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardProfessionalCareers/jobs",
        "siteNumber":"LazardProfessionalCareers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "countryCode":"US",
        "pageSize":50,
        "maxPages":8
      }'::jsonb,
      'Oracle HCM source. Imports Lazard United States software, data, analytics, technology, cloud, security, and AI roles from the public candidate experience API.'
    ),
    (
      'Evercore',
      'evercore.com',
      'scraper',
      'evercore-atom-feed-technology',
      'https://evercore.tal.net/vx/lang-en-GB/mobile-0/channel-1/appcentre-ext/brand-5/candidate/jobboard/vacancy/3/adv/',
      true,
      '{
        "adapter":"atom-feed",
        "feedUrl":"https://evercore.tal.net/vx/mobile-0/appcentre-1/brand-5/candidate/jobboard/vacancy/3/feed",
        "publicBase":"https://evercore.tal.net",
        "locationFallback":"New York, NY, United States",
        "category":"Technology",
        "companyWebsite":"https://www.evercore.com/careers/",
        "maxJobs":80
      }'::jsonb,
      'Generic Atom/RSS feed source. Imports Evercore US technology and data roles from the public Tal.net vacancy feed, then enriches from detail pages.'
    ),
    (
      'TD Bank',
      'td.com',
      'workday',
      'td-bank-workday-technology-data',
      'https://td.wd3.myworkdayjobs.com/en-US/TD_Bank_Careers?jobFamilyGroup=de769652963501d54ac13db5070407ac&jobFamilyGroup=de769652963501f2001247b507040dac&locationCountry=bc33aa3152ec42d4995f4791a106ed09',
      true,
      '{
        "tenant":"td",
        "site":"TD_Bank_Careers",
        "apiBase":"https://td.wd3.myworkdayjobs.com/wday/cxs/td/TD_Bank_Careers",
        "publicBase":"https://td.wd3.myworkdayjobs.com/TD_Bank_Careers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":[
            "de769652963501d54ac13db5070407ac",
            "de769652963501f2001247b507040dac"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports TD Bank United States technology and data roles from the requested job family facets.'
    ),
    (
      'Cantor Fitzgerald/BGC',
      'cantor.com',
      'oracle_hcm',
      'cantor-bgc-oracle-hcm-technology',
      'https://hdow.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/jobs?mode=location',
      true,
      '{
        "apiBase":"https://hdow.fa.us6.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
        "publicBase":"https://hdow.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/jobs",
        "siteNumber":"CX_1003",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "countryCode":"US",
        "pageSize":50,
        "maxPages":8
      }'::jsonb,
      'Oracle HCM source. Imports Cantor Fitzgerald/BGC United States technology and data roles from the public candidate experience API.'
    ),
    (
      'AllianceBernstein',
      'alliancebernstein.com',
      'workday',
      'alliancebernstein-workday-technology',
      'https://abglobal.wd1.myworkdayjobs.com/alliancebernsteincareers?locationCountry=bc33aa3152ec42d4995f4791a106ed09&jobFamilyGroup=ae2af035e17a010fea85212f6701c41d',
      true,
      '{
        "tenant":"abglobal",
        "site":"alliancebernsteincareers",
        "apiBase":"https://abglobal.wd1.myworkdayjobs.com/wday/cxs/abglobal/alliancebernsteincareers",
        "publicBase":"https://abglobal.wd1.myworkdayjobs.com/alliancebernsteincareers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":["ae2af035e17a010fea85212f6701c41d"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports AllianceBernstein United States technology roles from the requested job family facet.'
    ),
    (
      'M&T Bank',
      'mtb.com',
      'workday',
      'mtb-workday-technology',
      'https://mtb.wd5.myworkdayjobs.com/MTB?locationCountry=bc33aa3152ec42d4995f4791a106ed09&jobFamilyGroup=554435cdd16410021008f861a1f50000',
      true,
      '{
        "tenant":"mtb",
        "site":"MTB",
        "apiBase":"https://mtb.wd5.myworkdayjobs.com/wday/cxs/mtb/MTB",
        "publicBase":"https://mtb.wd5.myworkdayjobs.com/MTB",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":["554435cdd16410021008f861a1f50000"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Updates the existing M&T Bank source to the requested United States technology job family facet.'
    ),
    (
      'Flagstar Bank',
      'flagstar.com',
      'phenom',
      'flagstar-phenom-technology',
      'https://careers.flagstar.com/us/en/search-results?keywords=&from=30&s=1',
      true,
      '{
        "widgetApiEndpoint":"https://careers.flagstar.com/widgets",
        "refNum":"FBAFBYUS",
        "baseUrl":"https://careers.flagstar.com/us/en",
        "locale":"en_us",
        "country":"us",
        "pageName":"search-results",
        "siteType":"external",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "selectedFields":{
          "country":["United States","United States of America"]
        },
        "pageSize":50,
        "maxPages":6,
        "preferPublicJobUrl":true
      }'::jsonb,
      'Phenom source. Searches Flagstar United States technology, data, cloud, security, and AI roles before defensive filters.'
    ),
    (
      'Intercontinental Exchange',
      'ice.com',
      'scraper',
      'ice-jibe-technology',
      'https://careers.ice.com/jobs',
      true,
      '{
        "adapter":"jibe",
        "apiUrl":"https://careers.ice.com/api/jobs",
        "publicBase":"https://careers.ice.com",
        "category":"Technology",
        "query":{
          "tags2":"Technology",
          "location":"United States",
          "stretch":"10",
          "stretchUnit":"MILES",
          "woe":"12",
          "regionCode":"US",
          "internal":"false",
          "separator":"|",
          "facetField":"country|city|tags2"
        },
        "maxPages":10,
        "companyWebsite":"https://careers.ice.com/jobs"
      }'::jsonb,
      'Jibe/iCIMS source. Updates the existing ICE source URL while preserving the public Technology jobs API import.'
    ),
    (
      'Nasdaq',
      'nasdaq.com',
      'workday',
      'nasdaq-workday-technology-data',
      'https://nasdaq.wd1.myworkdayjobs.com/Global_External_Site?Location_Country=bc33aa3152ec42d4995f4791a106ed09&locations=4fc3c78102bf1001ff1647d79c120000&locations=11a1ba76c660019c8ea7aa17b1732717&locations=88704065592e016c9dd0f64421396e94&locations=88704065592e01b17dadde452139ae95&locations=7695fa1b288201dea7b24fc1f401c211&locations=88704065592e014fe2a2f8452139d195&locations=88704065592e01c96c837a442139c493&locations=88704065592e01cf1cdf5d4421399c93&locations=88704065592e01447ddcbb4521398195&locations=88704065592e01348ba27b4521392795&locations=88704065592e01ca2502744521391d95&locations=88704065592e01f5fecb6c4521391395&locations=77feeca0d2d101783b801a55ae765922&locations=77feeca0d2d101ee163fdb00b0763224&locations=77feeca0d2d1012998bc383db776572c&locations=77feeca0d2d101282049d571b176b126&locations=77feeca0d2d101d752185678b076fe24&locations=2eda87917c65016d732866b4f4585735&jobFamily=88704065592e01f356584f2a0c39a330&jobFamily=88704065592e01da409f312a0c398d30&jobFamily=88704065592e01c0a19e362a0c399130&jobFamily=6358e02a30c610014577ab8f2c170000&jobFamily=88704065592e01e2115d7c2a0c39c330&jobFamily=88704065592e011ddb67792a0c39c130&jobFamily=88704065592e01f21fef2e2a0c398b30&jobFamily=e4bb921d66e51001456b2e75a6290000',
      true,
      '{
        "tenant":"nasdaq",
        "site":"Global_External_Site",
        "apiBase":"https://nasdaq.wd1.myworkdayjobs.com/wday/cxs/nasdaq/Global_External_Site",
        "publicBase":"https://nasdaq.wd1.myworkdayjobs.com/Global_External_Site",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "Location_Country":["bc33aa3152ec42d4995f4791a106ed09"],
          "locations":[
            "4fc3c78102bf1001ff1647d79c120000",
            "11a1ba76c660019c8ea7aa17b1732717",
            "88704065592e016c9dd0f64421396e94",
            "88704065592e01b17dadde452139ae95",
            "7695fa1b288201dea7b24fc1f401c211",
            "88704065592e014fe2a2f8452139d195",
            "88704065592e01c96c837a442139c493",
            "88704065592e01cf1cdf5d4421399c93",
            "88704065592e01447ddcbb4521398195",
            "88704065592e01348ba27b4521392795",
            "88704065592e01ca2502744521391d95",
            "88704065592e01f5fecb6c4521391395",
            "77feeca0d2d101783b801a55ae765922",
            "77feeca0d2d101ee163fdb00b0763224",
            "77feeca0d2d1012998bc383db776572c",
            "77feeca0d2d101282049d571b176b126",
            "77feeca0d2d101d752185678b076fe24",
            "2eda87917c65016d732866b4f4585735"
          ],
          "jobFamily":[
            "88704065592e01f356584f2a0c39a330",
            "88704065592e01da409f312a0c398d30",
            "88704065592e01c0a19e362a0c399130",
            "6358e02a30c610014577ab8f2c170000",
            "88704065592e01e2115d7c2a0c39c330",
            "88704065592e011ddb67792a0c39c130",
            "88704065592e01f21fef2e2a0c398b30",
            "e4bb921d66e51001456b2e75a6290000"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports Nasdaq United States technology and data roles from the requested country, location, and job family facets.'
    ),
    (
      'Neuberger Berman',
      'nb.com',
      'workday',
      'neuberger-berman-workday-technology',
      'https://nb.wd1.myworkdayjobs.com/nbcareers?jobFamilyGroup=211034776a25100163ee494212360000&jobFamilyGroup=211034776a25100163edf95179320000',
      true,
      '{
        "tenant":"nb",
        "site":"nbcareers",
        "apiBase":"https://nb.wd1.myworkdayjobs.com/wday/cxs/nb/nbcareers",
        "publicBase":"https://nb.wd1.myworkdayjobs.com/nbcareers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "jobFamilyGroup":[
            "211034776a25100163ee494212360000",
            "211034776a25100163edf95179320000"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports Neuberger Berman technology and data roles from the requested job family facets.'
    )
)
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
WHERE job_sources.source_slug = sources.source_slug;

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
      'Lazard',
      'lazard.com',
      'oracle_hcm',
      'lazard-oracle-hcm-professional-careers',
      'https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardProfessionalCareers/jobs',
      true,
      '{
        "apiBase":"https://icbpjb.fa.ocs.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
        "publicBase":"https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardProfessionalCareers/jobs",
        "siteNumber":"LazardProfessionalCareers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "countryCode":"US",
        "pageSize":50,
        "maxPages":8
      }'::jsonb,
      'Oracle HCM source. Imports Lazard United States software, data, analytics, technology, cloud, security, and AI roles from the public candidate experience API.'
    ),
    (
      'Evercore',
      'evercore.com',
      'scraper',
      'evercore-atom-feed-technology',
      'https://evercore.tal.net/vx/lang-en-GB/mobile-0/channel-1/appcentre-ext/brand-5/candidate/jobboard/vacancy/3/adv/',
      true,
      '{
        "adapter":"atom-feed",
        "feedUrl":"https://evercore.tal.net/vx/mobile-0/appcentre-1/brand-5/candidate/jobboard/vacancy/3/feed",
        "publicBase":"https://evercore.tal.net",
        "locationFallback":"New York, NY, United States",
        "category":"Technology",
        "companyWebsite":"https://www.evercore.com/careers/",
        "maxJobs":80
      }'::jsonb,
      'Generic Atom/RSS feed source. Imports Evercore US technology and data roles from the public Tal.net vacancy feed, then enriches from detail pages.'
    ),
    (
      'TD Bank',
      'td.com',
      'workday',
      'td-bank-workday-technology-data',
      'https://td.wd3.myworkdayjobs.com/en-US/TD_Bank_Careers?jobFamilyGroup=de769652963501d54ac13db5070407ac&jobFamilyGroup=de769652963501f2001247b507040dac&locationCountry=bc33aa3152ec42d4995f4791a106ed09',
      true,
      '{
        "tenant":"td",
        "site":"TD_Bank_Careers",
        "apiBase":"https://td.wd3.myworkdayjobs.com/wday/cxs/td/TD_Bank_Careers",
        "publicBase":"https://td.wd3.myworkdayjobs.com/TD_Bank_Careers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":[
            "de769652963501d54ac13db5070407ac",
            "de769652963501f2001247b507040dac"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports TD Bank United States technology and data roles from the requested job family facets.'
    ),
    (
      'Cantor Fitzgerald/BGC',
      'cantor.com',
      'oracle_hcm',
      'cantor-bgc-oracle-hcm-technology',
      'https://hdow.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/jobs?mode=location',
      true,
      '{
        "apiBase":"https://hdow.fa.us6.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
        "publicBase":"https://hdow.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/jobs",
        "siteNumber":"CX_1003",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "countryCode":"US",
        "pageSize":50,
        "maxPages":8
      }'::jsonb,
      'Oracle HCM source. Imports Cantor Fitzgerald/BGC United States technology and data roles from the public candidate experience API.'
    ),
    (
      'AllianceBernstein',
      'alliancebernstein.com',
      'workday',
      'alliancebernstein-workday-technology',
      'https://abglobal.wd1.myworkdayjobs.com/alliancebernsteincareers?locationCountry=bc33aa3152ec42d4995f4791a106ed09&jobFamilyGroup=ae2af035e17a010fea85212f6701c41d',
      true,
      '{
        "tenant":"abglobal",
        "site":"alliancebernsteincareers",
        "apiBase":"https://abglobal.wd1.myworkdayjobs.com/wday/cxs/abglobal/alliancebernsteincareers",
        "publicBase":"https://abglobal.wd1.myworkdayjobs.com/alliancebernsteincareers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":["ae2af035e17a010fea85212f6701c41d"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports AllianceBernstein United States technology roles from the requested job family facet.'
    ),
    (
      'M&T Bank',
      'mtb.com',
      'workday',
      'mtb-workday-technology',
      'https://mtb.wd5.myworkdayjobs.com/MTB?locationCountry=bc33aa3152ec42d4995f4791a106ed09&jobFamilyGroup=554435cdd16410021008f861a1f50000',
      true,
      '{
        "tenant":"mtb",
        "site":"MTB",
        "apiBase":"https://mtb.wd5.myworkdayjobs.com/wday/cxs/mtb/MTB",
        "publicBase":"https://mtb.wd5.myworkdayjobs.com/MTB",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":["554435cdd16410021008f861a1f50000"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Updates the existing M&T Bank source to the requested United States technology job family facet.'
    ),
    (
      'Flagstar Bank',
      'flagstar.com',
      'phenom',
      'flagstar-phenom-technology',
      'https://careers.flagstar.com/us/en/search-results?keywords=&from=30&s=1',
      true,
      '{
        "widgetApiEndpoint":"https://careers.flagstar.com/widgets",
        "refNum":"FBAFBYUS",
        "baseUrl":"https://careers.flagstar.com/us/en",
        "locale":"en_us",
        "country":"us",
        "pageName":"search-results",
        "siteType":"external",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "selectedFields":{
          "country":["United States","United States of America"]
        },
        "pageSize":50,
        "maxPages":6,
        "preferPublicJobUrl":true
      }'::jsonb,
      'Phenom source. Searches Flagstar United States technology, data, cloud, security, and AI roles before defensive filters.'
    ),
    (
      'Intercontinental Exchange',
      'ice.com',
      'scraper',
      'ice-jibe-technology',
      'https://careers.ice.com/jobs',
      true,
      '{
        "adapter":"jibe",
        "apiUrl":"https://careers.ice.com/api/jobs",
        "publicBase":"https://careers.ice.com",
        "category":"Technology",
        "query":{
          "tags2":"Technology",
          "location":"United States",
          "stretch":"10",
          "stretchUnit":"MILES",
          "woe":"12",
          "regionCode":"US",
          "internal":"false",
          "separator":"|",
          "facetField":"country|city|tags2"
        },
        "maxPages":10,
        "companyWebsite":"https://careers.ice.com/jobs"
      }'::jsonb,
      'Jibe/iCIMS source. Updates the existing ICE source URL while preserving the public Technology jobs API import.'
    ),
    (
      'Nasdaq',
      'nasdaq.com',
      'workday',
      'nasdaq-workday-technology-data',
      'https://nasdaq.wd1.myworkdayjobs.com/Global_External_Site?Location_Country=bc33aa3152ec42d4995f4791a106ed09&locations=4fc3c78102bf1001ff1647d79c120000&locations=11a1ba76c660019c8ea7aa17b1732717&locations=88704065592e016c9dd0f64421396e94&locations=88704065592e01b17dadde452139ae95&locations=7695fa1b288201dea7b24fc1f401c211&locations=88704065592e014fe2a2f8452139d195&locations=88704065592e01c96c837a442139c493&locations=88704065592e01cf1cdf5d4421399c93&locations=88704065592e01447ddcbb4521398195&locations=88704065592e01348ba27b4521392795&locations=88704065592e01ca2502744521391d95&locations=88704065592e01f5fecb6c4521391395&locations=77feeca0d2d101783b801a55ae765922&locations=77feeca0d2d101ee163fdb00b0763224&locations=77feeca0d2d1012998bc383db776572c&locations=77feeca0d2d101282049d571b176b126&locations=77feeca0d2d101d752185678b076fe24&locations=2eda87917c65016d732866b4f4585735&jobFamily=88704065592e01f356584f2a0c39a330&jobFamily=88704065592e01da409f312a0c398d30&jobFamily=88704065592e01c0a19e362a0c399130&jobFamily=6358e02a30c610014577ab8f2c170000&jobFamily=88704065592e01e2115d7c2a0c39c330&jobFamily=88704065592e011ddb67792a0c39c130&jobFamily=88704065592e01f21fef2e2a0c398b30&jobFamily=e4bb921d66e51001456b2e75a6290000',
      true,
      '{
        "tenant":"nasdaq",
        "site":"Global_External_Site",
        "apiBase":"https://nasdaq.wd1.myworkdayjobs.com/wday/cxs/nasdaq/Global_External_Site",
        "publicBase":"https://nasdaq.wd1.myworkdayjobs.com/Global_External_Site",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "Location_Country":["bc33aa3152ec42d4995f4791a106ed09"],
          "locations":[
            "4fc3c78102bf1001ff1647d79c120000",
            "11a1ba76c660019c8ea7aa17b1732717",
            "88704065592e016c9dd0f64421396e94",
            "88704065592e01b17dadde452139ae95",
            "7695fa1b288201dea7b24fc1f401c211",
            "88704065592e014fe2a2f8452139d195",
            "88704065592e01c96c837a442139c493",
            "88704065592e01cf1cdf5d4421399c93",
            "88704065592e01447ddcbb4521398195",
            "88704065592e01348ba27b4521392795",
            "88704065592e01ca2502744521391d95",
            "88704065592e01f5fecb6c4521391395",
            "77feeca0d2d101783b801a55ae765922",
            "77feeca0d2d101ee163fdb00b0763224",
            "77feeca0d2d1012998bc383db776572c",
            "77feeca0d2d101282049d571b176b126",
            "77feeca0d2d101d752185678b076fe24",
            "2eda87917c65016d732866b4f4585735"
          ],
          "jobFamily":[
            "88704065592e01f356584f2a0c39a330",
            "88704065592e01da409f312a0c398d30",
            "88704065592e01c0a19e362a0c399130",
            "6358e02a30c610014577ab8f2c170000",
            "88704065592e01e2115d7c2a0c39c330",
            "88704065592e011ddb67792a0c39c130",
            "88704065592e01f21fef2e2a0c398b30",
            "e4bb921d66e51001456b2e75a6290000"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports Nasdaq United States technology and data roles from the requested country, location, and job family facets.'
    ),
    (
      'Neuberger Berman',
      'nb.com',
      'workday',
      'neuberger-berman-workday-technology',
      'https://nb.wd1.myworkdayjobs.com/nbcareers?jobFamilyGroup=211034776a25100163ee494212360000&jobFamilyGroup=211034776a25100163edf95179320000',
      true,
      '{
        "tenant":"nb",
        "site":"nbcareers",
        "apiBase":"https://nb.wd1.myworkdayjobs.com/wday/cxs/nb/nbcareers",
        "publicBase":"https://nb.wd1.myworkdayjobs.com/nbcareers",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "appliedFacets":{
          "jobFamilyGroup":[
            "211034776a25100163ee494212360000",
            "211034776a25100163edf95179320000"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports Neuberger Berman technology and data roles from the requested job family facets.'
    )
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
  FROM public.job_sources AS job_sources
  WHERE job_sources.source_slug = sources.source_slug
);
