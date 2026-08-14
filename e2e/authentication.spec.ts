import { expect, test } from "@playwright/test";

const password = "correct-horse-battery-staple";

test("seeker submits registration and receives confirmation guidance", async ({
  page,
}) => {
  let submittedBody: unknown;
  await page.route("**/api/auth/signup", async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        message: "If the address is eligible, an email will arrive shortly.",
      }),
    });
  });

  await page.goto("/signup?next=%2Fjobs");
  await page.getByLabel("Email").fill(" seeker@example.com ");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Check your email to confirm your account."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/signin\?next=%2Fjobs/);
  expect(submittedBody).toEqual({
    email: "seeker@example.com",
    password,
    role: "job_seeker",
  });
});

test("employer registration submits only the selected public role", async ({
  page,
}) => {
  let submittedBody: unknown;
  await page.route("**/api/auth/signup", async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/signup?next=%2Femployers%2Fdashboard&role=employer");
  await expect(
    page.getByRole("heading", { name: "Create an employer account." }),
  ).toBeVisible();
  await page.getByLabel("Email").fill("employer@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  expect(submittedBody).toEqual({
    email: "employer@example.com",
    password,
    role: "recruiter",
  });
  expect(JSON.stringify(submittedBody)).not.toContain("admin");
});

test("password reset shows the same response for every eligible address", async ({
  page,
}) => {
  let submittedBody: unknown;
  await page.route("**/api/auth/password-reset", async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        message: "If the address is eligible, an email will arrive shortly.",
      }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("missing@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(
    page.getByText("If an account exists, a password reset link will be sent."),
  ).toBeVisible();
  expect(submittedBody).toEqual({ email: "missing@example.com" });
});
