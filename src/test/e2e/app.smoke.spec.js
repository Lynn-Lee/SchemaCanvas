import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("landing page renders the product entry point", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "绘制、复制、粘贴" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "编辑器" }).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");
    await expect(page).toHaveTitle(/在线数据库图表编辑器与 SQL 生成器/);
  });

  test("landing page fits a 390px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "绘制、复制、粘贴" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "立即试用" }),
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

  test("landing page does not render third-party endorsement sections", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "绘制、复制、粘贴" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "立即试用" }),
    ).toBeVisible();
    await expect(page.locator('[data-testid^="landing-social"]')).toHaveCount(0);
  });

  test("landing page omits contact and legacy language marketing blocks", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("联系我们")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "查看源码" })).toHaveCount(0);
    await expect(page.getByText("语言")).toHaveCount(0);
    await expect(page.getByText(/保留所有权利/)).toBeVisible();
    await expect(page.getByText(/All rights reserved/)).toHaveCount(0);
  });

  test("templates page renders the template library", async ({ page }) => {
    await page.goto("/templates");

    await expect(page.getByText("模板").first()).toBeVisible();
    await expect(page.getByText("数据库 schema 模板")).toBeVisible();
    await expect(page.getByText("博客数据库 schema")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "复用博客数据库 schema" }),
    ).toBeVisible();
    await expect(page.getByText("Blog database schema")).toHaveCount(0);
  });

  test("editor route renders without requiring an account", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/editor");

    await expect(page).toHaveTitle(/编辑器 \| SchemaCanvas/);
    await expect(
      page.getByRole("heading", { name: "创建本地图表" }),
    ).toBeVisible();
    await expect(page.getByText("没有更改")).toHaveCount(0);
    await page.getByRole("button", { name: "创建空白图表" }).click();
    await expect(page.getByText("文件").first()).toBeVisible();
    await expect(page.getByText("未命名图表")).toBeVisible();
    await expect(page.getByText("Untitled Diagram")).toHaveCount(0);
    await expect(page.getByText("小屏编辑模式")).toBeHidden();
  });

  test("cloud diagram load failure falls back to local editor mode", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/editor?cloudDiagramId=missing-cloud-diagram");

    await expect(
      page.getByRole("heading", { name: "创建本地图表" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "创建空白图表" }).click();
    await expect(page.getByText("文件").first()).toBeVisible();
  });

  test("editor shows a mobile experience hint on small screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/editor");
    await page.getByRole("button", { name: "创建空白图表" }).click();

    await expect(page.getByText("小屏编辑模式")).toBeVisible();
    await expect(
      page.getByText("完整画布编辑建议使用平板或桌面设备。"),
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
    await page.getByRole("button", { name: "创建空白图表" }).click();

    await expect(page.getByRole("button", { name: "缩小" })).toBeVisible();
    await expect(page.getByRole("button", { name: "放大" })).toBeVisible();
    await expect(page.getByRole("button", { name: "撤销" })).toBeVisible();
    await expect(page.getByRole("button", { name: "恢复" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "添加表", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "添加区域", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "添加注释", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "版本列表" })).toBeVisible();
    await expect(page.getByRole("button", { name: "主题" })).toBeVisible();

    const shareButton = page.getByRole("button", { name: "分享" });
    await shareButton.click();
    await expect(page.getByRole("dialog", { name: "分享" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "分享" })).toBeHidden();
    await expect(shareButton).toBeFocused();
  });
});
