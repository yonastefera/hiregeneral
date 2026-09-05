CREATE TABLE public.job_detail_cache (
  source_name TEXT NOT NULL,
  source_id TEXT NOT NULL,
  detail_url TEXT NOT NULL,
  listing_fingerprint TEXT NOT NULL,
  detail_payload JSONB NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source_name, source_id)
);

CREATE INDEX job_detail_cache_refreshed_at_idx
  ON public.job_detail_cache (refreshed_at);

ALTER TABLE public.job_detail_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.job_detail_cache FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_detail_cache
  TO service_role;
