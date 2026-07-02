import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("landing page renders the product entry point", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Draw, Copy, and Paste" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Editor" }).first()).toBeVisible();
  });

  test("templates page renders the template library", async ({ page }) => {
    await page.goto("/templates");

    await expect(page.getByText("Templates").first()).toBeVisible();
    await expect(page.getByText("Database schema templates")).toBeVisible();
  });

  test("editor route renders without requiring an account", async ({ page }) => {
    await page.goto("/editor");

    await expect(page).toHaveTitle(/Editor \| drawDB/);
    await expect(
      page.getByRole("heading", { name: "Create a local diagram" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create blank diagram" }).click();
    await expect(page.getByText("File").first()).toBeVisible();
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
