import { expect, test } from "@playwright/test";

test("visitor searches for a job", async ({ page }) => {
  await page.goto("/jobs");

  await expect(
    page.getByRole("heading", {
      name: /find work.*that fits.*your next move/i,
    }),
  ).toBeVisible();

  const search = page.getByRole("search", { name: "Search jobs" });
  await search
    .getByLabel("Job title, skill, company, or keyword")
    .fill("software engineer");
  await search.getByLabel("City, state, or ZIP").fill("Boston, MA");
  await search.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/query=software(?:%20|\+)engineer/);
  await expect(page).toHaveURL(/location=Boston(?:%2C|%2c|,)(?:%20|\+)MA/);
  await expect(
    page.getByRole("region", { name: "Job search results and filters" }),
  ).toBeVisible();
});
