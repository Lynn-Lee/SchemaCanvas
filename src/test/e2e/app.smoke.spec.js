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
});
