-- Add Visa as a Workday source.
-- Uses Engineering & Technology + United States facets before defensive filters.

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
VALUES (
  'Visa',
  'visa.com',
  'workday',
  'visa-workday',
  'https://visa.wd5.myworkdayjobs.com/en-US/Visa',
  true,
  '{
    "tenant":"visa",
    "site":"Visa",
    "publicBase":"https://visa.wd5.myworkdayjobs.com/en-US/Visa",
    "searchText":"technology",
    "appliedFacets":{
      "jobFamilyGroup":[
        "e8c806498390105c6260a580252a0363"
      ],
      "locationCountry":[
        "bc33aa3152ec42d4995f4791a106ed09"
      ]
    }
  }'::jsonb,
  'Workday source. Uses Engineering & Technology and United States facets before defensive US/engineering filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
