# Configurable employer pipeline

Each recruiter owns one reusable ordered set of 2–12 candidate stages. Stage
names are employer-facing, while every stage maps to one stable
applicant-facing status: reviewing, interview, offer, or rejected.

Pipeline configuration is replaced atomically by
`employer_replace_pipeline_stages`. Existing stage identifiers are preserved
when stages are renamed or reordered. Removing a stage clears that assignment
from affected applications without deleting their timeline history.

Candidate movement uses `employer_move_application_to_stage`. The function
verifies ownership of both the application and target stage, updates the
application, and appends the candidate-visible timeline event in the same
transaction. Direct application-stage changes outside this workflow are
blocked.

New employers receive the default Reviewing, Interview, Offer, and Not
selected stages when their first job is created. Employers can then rename,
reorder, add, or remove stages from the Candidates screen.

## Deployment

1. Apply `20260830013000_configurable_candidate_pipeline.sql` to the dedicated
   test project.
2. Run `docs/operations/verify-employer-pipeline.sql`; every value must be
   `true`.
3. Test configuration and candidate movement with a recruiter-owned test job.
4. Apply and verify the same migration in production.
5. Deploy the application code.

The migration is additive. Do not delete pipeline or timeline rows as an
operational rollback; deploy the previous application version instead.
