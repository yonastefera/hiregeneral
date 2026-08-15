import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

type ApplicationPayload = {
  job_id: string;
  resume_url: string;
  [key: string]: unknown;
};

test("seeker applies once and duplicate submission is rejected", async ({
  page,
}) => {
  const email = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const password = process.env.SUPABASE_TEST_SEEKER_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (!email || !password || !supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing dedicated seeker E2E credentials.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers();
  if (usersError) throw usersError;

  const seeker = usersPage.users.find((user) => user.email === email);
  if (!seeker) throw new Error("The seeker is missing from the test project.");

  const { data: existingApplications, error: existingError } = await admin
    .from("applications")
    .select("job_id")
    .eq("user_id", seeker.id);
  if (existingError) throw existingError;

  const appliedJobIds = (existingApplications ?? []).map(
    (application) => application.job_id,
  );
  let jobsQuery = admin
    .from("jobs")
    .select("id")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(10);
  if (appliedJobIds.length) {
    jobsQuery = jobsQuery.not("id", "in", `(${appliedJobIds.join(",")})`);
  }

  const { data: jobs, error: jobsError } = await jobsQuery;
  if (jobsError) throw jobsError;
  const job = jobs?.[0];
  if (!job) {
    throw new Error(
      "The test project needs a published job the seeker has not applied to.",
    );
  }

  let applicationId: string | undefined;
  let uploadedResumePath: string | undefined;

  try {
    await page.goto(
      `/signin?next=${encodeURIComponent(`/jobs/${job.id}/apply`)}`,
    );
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}/apply`));
    await page.getByLabel("Full name *").fill("Authenticated E2E Seeker");
    await page.getByLabel("Current location").fill("Boston, MA");
    await page.getByRole("button", { name: /Continue/ }).click();

    await page
      .locator("#resume")
      .setInputFiles(resolve("e2e/fixtures/test-resume.pdf"));
    await page.getByRole("button", { name: /Continue/ }).click();

    await page.getByLabel("Years of experience *").click();
    await page.getByRole("option", { name: "2–4 years" }).click();
    await page.getByLabel("Work authorization *").click();
    await page.getByRole("option", { name: "U.S. Citizen" }).click();
    await page.getByLabel("Cover note").fill("Authenticated E2E application.");
    await page.getByRole("button", { name: /Continue/ }).click();

    await page.getByRole("checkbox").check();
    const [applicationResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/applications") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Submit application" }).click(),
    ]);
    const requestPayload = applicationResponse.request().postDataJSON() as
      | ApplicationPayload
      | undefined;
    const responsePayload = (await applicationResponse.json()) as {
      id?: string;
      error?: string;
    };
    applicationId = responsePayload.id;
    uploadedResumePath = requestPayload?.resume_url;

    expect(
      applicationResponse.status(),
      responsePayload.error ?? "Application submission failed.",
    ).toBe(201);
    expect(applicationId).toBeTruthy();
    expect(requestPayload?.job_id).toBe(job.id);
    await expect(
      page.getByRole("heading", { name: "Application sent" }),
    ).toBeVisible();

    const duplicate = await page.evaluate(async (payload) => {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { status: response.status, body: await response.json() };
    }, requestPayload);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ error: "Already applied to this job" });
  } finally {
    if (applicationId) {
      const { error } = await admin
        .from("applications")
        .delete()
        .eq("id", applicationId)
        .eq("user_id", seeker.id);
      if (error) throw error;
    }

    if (uploadedResumePath) {
      const { error } = await admin.storage
        .from("resumes")
        .remove([uploadedResumePath]);
      if (error) throw error;
    }
  }
});
