import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { signInTestUser } from "../support/auth";

test("only the owning recruiter can access an applicant resume", async ({
  browser,
  page,
}) => {
  const email = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const password = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const recruiterBEmail = process.env.SUPABASE_TEST_RECRUITER_B_EMAIL;
  const recruiterBPassword = process.env.SUPABASE_TEST_RECRUITER_B_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (
    !email ||
    !password ||
    !recruiterBEmail ||
    !recruiterBPassword ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
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
    .select(
      "id, applicant_full_name, resume_url, user_id, jobs!inner(recruiter_id)",
    )
    .eq("jobs.recruiter_id", recruiter.id);
  if (applicationsError) throw applicationsError;
  if (!ownedApplications?.length) {
    throw new Error("Recruiter A needs a seeded applicant for this E2E test.");
  }

  const resumeApplication = ownedApplications.find(
    (application) =>
      application.resume_url?.startsWith(`${application.user_id}/`) &&
      application.resume_url.toLowerCase().endsWith(".pdf"),
  );
  if (!resumeApplication?.resume_url) {
    throw new Error("Recruiter A needs a seeded owned PDF resume path.");
  }

  const expectedNames = ownedApplications.map(
    (application) => application.applicant_full_name || "Candidate",
  );
  let uploadedFixture = false;

  try {
    const { error: uploadError } = await admin.storage
      .from("resumes")
      .upload(
        resumeApplication.resume_url,
        readFileSync(resolve("e2e/fixtures/test-resume.pdf")),
        { contentType: "application/pdf", upsert: false },
      );
    if (uploadError) throw uploadError;
    uploadedFixture = true;

    await signInTestUser(
      page,
      { email, password },
      "/employers/dashboard/candidates",
    );

    await expect(page).toHaveURL(/\/employers\/dashboard\/candidates/);
    await expect(
      page.getByRole("heading", { name: "Candidates" }),
    ).toBeVisible();

    const response = await page.request.get(
      "/api/employers/candidates?jobId=all",
    );
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as {
      candidates: Array<{ id: string; name: string; resumeUrl: string | null }>;
    };
    expect(
      payload.candidates.map((candidate) => candidate.name).sort(),
    ).toEqual(expectedNames.sort());

    const authorizedCandidate = payload.candidates.find(
      (candidate) => candidate.id === resumeApplication.id,
    );
    expect(authorizedCandidate?.resumeUrl).toMatch(
      /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/sign\/resumes\//,
    );
    const resumeResponse = await page.request.get(
      authorizedCandidate?.resumeUrl ?? "",
    );
    expect(resumeResponse.status()).toBe(200);

    for (const name of expectedNames) {
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }

    const recruiterBContext = await browser.newContext({
      baseURL: new URL(page.url()).origin,
    });
    try {
      const recruiterBPage = await recruiterBContext.newPage();
      await signInTestUser(
        recruiterBPage,
        { email: recruiterBEmail, password: recruiterBPassword },
        "/employers/dashboard/candidates",
      );
      await expect(recruiterBPage).toHaveURL(
        /\/employers\/dashboard\/candidates/,
      );

      const deniedResponse = await recruiterBPage.request.get(
        "/api/employers/candidates?jobId=all",
      );
      expect(deniedResponse.status()).toBe(200);
      const deniedPayload = (await deniedResponse.json()) as {
        candidates: Array<{ id: string; resumeUrl: string | null }>;
      };
      expect(
        deniedPayload.candidates.some(
          (candidate) => candidate.id === resumeApplication.id,
        ),
      ).toBe(false);
    } finally {
      await recruiterBContext.close();
    }
  } finally {
    if (uploadedFixture) {
      const { error } = await admin.storage
        .from("resumes")
        .remove([resumeApplication.resume_url]);
      if (error) throw error;
    }
  }
});
