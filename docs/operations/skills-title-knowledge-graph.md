# Skills and title knowledge graph

The knowledge graph gives search and ranking a deterministic vocabulary without
calling an AI service. It starts deliberately small and can grow through reviewed
data migrations.

## Model

- Canonical skills and titles have stable slugs, categories or families, and a
  provenance field.
- Alias tables resolve common abbreviations and spelling variants.
- Weighted title-to-skill edges represent useful relationships without claiming
  that every skill is mandatory for every role.
- Job mapping tables connect published job records to canonical concepts while
  preserving the alias that produced each match.

The graph is reference data. Public users may read concepts and mappings for
published jobs, but only migrations may modify the ontology.

## Enrichment

Job inserts and relevant updates add one deduplicated queue record. They do not
perform graph matching inside the write transaction. The service-role-only batch
processor claims at most 1,000 jobs with `SKIP LOCKED`, refreshes mappings, and
removes completed queue records.

Ingestion processes one 500-job batch after each source publish. This keeps source
publishing bounded while naturally draining the queue. The initial migration
queues existing jobs for backfill.

## Deployment

1. Apply `20260830150000_skills_title_knowledge_graph.sql` to the test project.
2. Run `verify-skills-title-knowledge-graph.sql`.
3. Repeat the processor statement until `remaining_jobs` is zero.
4. Inspect several mapped titles and skills before applying to production.
5. Apply and backfill production, then deploy the application.

Future ontology additions should use forward migrations. Do not silently remap a
canonical slug or reuse it for a different concept.
