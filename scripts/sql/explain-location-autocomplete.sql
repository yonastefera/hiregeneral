-- Read-only production plan for a representative location autocomplete call.
-- Uses the live search_locations(text) RPC and its built-in eight-row limit.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT *
FROM public.search_locations('new');
