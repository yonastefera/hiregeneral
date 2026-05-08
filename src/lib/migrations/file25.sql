-- Add Workday as a Workday source.
-- Uses United States + engineering/data/IS job family facets.

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
  'Workday',
  'workday.com',
  'workday',
  'workday-careers',
  'https://workday.wd5.myworkdayjobs.com/en-US/Workday',
  true,
  '{
    "tenant":"workday",
    "site":"Workday",
    "publicBase":"https://workday.wd5.myworkdayjobs.com/en-US/Workday",
    "searchText":"software",
    "appliedFacets":{
      "Location_Country":[
        "bc33aa3152ec42d4995f4791a106ed09"
      ],
      "jobFamilyGroup":[
        "8c5ce7a1cffb43e0a819c249a49fcb00",
        "a88cba90a00841e0b750341c541b9d56",
        "4b2f970c50930155b9985193020a0c72",
        "11d42f4a487c46b9b29ab3e087c2f5ca"
      ]
    }
  }'::jsonb,
  'Workday source. Uses US Product Development and Engineering, Engineering Operations, Data Science/BI/Analytics, and Information Systems facets before defensive filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
