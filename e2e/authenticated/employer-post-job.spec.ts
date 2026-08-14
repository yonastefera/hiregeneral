import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("recruiter creates and removes an owned draft job", async ({ page }) => {
  const email = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const password = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (!email || !password || !supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing dedicated recruiter E2E credentials.");
  }

  const title = `Authenticated E2E Draft ${Date.now()}`;
  let createdJobId: string | undefined;

  try {
    await page.goto(
      `/signin?next=${encodeURIComponent("/employers/dashboard/post-job")}&role=employer`,
    );
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page
      .getByRole("button", { name: "Sign in to employer tools" })
      .click();

    await expect(page).toHaveURL(/\/employers\/dashboard\/post-job/);
    await page.getByPlaceholder("e.g. Senior Product Designer").fill(title);
    await page.getByPlaceholder("Acme Inc.").fill("Test Company A");
    await page.getByPlaceholder("Atlanta, GA").fill("Boston, MA");
    await page
      .getByPlaceholder(
        "What will this person do? What does success look like?",
      )
      .fill(
        "Validate that an authenticated recruiter can safely create an owned draft job.",
      );
    await page
      .getByPlaceholder("React, TypeScript, Figma — comma separated")
      .fill("Testing, Security");

    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/employers/jobs") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Save draft" }).click(),
    ]);

    expect(createResponse.status()).toBe(201);
    const payload = (await createResponse.json()) as {
      job?: { id?: string; status?: string; title?: string };
    };
    createdJobId = payload.job?.id;
    expect(createdJobId).toBeTruthy();
    expect(payload.job).toMatchObject({ status: "draft", title });
    await expect(page.getByText("Draft saved successfully.")).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  } finally {
    if (createdJobId) {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await admin
        .from("jobs")
        .delete()
        .eq("id", createdJobId)
        .eq("title", title);

      if (error) {
        throw new Error(
          `Could not remove authenticated E2E draft: ${error.message}`,
        );
      }
    }
  }
});
