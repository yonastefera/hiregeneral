import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { signInTestUser } from "../support/auth";

test("billing entry is company-scoped and safely disabled without Stripe", async ({
  browser,
  page,
}) => {
  const recruiterEmail = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const recruiterPassword = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const seekerEmail = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const seekerPassword = process.env.SUPABASE_TEST_SEEKER_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (
    !recruiterEmail ||
    !recruiterPassword ||
    !seekerEmail ||
    !seekerPassword ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error("Missing dedicated billing E2E credentials.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers();
  if (usersError) throw usersError;

  const recruiter = usersPage.users.find(
    (user) => user.email === recruiterEmail,
  );
  if (!recruiter) {
    throw new Error("Recruiter A is missing from the test project.");
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id")
    .eq("owner_id", recruiter.id)
    .single();
  if (companyError) throw companyError;

  await signInTestUser(
    page,
    { email: recruiterEmail, password: recruiterPassword },
    "/employers/dashboard/subscription",
  );

  await expect(page).toHaveURL(/\/employers\/dashboard\/subscription/);
  await expect(
    page.getByRole("heading", { name: "Subscription & billing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Billing setup needed" }),
  ).toBeDisabled();

  const summaryResponse = await page.request.get(
    "/api/employers/billing/summary",
  );
  expect(summaryResponse.status()).toBe(200);
  const summaryPayload = (await summaryResponse.json()) as {
    summary: { companyId: string; configured: boolean };
  };
  expect(summaryPayload.summary).toMatchObject({
    companyId: company.id,
    configured: false,
  });

  const invalidPlan = await page.request.post(
    "/api/employers/billing/create-checkout-session",
    { data: { plan: "enterprise", priceId: "price_from_browser" } },
  );
  expect(invalidPlan.status()).toBe(400);
  expect(await invalidPlan.json()).toEqual({
    error: "Choose a valid billing plan.",
  });

  const seekerContext = await browser.newContext({
    baseURL: new URL(page.url()).origin,
  });
  try {
    const seekerPage = await seekerContext.newPage();
    await signInTestUser(
      seekerPage,
      { email: seekerEmail, password: seekerPassword },
      "/profile",
    );
    await expect(seekerPage).toHaveURL(/\/profile/);

    const denied = await seekerPage.request.post(
      "/api/employers/billing/create-checkout-session",
      { data: { plan: "growth" } },
    );
    expect(denied.status()).toBe(403);
  } finally {
    await seekerContext.close();
  }
});
