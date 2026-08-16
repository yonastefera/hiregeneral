-- Read-only expanded plan for search_locations('new'). This mirrors the live
-- function body so PostgreSQL exposes internal scans, sorts, and window work.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
WITH normalized AS (
  SELECT lower(trim(regexp_replace('new', '\s+', ' ', 'g'))) AS q
),
ranked AS (
  SELECT
    location.id,
    location.city,
    location.state,
    location.zip_code,
    coalesce(location.country, 'USA') AS country,
    coalesce(location.popularity_rank, 100000) AS popularity_rank,
    normalized.q,
    row_number() OVER (
      PARTITION BY lower(location.city), upper(location.state)
      ORDER BY
        CASE
          WHEN lower(location.city) = normalized.q THEN 0
          WHEN lower(location.city) LIKE normalized.q || '%' THEN 1
          WHEN lower(location.city) LIKE '%' || normalized.q || '%' THEN 2
          WHEN location.zip_code LIKE normalized.q || '%' THEN 3
          ELSE 4
        END,
        coalesce(location.popularity_rank, 100000) ASC,
        location.zip_code ASC
    ) AS city_state_rank
  FROM public.locations AS location
  CROSS JOIN normalized
  WHERE length(normalized.q) >= 2
    AND (
      lower(location.city) LIKE normalized.q || '%'
      OR lower(location.city) LIKE '%' || normalized.q || '%'
      OR lower(location.state) = normalized.q
      OR location.zip_code LIKE normalized.q || '%'
    )
)
SELECT
  ranked.id,
  ranked.city,
  ranked.state,
  ranked.zip_code,
  ranked.country,
  ranked.popularity_rank
FROM ranked
WHERE ranked.city_state_rank = 1
ORDER BY
  CASE
    WHEN lower(ranked.city) = ranked.q THEN 0
    WHEN lower(ranked.city) LIKE ranked.q || '%' THEN 1
    WHEN lower(ranked.city) LIKE '%' || ranked.q || '%' THEN 2
    ELSE 3
  END,
  ranked.popularity_rank ASC,
  ranked.city ASC,
  ranked.state ASC
LIMIT 8;
