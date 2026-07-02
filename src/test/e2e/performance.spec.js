import { expect, test } from "@playwright/test";

import { createPerformanceDiagram } from "../fixtures/performance/performanceDiagrams";
import { seedLocalDiagram } from "./support/localDiagramSeed";

test.describe("performance smoke", () => {
  test("opens a 500 table diagram and searches for a target table", async ({
    page,
  }) => {
    const diagram = createPerformanceDiagram(500);
    await seedLocalDiagram(page, diagram);

    await page.goto(`/editor/diagrams/${diagram.diagramId}`);

    await expect(page.getByText("Tables (500)")).toBeVisible();
    await expect(
      page.locator("#scroll_table_perf-500-table-001"),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "TreeSelect" }).click();
    await page
      .getByRole("textbox", { name: "Filter TreeSelect item" })
      .fill("perf_500_table_475");
    await page.getByRole("tree").getByText("perf_500_table_475").click();

    const targetTable = page.locator("#scroll_table_perf-500-table-475");
    await expect(targetTable).toBeVisible();
    await expect
      .poll(async () =>
        targetTable.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        }),
      )
      .toBe(true);
  });
});
