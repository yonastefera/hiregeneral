import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { signInTestUser } from "../support/auth";

test("seeker saves, updates, reopens, and deletes a job alert", async ({
  page,
}) => {
  const email = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const password = process.env.SUPABASE_TEST_SEEKER_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (!email || !password || !supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing dedicated saved-search E2E credentials.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers();
  if (usersError) throw usersError;
  const seeker = usersPage.users.find((user) => user.email === email);
  if (!seeker) throw new Error("The seeker is missing from the test project.");

  const searchName = `Platform jobs E2E ${Date.now()}`;
  let savedSearchId: string | undefined;

  try {
    await signInTestUser(
      page,
      { email, password },
      "/jobs?query=Platform%20Engineer&location=Boston%2C%20MA",
    );
    await page.getByRole("button", { name: "Save this search" }).click();
    await page.getByLabel("Search name").fill(searchName);
    await page.getByLabel("Email alerts").selectOption("weekly");

    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/saved-searches") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Save search" }).click(),
    ]);
    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()) as {
      data?: { id?: string };
    };
    savedSearchId = created.data?.id;
    expect(savedSearchId).toBeTruthy();
    await expect(page.getByText("Search saved.")).toBeVisible();

    await page.goto("/settings/notifications");
    const savedSearch = page.locator("article").filter({ hasText: searchName });
    await expect(savedSearch).toBeVisible();
    const frequency = savedSearch.getByLabel(
      `Alert frequency for ${searchName}`,
    );
    await expect(frequency).toHaveValue("weekly");

    const [updateResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/saved-searches/${savedSearchId}`) &&
          response.request().method() === "PATCH",
      ),
      frequency.selectOption("daily"),
    ]);
    expect(updateResponse.status()).toBe(200);
    await expect(frequency).toHaveValue("daily");

    await savedSearch.getByRole("link", { name: searchName }).click();
    await expect(page).toHaveURL(/query=Platform(?:%20|\+)Engineer/);
    await expect(page).toHaveURL(/location=Boston(?:%2C|%2c)(?:%20|\+)MA/);

    await page.goto("/settings/notifications");
    const restoredSearch = page
      .locator("article")
      .filter({ hasText: searchName });
    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/saved-searches/${savedSearchId}`) &&
          response.request().method() === "DELETE",
      ),
      restoredSearch
        .getByRole("button", { name: `Delete ${searchName}` })
        .click(),
    ]);
    expect(deleteResponse.status()).toBe(200);
    await expect(restoredSearch).toHaveCount(0);
    savedSearchId = undefined;
  } finally {
    if (savedSearchId) {
      const { error } = await admin
        .from("saved_searches")
        .delete()
        .eq("id", savedSearchId)
        .eq("user_id", seeker.id);
      if (error) throw error;
    }
  }
});
