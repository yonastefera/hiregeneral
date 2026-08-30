# Evaluated application assistance

The application coach is deterministic and provider-free. It does not send a
candidate's profile, resume, or application to an external AI service.

## Safety contract

- Use only the selected job and facts already saved on the authenticated user's
  profile.
- Present exact skill overlaps as evidence; never infer proficiency, years of
  experience, achievements, or employment history.
- Treat missing evidence as an editing prompt, not as proof that a candidate
  lacks a qualification.
- Never submit or modify an application without an explicit user action.
- Remind the user to review the factual starter before submission.

## Evaluation coverage

The unit contract verifies that unmatched job skills are not attributed to the
candidate, incomplete profiles produce no invented evidence, duplicate inputs
are normalized, and the output remains deterministic. Any future model-backed
implementation must pass these tests and add privacy, factuality, prompt
injection, and regression evaluations before release.
