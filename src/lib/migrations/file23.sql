-- Refine McKesson and Truist Workday sources with stable technology facets.

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
    'McKesson Corporation',
    'mckesson.com',
    'workday',
    'mckesson-external-careers',
    'https://mckesson.wd3.myworkdayjobs.com/en-US/External_Careers',
    true,
    '{
      "tenant":"mckesson",
      "site":"External_Careers",
      "publicBase":"https://mckesson.wd3.myworkdayjobs.com/en-US/External_Careers",
      "searchText":"technology",
      "appliedFacets":{
        "jobFamilyGroup":[
          "29ce91b0412201aafb7bf4bd4f169117"
        ],
        "Location_Country":[
          "bc33aa3152ec42d4995f4791a106ed09"
        ]
      }
    }'::jsonb,
    'Workday source. Uses Technology and United States facets before defensive US/engineering filters.'
  ),
  (
    'Truist Financial Corporation',
    'truist.com',
    'workday',
    'truist-careers',
    'https://truist.wd1.myworkdayjobs.com/en-US/Careers',
    true,
    '{
      "tenant":"truist",
      "site":"Careers",
      "publicBase":"https://truist.wd1.myworkdayjobs.com/en-US/Careers",
      "searchText":"technology",
      "appliedFacets":{
        "Job_Area":[
          "1ed629d2716901e1965c077d4c77ed1a"
        ]
      }
    }'::jsonb,
    'Workday source. Uses Enterprise Technology Group facet before defensive US/engineering filters.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
