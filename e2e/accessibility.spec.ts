import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/jobs",
  "/salary-guide",
  "/employers",
  "/signin",
  "/signup",
] as const;

for (const route of publicRoutes) {
  test(`${route} has core accessible structure`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#main-content");

    const violations = await page.locator("body").evaluate(() => {
      const visible = (element: Element) => {
        const htmlElement = element as HTMLElement;
        const style = getComputedStyle(htmlElement);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          !htmlElement.hidden
        );
      };
      const accessibleName = (element: Element) => {
        const labelledBy = element.getAttribute("aria-labelledby");
        const labelledText = labelledBy
          ?.split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ");
        return (
          element.getAttribute("aria-label") ||
          labelledText ||
          element.getAttribute("title") ||
          element.textContent ||
          element.querySelector("img")?.getAttribute("alt") ||
          ""
        ).trim();
      };
      const problems: string[] = [];

      document.querySelectorAll("button, a[href]").forEach((element) => {
        if (visible(element) && !accessibleName(element)) {
          problems.push(`${element.tagName.toLowerCase()} lacks a name`);
        }
      });
      document
        .querySelectorAll("input, select, textarea")
        .forEach((element) => {
          if (
            !visible(element) ||
            (element as HTMLInputElement).type === "hidden"
          ) {
            return;
          }
          const id = element.id;
          const labelled =
            accessibleName(element) ||
            element.closest("label")?.textContent?.trim() ||
            (id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
          if (!labelled) {
            problems.push(`${element.tagName.toLowerCase()} lacks a label`);
          }
        });
      document.querySelectorAll("img").forEach((image) => {
        if (!image.hasAttribute("alt")) problems.push("img lacks alt");
      });

      return problems;
    });

    expect(violations).toEqual([]);
  });
}

test("core pages avoid horizontal overflow on a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/jobs", "/signin", "/employers"]) {
    await page.goto(route);
    const dimensions = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(
      dimensions.scrollWidth,
      `${route} has horizontal overflow`,
    ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test("skip link moves keyboard focus to the content container", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
