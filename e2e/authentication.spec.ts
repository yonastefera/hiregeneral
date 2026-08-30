import { expect, test } from "@playwright/test";

test("email sign-in requests a code and verifies it", async ({ page }) => {
  const requests: unknown[] = [];

  await page.route("**/api/auth/otp/request", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route("**/api/auth/otp/verify", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ role: "job_seeker", redirectTo: "/jobs" }),
    });
  });

  await page.goto("/signin?next=%2Fjobs");
  await page.getByLabel("Email").fill(" seeker@example.com ");
  await page.getByRole("button", { name: "Continue with email" }).click();

  await expect(
    page.getByRole("heading", { name: "Check your email." }),
  ).toBeVisible();
  await expect(page.getByText(/six-digit code sent to/)).toContainText(
    "seeker@example.com",
  );
  await page.locator('input[autocomplete="one-time-code"]').fill("123456");
  const jobsRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/jobs";
  });
  await page.getByRole("button", { name: "Verify and continue" }).click();

  await jobsRequest;
  expect(requests).toEqual([
    { email: "seeker@example.com" },
    { email: "seeker@example.com", token: "123456" },
  ]);
});

test("new employer intent chooses a workspace after verification", async ({
  page,
}) => {
  await page.route("**/api/auth/otp/request", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route("**/api/auth/otp/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ role: null, redirectTo: "/auth/choose-role" }),
    });
  });

  await page.goto("/signup?next=%2Femployers%2Fdashboard&role=employer");
  await expect(
    page.getByRole("heading", { name: "Continue to employer tools." }),
  ).toBeVisible();
  await page.getByLabel("Email").fill("new-employer@example.com");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.locator('input[autocomplete="one-time-code"]').fill("654321");
  const chooseRoleRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname === "/auth/choose-role" &&
      url.searchParams.get("next") === "/employers/dashboard"
    );
  });
  await page.getByRole("button", { name: "Verify and continue" }).click();

  await chooseRoleRequest;
});

test("invalid codes receive a safe, non-diagnostic error", async ({ page }) => {
  await page.route("**/api/auth/otp/request", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route("**/api/auth/otp/verify", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "That code is invalid or expired." }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("missing@example.com");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.locator('input[autocomplete="one-time-code"]').fill("000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();

  await expect(
    page.getByText("That code is invalid or expired."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
});
