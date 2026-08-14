import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("recruiter reviews only applicants for owned jobs", async ({ page }) => {
  const email = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const password = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (!email || !password || !supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing dedicated recruiter E2E credentials.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers();
  if (usersError) throw usersError;

  const recruiter = usersPage.users.find((user) => user.email === email);
  if (!recruiter)
    throw new Error("Recruiter A is missing from the test project.");

  const { data: ownedApplications, error: applicationsError } = await admin
    .from("applications")
    .select("applicant_full_name, jobs!inner(recruiter_id)")
    .eq("jobs.recruiter_id", recruiter.id);
  if (applicationsError) throw applicationsError;
  if (!ownedApplications?.length) {
    throw new Error("Recruiter A needs a seeded applicant for this E2E test.");
  }

  const expectedNames = ownedApplications.map(
    (application) => application.applicant_full_name || "Candidate",
  );

  await page.goto(
    `/signin?next=${encodeURIComponent("/employers/dashboard/candidates")}&role=employer`,
  );
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in to employer tools" }).click();

  await expect(page).toHaveURL(/\/employers\/dashboard\/candidates/);
  await expect(page.getByRole("heading", { name: "Candidates" })).toBeVisible();

  const response = await page.request.get(
    "/api/employers/candidates?jobId=all",
  );
  expect(response.status()).toBe(200);
  const payload = (await response.json()) as {
    candidates: Array<{ name: string }>;
  };
  expect(payload.candidates.map((candidate) => candidate.name).sort()).toEqual(
    expectedNames.sort(),
  );

  for (const name of expectedNames) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
});
