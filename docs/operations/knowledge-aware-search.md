# Knowledge-aware job search

Public job retrieval combines four deterministic evidence levels:

1. Exact normalized keyword evidence.
2. Canonical title and title-alias matches.
3. Canonical skill and skill-alias matches.
4. Strong reviewed title-to-skill relationships.

Exact evidence ranks above graph expansion. Every returned row carries a bounded
`semantic_score` and `semantic_reasons`, so ranking remains explainable. This
implementation does not call embedding models or paid AI APIs.

The search function preserves publication, expiration, age, location, work mode,
employment type, category, company, exclusion, pagination, and company-diversity
controls. Public requests are still rate-limited and cached. The cache version is
incremented when knowledge retrieval is deployed.

If the new RPC is unavailable during a rolling deployment, the API uses the
existing direct lexical fallback instead of failing the search page.

## Deployment

1. Ensure the knowledge graph migration is applied and its queue is empty.
2. Apply `20260830163000_knowledge_aware_job_search.sql` to the test project.
3. Run `verify-knowledge-aware-search.sql` and inspect the sample response.
4. Test exact, alias, skill, filters, empty-result, and pagination searches.
5. Apply and verify production before deploying the application.
