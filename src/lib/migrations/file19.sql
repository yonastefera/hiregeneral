-- Refine PwC Workday ingestion with technology-oriented Workday facets.

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
  'PwC',
  'pwc.com',
  'workday',
  'pwc-us-experienced-careers',
  'https://pwc.wd3.myworkdayjobs.com/en-US/US_Experienced_Careers',
  true,
  '{
    "tenant":"pwc",
    "site":"US_Experienced_Careers",
    "publicBase":"https://pwc.wd3.myworkdayjobs.com/en-US/US_Experienced_Careers",
    "searchText":"technology",
    "appliedFacets":{
      "jobFamilyGroup":[
        "b38cfc0f829110144280fa7cb7390000",
        "ddb55b48949a101442808313d3b50000",
        "83dadf5ea2a310144280a2bc558e0000",
        "fcc2b0980c4d1014427ed0de08fe0000",
        "fc91b97ed3901014427f0c8a1b840000"
      ]
    }
  }'::jsonb,
  'Workday source. Uses PwC technology-oriented job family facets before US/engineering filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
