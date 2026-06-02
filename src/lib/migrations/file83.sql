-- Enable Match Group/Tinder Eightfold roles with tighter title filtering.

UPDATE public.job_sources
SET
  source_type = 'scraper',
  source_url = 'https://join.matchgroupcareers.com/careers?domain=gotinder.com&sort_by=relevance&triggerGoButton=true',
  enabled = true,
  metadata = '{
    "adapter":"eightfold",
    "apiBase":"https://join.matchgroupcareers.com",
    "domain":"gotinder.com",
    "searchText":"technology",
    "searchTexts":["software","developer","engineer","mobile","android","ios","platform","data","analytics","data science","data engineering","data governance","security","AI","machine learning"],
    "requiredTerms":["software","developer","engineer","mobile","android","ios","platform","data","analytics","data science","data engineering","security","AI","machine learning","trust & safety"],
    "titleTerms":["software","developer","engineer","mobile","android","ios","platform","data","analytics","scientist","security","AI","machine learning","trust & safety"],
    "excludedTitleTerms":["financial","finance","marketing","account","content","partner"],
    "location":"United States",
    "sortBy":"relevance",
    "pageSize":10,
    "maxPages":8,
    "companyWebsite":"https://join.matchgroupcareers.com/careers"
  }'::jsonb,
  notes = 'Eightfold source. Searches Match Group/Tinder US software, mobile, platform, data, AI, trust and safety, and security roles with strict title filtering.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'match-group-eightfold-technology';
