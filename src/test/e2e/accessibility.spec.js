import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const seriousOrCritical = ["serious", "critical"];

async function expectNoSeriousAccessibilityViolations(page) {
  await page.waitForTimeout(1_000);

  const results = await new AxeBuilder({ page })
    .exclude(".semi-tabs-bar")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const blockingViolations = results.violations.filter((violation) =>
    seriousOrCritical.includes(violation.impact),
  );

  expect(
    blockingViolations,
    blockingViolations
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${violation.nodes.length} nodes) ${violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(" "))
            .join("; ")}`,
      )
      .join("\n"),
  ).toHaveLength(0);
}

test.describe("accessibility smoke", () => {
  async function createBlankDiagram(page) {
    await page.goto("/editor");
    await page.getByRole("button", { name: "Create blank diagram" }).click();
    await expect(page.getByText("File").first()).toBeVisible();
  }

  test("landing page has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Draw, Copy, and Paste" }),
    ).toBeVisible();

    await expectNoSeriousAccessibilityViolations(page);
  });

  test("templates page has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/templates");
    await expect(page.getByText("Database schema templates")).toBeVisible();

    await expectNoSeriousAccessibilityViolations(page);
  });

  test("editor workspace has no serious or critical axe violations", async ({
    page,
  }) => {
    await createBlankDiagram(page);

    await expectNoSeriousAccessibilityViolations(page);
  });

  test("import dialog has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/editor");
    await page.getByRole("button", { name: "Import SQL, DBML, or JSON" }).click();
    await expect(
      page.getByRole("dialog", { name: "Import diagram" }),
    ).toBeVisible();

    await expectNoSeriousAccessibilityViolations(page);
  });

  test("share dialog has no serious or critical axe violations", async ({
    page,
  }) => {
    await createBlankDiagram(page);
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.getByRole("dialog", { name: "Share" })).toBeVisible();

    await expectNoSeriousAccessibilityViolations(page);
  });
});
