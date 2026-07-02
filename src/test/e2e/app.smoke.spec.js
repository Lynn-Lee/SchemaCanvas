import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("landing page renders the product entry point", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Draw, Copy, and Paste" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Editor" }).first()).toBeVisible();
  });

  test("landing page fits a 390px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Draw, Copy, and Paste" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Try it for yourself" }),
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      const documentWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      const viewportWidth = window.innerWidth;
      const ctaRect = document
        .querySelector('a[href="/editor"]')
        .getBoundingClientRect();

      return {
        bodyWidth,
        ctaLeft: Math.floor(ctaRect.left),
        ctaRight: Math.ceil(ctaRect.right),
        documentWidth,
        viewportWidth,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.ctaLeft).toBeGreaterThanOrEqual(0);
    expect(layout.ctaRight).toBeLessThanOrEqual(layout.viewportWidth);
  });

  test("landing social posts load after the social section is reached", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Draw, Copy, and Paste" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Try it for yourself" }),
    ).toBeVisible();
    await expect(page.getByTestId("landing-social-widget")).toHaveCount(0);

    await page.getByText("What the internet says about us").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("landing-social-placeholder")).toBeVisible();
  });

  test("templates page renders the template library", async ({ page }) => {
    await page.goto("/templates");

    await expect(page.getByText("Templates").first()).toBeVisible();
    await expect(page.getByText("Database schema templates")).toBeVisible();
  });

  test("editor route renders without requiring an account", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/editor");

    await expect(page).toHaveTitle(/Editor \| drawDB/);
    await expect(
      page.getByRole("heading", { name: "Create a local diagram" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create blank diagram" }).click();
    await expect(page.getByText("File").first()).toBeVisible();
    await expect(page.getByText("Small screen editor mode")).toBeHidden();
  });

  test("cloud diagram load failure falls back to local editor mode", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/editor?cloudDiagramId=missing-cloud-diagram");

    await expect(
      page.getByRole("heading", { name: "Create a local diagram" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create blank diagram" }).click();
    await expect(page.getByText("File").first()).toBeVisible();
  });

  test("editor shows a mobile experience hint on small screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/editor");
    await page.getByRole("button", { name: "Create blank diagram" }).click();

    await expect(page.getByText("Small screen editor mode")).toBeVisible();
    await expect(
      page.getByText("For full canvas editing, use a tablet or desktop."),
    ).toBeVisible();

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  });

  test("editor toolbar icon buttons have names and modal close restores focus", async ({
    page,
  }) => {
    await page.goto("/editor");
    await page.getByRole("button", { name: "Create blank diagram" }).click();

    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Redo" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add table", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add area", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add note", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Versions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Theme" })).toBeVisible();

    const shareButton = page.getByRole("button", { name: "Share" });
    await shareButton.click();
    await expect(page.getByRole("dialog", { name: "Share" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Share" })).toBeHidden();
    await expect(shareButton).toBeFocused();
  });
});
