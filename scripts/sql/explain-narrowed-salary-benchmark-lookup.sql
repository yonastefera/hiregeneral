-- Read-only post-fix plan for a national software-engineer salary lookup.
-- Compare with explain-salary-benchmark-lookup.sql (435.416 ms / 552 rows).

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
  AND area_type = 'N'
LIMIT 5000;
