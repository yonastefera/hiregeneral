-- Refine Accenture and DIRECTV Workday sources with stable US technology facets.

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
    'Accenture',
    'accenture.com',
    'workday',
    'accenture-careers',
    'https://accenture.wd103.myworkdayjobs.com/en-US/AccentureCareers',
    true,
    '{
      "tenant":"accenture",
      "site":"AccentureCareers",
      "publicBase":"https://accenture.wd103.myworkdayjobs.com/en-US/AccentureCareers",
      "searchText":"technology",
      "appliedFacets":{
        "jobFamilyGroup":[
          "bb69a804fb120130e52200ed1301d275",
          "99f04fef1b5710010b161504c3910000",
          "bb69a804fb1201712ed6f3ec1301bc75",
          "bb69a804fb1201653003f3ec1301ba75",
          "bb69a804fb1201f7535003ed1301d875"
        ],
        "locationCountry":[
          "bc33aa3152ec42d4995f4791a106ed09"
        ]
      }
    }'::jsonb,
    'Workday source. Uses US Software Engineering, AI & Data, IT Operations, Security, and Technology Architecture facets before defensive filters.'
  ),
  (
    'DIRECTV',
    'directv.com',
    'workday',
    'directv-careers',
    'https://directv.wd1.myworkdayjobs.com/en-US/Careers',
    true,
    '{
      "tenant":"directv",
      "site":"Careers",
      "publicBase":"https://directv.wd1.myworkdayjobs.com/en-US/Careers",
      "searchText":"technology",
      "appliedFacets":{
        "jobFamilyGroup":[
          "360156a8bee410010f162b4ce3a30000"
        ],
        "Location_Country":[
          "bc33aa3152ec42d4995f4791a106ed09"
        ]
      }
    }'::jsonb,
    'Workday source. Uses Information Technology and United States facets before defensive filters.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
