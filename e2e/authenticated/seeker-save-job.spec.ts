import { expect, test } from "@playwright/test";

import { signInTestUser } from "../support/auth";

const publishedJobId = "20000000-0000-4000-8000-000000000001";

test("seeker signs in and toggles a saved job without leaving fixture drift", async ({
  page,
}) => {
  const email = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const password = process.env.SUPABASE_TEST_SEEKER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing dedicated seeker E2E credentials.");
  }

  await signInTestUser(page, { email, password }, `/jobs/${publishedJobId}`);

  await expect(page).toHaveURL(new RegExp(`/jobs/${publishedJobId}`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const saveButton = page
    .locator("button[aria-pressed]")
    .filter({ hasText: /^(save|saved)$/i })
    .first();
  await expect(saveButton).toBeVisible();
  const initiallySaved =
    (await saveButton.getAttribute("aria-pressed")) === "true";

  const [saveResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/saved") &&
        response.request().method() === "POST",
    ),
    saveButton.click(),
  ]);
  const savePayload = (await saveResponse.json()) as {
    error?: string;
    saved?: boolean;
  };
  expect(
    saveResponse.status(),
    `Save mutation failed: ${savePayload.error ?? "unknown safe error"}`,
  ).toBe(200);
  expect(savePayload.saved).toBe(!initiallySaved);
  await expect(saveButton).toHaveAttribute(
    "aria-pressed",
    initiallySaved ? "false" : "true",
  );

  // Restore the deterministic fixture state even when it began already saved.
  const [restoreResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/saved") &&
        response.request().method() === "POST",
    ),
    saveButton.click(),
  ]);
  expect(restoreResponse.status()).toBe(200);
  await expect(saveButton).toHaveAttribute(
    "aria-pressed",
    initiallySaved ? "true" : "false",
  );
});
