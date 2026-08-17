import { expect, test } from "@playwright/test";

import { signInTestUser } from "../support/auth";

test("recruiter updates and restores the owned company profile", async ({
  page,
}) => {
  const email = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const password = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing dedicated recruiter E2E credentials.");
  }

  await signInTestUser(
    page,
    { email, password },
    "/employers/dashboard/company",
  );

  await expect(page).toHaveURL(/\/employers\/dashboard\/company/);
  await expect(
    page.getByRole("heading", { name: "Company profile" }),
  ).toBeVisible();

  const tagline = page.getByPlaceholder(
    "A short candidate-facing positioning line",
  );
  const originalTagline = await tagline.inputValue();
  const testTagline = `Authenticated E2E ${Date.now()}`;

  try {
    await tagline.fill(testTagline);
    const [saveResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/employers/company") &&
          response.request().method() === "PUT",
      ),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);

    expect(saveResponse.status()).toBe(200);
    await expect(page.getByText("Company profile saved.")).toBeVisible();
    await expect(tagline).toHaveValue(testTagline);
  } finally {
    await tagline.fill(originalTagline);
    const [restoreResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/employers/company") &&
          response.request().method() === "PUT",
      ),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);
    expect(restoreResponse.status()).toBe(200);
    await expect(tagline).toHaveValue(originalTagline);
  }
});
