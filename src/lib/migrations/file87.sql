-- Add Roku, Autodesk, and KeyBank technology/data job sources.

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
      'Roku',
      'weareroku.com',
      'scraper',
      'roku-careers-technology-data',
      'https://www.weareroku.com/jobs/search?page=1&country_codes%5B%5D=US&query=',
      true,
      '{
        "adapter":"roku-careers",
        "category":"Technology",
        "companyWebsite":"https://www.weareroku.com/jobs/search",
        "publicBase":"https://www.weareroku.com",
        "maxPages":5
      }'::jsonb,
      'Server-rendered Roku careers source. Imports US software, engineering, technology, analytics, AI, and data roles.'
    ),
    (
      'Autodesk',
      'autodesk.com',
      'workday',
      'autodesk-workday-technology-data',
      'https://autodesk.wd1.myworkdayjobs.com/Ext?locationCountry=bc33aa3152ec42d4995f4791a106ed09&jobFamilyGroup=cebdb69fb1cc10006a257c84e5560000&jobFamilyGroup=1f75c4299c9201c0f3b5f8e6fa01c5bf&jobFamilyGroup=cebdb69fb1cc10005cc6ab3438260000&jobFamilyGroup=618805f018ad0121295e43c1fa011ebd&jobFamilyGroup=cebdb69fb1cc10006aa832992f760000',
      true,
      '{
        "tenant":"autodesk",
        "site":"Ext",
        "apiBase":"https://autodesk.wd1.myworkdayjobs.com/wday/cxs/autodesk/Ext",
        "publicBase":"https://autodesk.wd1.myworkdayjobs.com/Ext",
        "searchTexts":["software","data","technology","analytics","security","cloud","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":[
            "cebdb69fb1cc10006a257c84e5560000",
            "1f75c4299c9201c0f3b5f8e6fa01c5bf",
            "cebdb69fb1cc10005cc6ab3438260000",
            "618805f018ad0121295e43c1fa011ebd",
            "cebdb69fb1cc10006aa832992f760000"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports US roles from the requested Autodesk technology, digital, data, engineering, and related job family facets.'
    ),
    (
      'KeyBank',
      'key.com',
      'workday',
      'keybank-workday-technology',
      'https://keybank.wd5.myworkdayjobs.com/External_Career_Site?jobFamilyGroup=001793df81f21030a9688a3596ab4a1f',
      true,
      '{
        "tenant":"keybank",
        "site":"External_Career_Site",
        "apiBase":"https://keybank.wd5.myworkdayjobs.com/wday/cxs/keybank/External_Career_Site",
        "publicBase":"https://keybank.wd5.myworkdayjobs.com/External_Career_Site",
        "searchTexts":["software","data","technology","analytics","security","cloud","ai"],
        "appliedFacets":{
          "jobFamilyGroup":["001793df81f21030a9688a3596ab4a1f"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports KeyBank technology, software, data, analytics, security, cloud, and AI roles from the requested job family facet.'
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
      'Roku',
      'weareroku.com',
      'scraper',
      'roku-careers-technology-data',
      'https://www.weareroku.com/jobs/search?page=1&country_codes%5B%5D=US&query=',
      true,
      '{
        "adapter":"roku-careers",
        "category":"Technology",
        "companyWebsite":"https://www.weareroku.com/jobs/search",
        "publicBase":"https://www.weareroku.com",
        "maxPages":5
      }'::jsonb,
      'Server-rendered Roku careers source. Imports US software, engineering, technology, analytics, AI, and data roles.'
    ),
    (
      'Autodesk',
      'autodesk.com',
      'workday',
      'autodesk-workday-technology-data',
      'https://autodesk.wd1.myworkdayjobs.com/Ext?locationCountry=bc33aa3152ec42d4995f4791a106ed09&jobFamilyGroup=cebdb69fb1cc10006a257c84e5560000&jobFamilyGroup=1f75c4299c9201c0f3b5f8e6fa01c5bf&jobFamilyGroup=cebdb69fb1cc10005cc6ab3438260000&jobFamilyGroup=618805f018ad0121295e43c1fa011ebd&jobFamilyGroup=cebdb69fb1cc10006aa832992f760000',
      true,
      '{
        "tenant":"autodesk",
        "site":"Ext",
        "apiBase":"https://autodesk.wd1.myworkdayjobs.com/wday/cxs/autodesk/Ext",
        "publicBase":"https://autodesk.wd1.myworkdayjobs.com/Ext",
        "searchTexts":["software","data","technology","analytics","security","cloud","ai"],
        "appliedFacets":{
          "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"],
          "jobFamilyGroup":[
            "cebdb69fb1cc10006a257c84e5560000",
            "1f75c4299c9201c0f3b5f8e6fa01c5bf",
            "cebdb69fb1cc10005cc6ab3438260000",
            "618805f018ad0121295e43c1fa011ebd",
            "cebdb69fb1cc10006aa832992f760000"
          ]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports US roles from the requested Autodesk technology, digital, data, engineering, and related job family facets.'
    ),
    (
      'KeyBank',
      'key.com',
      'workday',
      'keybank-workday-technology',
      'https://keybank.wd5.myworkdayjobs.com/External_Career_Site?jobFamilyGroup=001793df81f21030a9688a3596ab4a1f',
      true,
      '{
        "tenant":"keybank",
        "site":"External_Career_Site",
        "apiBase":"https://keybank.wd5.myworkdayjobs.com/wday/cxs/keybank/External_Career_Site",
        "publicBase":"https://keybank.wd5.myworkdayjobs.com/External_Career_Site",
        "searchTexts":["software","data","technology","analytics","security","cloud","ai"],
        "appliedFacets":{
          "jobFamilyGroup":["001793df81f21030a9688a3596ab4a1f"]
        },
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Imports KeyBank technology, software, data, analytics, security, cloud, and AI roles from the requested job family facet.'
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
