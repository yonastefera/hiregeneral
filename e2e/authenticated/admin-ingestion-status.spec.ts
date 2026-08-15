import { expect, test, type Browser, type Page } from "@playwright/test";

async function signIn(
  page: Page,
  email: string,
  password: string,
  options: { employer?: boolean; next: string },
) {
  const role = options.employer ? "&role=employer" : "";
  await page.goto(`/signin?next=${encodeURIComponent(options.next)}${role}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page
    .getByRole("button", {
      name: options.employer ? "Sign in to employer tools" : "Sign in",
      exact: true,
    })
    .click();
}

async function assertRoleRedirect(
  browser: Browser,
  baseURL: string,
  credentials: { email: string; password: string; employer?: boolean },
  expectedPath: RegExp,
) {
  const context = await browser.newContext({ baseURL });

  try {
    const page = await context.newPage();
    await signIn(page, credentials.email, credentials.password, {
      employer: credentials.employer,
      next: "/admin-control-center/sources",
    });
    await expect(page).toHaveURL(expectedPath);

    await page.goto("/admin-control-center/sources");
    await expect(page).toHaveURL(expectedPath);
  } finally {
    await context.close();
  }
}

test("admin can review ingestion status while other roles and missing secrets are denied", async ({
  browser,
  page,
}) => {
  const adminEmail = process.env.SUPABASE_TEST_ADMIN_EMAIL;
  const adminPassword = process.env.SUPABASE_TEST_ADMIN_PASSWORD;
  const recruiterEmail = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const recruiterPassword = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const seekerEmail = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const seekerPassword = process.env.SUPABASE_TEST_SEEKER_PASSWORD;
  const ingestSecret = process.env.INGEST_SECRET;

  if (
    !adminEmail ||
    !adminPassword ||
    !recruiterEmail ||
    !recruiterPassword ||
    !seekerEmail ||
    !seekerPassword ||
    !ingestSecret
  ) {
    throw new Error("Missing dedicated admin ingestion E2E credentials.");
  }

  const anonymousResponse = await page.request.get(
    "/api/ingest/jobs/monitor?window=24h",
  );
  expect(anonymousResponse.status()).toBe(401);
  expect(await anonymousResponse.json()).toEqual({
    ok: false,
    error: "Unauthorized",
  });

  await signIn(page, adminEmail, adminPassword, {
    next: "/admin-control-center/sources",
  });
  await expect(page).toHaveURL(/\/admin-control-center\/sources$/);
  await expect(
    page.getByRole("heading", { name: "Imported job source monitor" }),
  ).toBeVisible();

  const monitorResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ingest/jobs/monitor?") &&
      response.request().method() === "GET",
  );
  await page.getByPlaceholder("INGEST_SECRET").fill(ingestSecret);
  await page.getByRole("button", { name: "Refresh" }).click();
  expect((await monitorResponse).status()).toBe(200);

  await expect(page.getByText("Active imported jobs")).toBeVisible();
  await expect(page.getByText("Enabled sources")).toBeVisible();
  await expect(page.getByText("Failed runs", { exact: true })).toBeVisible();
  await expect(page.getByText("New jobs", { exact: true })).toBeVisible();

  const baseURL = new URL(page.url()).origin;
  await assertRoleRedirect(
    browser,
    baseURL,
    {
      email: recruiterEmail,
      password: recruiterPassword,
      employer: true,
    },
    /\/employers\/dashboard$/,
  );
  await assertRoleRedirect(
    browser,
    baseURL,
    { email: seekerEmail, password: seekerPassword },
    /\/jobs$/,
  );
});
