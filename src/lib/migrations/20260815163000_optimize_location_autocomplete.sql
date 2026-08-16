-- Canonicalize and index the public location autocomplete query.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS locations_city_lower_trgm_idx
  ON public.locations USING gin (lower(city) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS locations_state_lower_idx
  ON public.locations (lower(state));

CREATE INDEX IF NOT EXISTS locations_zip_code_pattern_idx
  ON public.locations (zip_code text_pattern_ops);

CREATE OR REPLACE FUNCTION public.search_locations(search_query text)
RETURNS TABLE(
  id bigint,
  city text,
  state text,
  zip_code text,
  country text,
  popularity_rank integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
ROWS 8
AS $$
  WITH normalized AS (
    SELECT lower(trim(regexp_replace(search_query, '\s+', ' ', 'g'))) AS q
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
$$;

ANALYZE public.locations;
