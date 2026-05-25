-- Add the next requested public technology sources.
-- WSJ/Dow Jones and Adidas are kept as disabled discovery rows because their
-- current career apps need dedicated adapters before automatic imports.

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
    'Dow Jones',
    'dowjones.com',
    'scraper',
    'wsj-dow-jones-nlx',
    'https://wsj.jobs/locations/usa/jobs/',
    false,
    '{
      "adapterNeeded":"nlx-solr",
      "sourceSite":"wsj.jobs",
      "jobFolder":"wsj-jobs",
      "categories":["Software Product Engineering","IT, Telecom & Internet"],
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. WSJ/Dow Jones uses a Nuxt/NLX search app that needs a dedicated adapter before automated imports.'
  ),
  (
    'NerdWallet',
    'nerdwallet.com',
    'ashby',
    'NerdWallet',
    'https://www.nerdwallet.com/careers/jobs',
    true,
    '{
      "boardName":"NerdWallet",
      "publicBase":"https://www.nerdwallet.com/careers/jobs"
    }'::jsonb,
    'Ashby source. Imports NerdWallet US technology roles and removes internships.'
  ),
  (
    'Mozilla',
    'mozilla.org',
    'greenhouse',
    'mozilla',
    'https://www.mozilla.org/en-US/careers/listings/',
    true,
    '{
      "publicBase":"https://www.mozilla.org/en-US/careers/listings/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Mozilla US/remote engineering and technology roles and removes internships.'
  ),
  (
    'Varo Money',
    'varomoney.com',
    'scraper',
    'varo-money-kula',
    'https://careers.kula.ai/varo-money',
    true,
    '{
      "adapter":"kula",
      "accountName":"varo-money",
      "publicBase":"https://careers.kula.ai",
      "category":"Technology",
      "companyWebsite":"https://www.varomoney.com"
    }'::jsonb,
    'Kula source. Imports listed Varo Money US technology roles from the public Kula careers page.'
  ),
  (
    'HelloFresh',
    'hellofresh.com',
    'phenom',
    'hellofresh-phenom',
    'https://careers.hellofresh.com/global/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.hellofresh.com/widgets",
      "refNum":"HELLGLOBAL",
      "baseUrl":"https://careers.hellofresh.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data"],
      "selectedFields":{
        "country":["United States"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches HelloFresh United States technology roles before defensive filters.'
  ),
  (
    'The Washington Post',
    'washingtonpost.com',
    'workday',
    'washington-post-careers',
    'https://washpost.wd5.myworkdayjobs.com/washingtonpostcareers/jobs',
    true,
    '{
      "tenant":"washpost",
      "site":"washingtonpostcareers",
      "apiBase":"https://washpost.wd5.myworkdayjobs.com/wday/cxs/washpost/washingtonpostcareers",
      "publicBase":"https://washpost.wd5.myworkdayjobs.com/washingtonpostcareers",
      "searchTexts":["software","engineer","developer","data","security","technology"],
      "pageSize":20,
      "maxPages":5
    }'::jsonb,
    'Workday source. Searches Washington Post technology roles before defensive US/engineering filters.'
  ),
  (
    'Intercontinental Exchange',
    'ice.com',
    'scraper',
    'ice-jibe-technology',
    'https://careers.ice.com/jobs?tags2=Technology&page=1&location=United%20States&stretch=10&stretchUnit=MILES&woe=12&regionCode=US',
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
      "maxPages":10
    }'::jsonb,
    'Jibe/iCIMS source. Imports ICE United States technology roles from the public careers JSON endpoint.'
  ),
  (
    'Genentech',
    'gene.com',
    'phenom',
    'genentech-phenom',
    'https://careers.gene.com/us/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.gene.com/widgets",
      "refNum":"GENEUS",
      "baseUrl":"https://careers.gene.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data"],
      "selectedFields":{
        "country":["United States of America"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches Genentech United States technology roles before defensive filters.'
  ),
  (
    'SentinelOne',
    'sentinelone.com',
    'greenhouse',
    'sentinellabs',
    'https://www.sentinelone.com/jobs/',
    true,
    '{
      "publicBase":"https://www.sentinelone.com/jobs/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports SentinelOne US engineering/technology roles and removes internships.'
  ),
  (
    'Adidas',
    'adidas-group.com',
    'scraper',
    'adidas-group-custom',
    'https://careers.adidas-group.com/jobs?brand=&team=&type=&keywords=&location=%5B%7B%22region%22%3A%22Americas%22%2C%22country%22%3A%22United+States+of+America%22%7D%5D&sort=&locale=en&offset=0',
    false,
    '{
      "adapterNeeded":"adidas-custom",
      "country":"United States of America",
      "region":"Americas",
      "searchText":"technology"
    }'::jsonb,
    'Disabled discovery row. Adidas careers requires a dedicated adapter; direct server-side requests time out in the current importer environment.'
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
