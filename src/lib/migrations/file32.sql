-- Add Choice Hotels as a Workday source.

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
  'Choice Hotels',
  'choicehotels.com',
  'workday',
  'choice-hotels-external',
  'https://choicehotels.wd5.myworkdayjobs.com/External',
  true,
  '{
    "tenant":"choicehotels",
    "site":"External",
    "publicBase":"https://choicehotels.wd5.myworkdayjobs.com/External",
    "searchText":"technology",
    "appliedFacets":{
      "jobFamilyGroup":[
        "313e698c1d65100f34974e0f6cfa6f38",
        "313e698c1d65100f349717047fa56bed"
      ]
    }
  }'::jsonb,
  'Workday source. Uses Information Technology and Advanced Analytics facets before defensive US/engineering filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
