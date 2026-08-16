-- Read-only production plan for the primary salary-estimate lookup path.
-- Mirrors "software engineer" -> OEWS occupation code 151252 for latest 2025.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  release_year,
  occupation_code,
  occupation_name,
  area_type,
  area_code,
  area_name,
  state_code,
  employment,
  annual_mean,
  annual_p10,
  annual_p25,
  annual_median,
  annual_p75,
  annual_p90,
  hourly_median
FROM public.salary_benchmarks
WHERE release_year = 2025
  AND annual_median IS NOT NULL
  AND occupation_code IN ('151252')
LIMIT 5000;
