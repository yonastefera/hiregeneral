import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { signInTestUser } from "../support/auth";

test("employer advances a candidate, records private feedback, and the seeker sees the response", async ({
  browser,
  page,
}) => {
  const seekerEmail = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const seekerPassword = process.env.SUPABASE_TEST_SEEKER_PASSWORD;
  const recruiterAEmail = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const recruiterAPassword = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const recruiterBEmail = process.env.SUPABASE_TEST_RECRUITER_B_EMAIL;
  const recruiterBPassword = process.env.SUPABASE_TEST_RECRUITER_B_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (
    !seekerEmail ||
    !seekerPassword ||
    !recruiterAEmail ||
    !recruiterAPassword ||
    !recruiterBEmail ||
    !recruiterBPassword ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error("Missing dedicated application-lifecycle credentials.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers();
  if (usersError) throw usersError;
  const seeker = usersPage.users.find((user) => user.email === seekerEmail);
  const recruiterA = usersPage.users.find(
    (user) => user.email === recruiterAEmail,
  );
  if (!seeker || !recruiterA) {
    throw new Error("Application-lifecycle users are missing.");
  }

  const { data: application, error: applicationError } = await admin
    .from("applications")
    .select(
      "id, applicant_full_name, status, pipeline_stage_id, jobs!inner(recruiter_id, title)",
    )
    .eq("user_id", seeker.id)
    .eq("jobs.recruiter_id", recruiterA.id)
    .not("status", "in", "(rejected,withdrawn)")
    .limit(1)
    .single();
  if (applicationError || !application) {
    throw new Error(
      "Recruiter A needs an open seeded application from the test seeker.",
    );
  }

  const { data: stages, error: stagesError } = await admin
    .from("employer_pipeline_stages")
    .select("id, name, application_status")
    .eq("recruiter_id", recruiterA.id)
    .neq(
      "id",
      application.pipeline_stage_id ?? "00000000-0000-0000-0000-000000000000",
    )
    .neq("application_status", "rejected")
    .order("position")
    .limit(1);
  if (stagesError) throw stagesError;
  const targetStage = stages?.[0];
  if (!targetStage) throw new Error("Recruiter A needs pipeline stages.");

  const candidateName = application.applicant_full_name || "Candidate";
  const responseNote = `Next-step response ${Date.now()}`;
  const scorecardRound = `E2E interview ${Date.now()}`;
  const startedAt = new Date().toISOString();

  try {
    await signInTestUser(
      page,
      { email: recruiterAEmail, password: recruiterAPassword },
      "/employers/dashboard/candidates",
    );
    const candidate = page.locator("article").filter({
      has: page.getByRole("heading", { name: candidateName, exact: true }),
    });
    await expect(candidate).toBeVisible();
    await candidate
      .getByRole("button", {
        name: `Change pipeline stage for ${candidateName}`,
      })
      .click();
    await candidate.getByLabel("Candidate status").selectOption(targetStage.id);
    await candidate
      .getByPlaceholder("Optional response visible to the candidate")
      .fill(responseNote);
    const [moveResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response
            .url()
            .endsWith(`/api/employers/applications/${application.id}`) &&
          response.request().method() === "PATCH",
      ),
      candidate.getByRole("button", { name: "Update" }).click(),
    ]);
    expect(moveResponse.status()).toBe(200);
    await expect(page.getByText("Candidate status updated.")).toBeVisible();

    await candidate.getByRole("button", { name: "Scorecard" }).click();
    await candidate.getByLabel("Interview round").fill(scorecardRound);
    await candidate.getByLabel("Recommendation").selectOption("yes");
    await candidate.getByLabel("Overall rating").selectOption("4");
    const [scorecardResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response
            .url()
            .endsWith(
              `/api/employers/applications/${application.id}/scorecards`,
            ) && response.request().method() === "POST",
      ),
      candidate.getByRole("button", { name: "Save scorecard" }).click(),
    ]);
    expect(scorecardResponse.status()).toBe(200);
    await expect(page.getByText("Interview scorecard saved.")).toBeVisible();
    await expect(
      candidate.getByText(scorecardRound, { exact: true }),
    ).toBeVisible();

    const baseURL = new URL(page.url()).origin;
    const recruiterBContext = await browser.newContext({ baseURL });
    try {
      const recruiterBPage = await recruiterBContext.newPage();
      await signInTestUser(
        recruiterBPage,
        { email: recruiterBEmail, password: recruiterBPassword },
        "/employers/dashboard/candidates",
      );
      const denied = await recruiterBPage.request.get(
        `/api/employers/applications/${application.id}/scorecards`,
      );
      expect(denied.status()).toBe(404);
    } finally {
      await recruiterBContext.close();
    }

    const seekerContext = await browser.newContext({ baseURL });
    try {
      const seekerPage = await seekerContext.newPage();
      await signInTestUser(
        seekerPage,
        { email: seekerEmail, password: seekerPassword },
        "/applications",
      );
      await expect(
        seekerPage.getByText(responseNote, { exact: true }),
      ).toBeVisible();
      await expect(
        seekerPage.getByText(targetStage.name, { exact: true }),
      ).toBeVisible();
      await expect(
        seekerPage.getByText(scorecardRound, { exact: true }),
      ).toHaveCount(0);
    } finally {
      await seekerContext.close();
    }
  } finally {
    const { error: scorecardDeleteError } = await admin
      .from("interview_scorecards")
      .delete()
      .eq("application_id", application.id)
      .eq("reviewer_id", recruiterA.id)
      .eq("interview_round", scorecardRound);
    if (scorecardDeleteError) throw scorecardDeleteError;

    const { error: restoreError } = await admin
      .from("applications")
      .update({
        status: application.status,
        pipeline_stage_id: application.pipeline_stage_id,
      })
      .eq("id", application.id);
    if (restoreError) throw restoreError;

    const { error: eventsDeleteError } = await admin
      .from("application_status_events")
      .delete()
      .eq("application_id", application.id)
      .gte("created_at", startedAt);
    if (eventsDeleteError) throw eventsDeleteError;
  }
});
