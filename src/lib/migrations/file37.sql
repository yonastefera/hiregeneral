-- Narrow CVS Health Phenom imports to technology-oriented categories.

UPDATE public.job_sources
SET
  metadata = jsonb_set(
    metadata,
    '{selectedFields}',
    '{
      "category":["Innovation and Technology"],
      "subCategory":[
        "Data and Analytics",
        "Digital Engineering & Architecture",
        "Digital Product, Design & Operations",
        "Enterprise Information Security ",
        "Information Technology"
      ]
    }'::jsonb,
    true
  ),
  notes = 'Phenom source narrowed to CVS technology categories/subcategories before US engineering filters.',
  updated_at = now()
WHERE source_type = 'phenom'
  AND source_slug = 'cvs-health-phenom';
