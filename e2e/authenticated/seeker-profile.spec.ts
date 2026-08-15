import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("seeker completes profile details and preserves ownership", async ({
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

  const { data: originalProfile, error: profileError } = await admin
    .from("profiles")
    .select("full_name, headline")
    .eq("user_id", seeker.id)
    .single();
  if (profileError) throw profileError;

  const testName = originalProfile.full_name || "Authenticated E2E Seeker";
  const testHeadline = `Authenticated E2E profile ${Date.now()}`;

  try {
    await page.goto(`/signin?next=${encodeURIComponent("/profile")}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page
      .locator('section[aria-labelledby="profile-info-heading"]')
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Full name *").fill(testName);
    await page.getByLabel("Headline").fill(testHeadline);

    const [updateResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/rest/v1/profiles") &&
          response.request().method() === "PATCH",
      ),
      page.getByRole("button", { name: "Save", exact: true }).click(),
    ]);
    expect(updateResponse.status()).toBe(200);
    await expect(page.getByText("Profile updated.")).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby="profile-info-heading"]')
        .getByText(testHeadline, { exact: true }),
    ).toBeVisible();

    const { data: persisted, error: persistedError } = await admin
      .from("profiles")
      .select("full_name, headline")
      .eq("user_id", seeker.id)
      .single();
    if (persistedError) throw persistedError;
    expect(persisted).toMatchObject({
      full_name: testName,
      headline: testHeadline,
    });
  } finally {
    const { error } = await admin
      .from("profiles")
      .update({
        full_name: originalProfile.full_name,
        headline: originalProfile.headline,
      })
      .eq("user_id", seeker.id);
    if (error) throw error;
  }
});
