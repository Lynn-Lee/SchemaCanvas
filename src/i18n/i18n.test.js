import { describe, expect, test } from "vitest";

import i18n, { loadLanguageResources, resolveInitialLanguage } from "./i18n";

describe("i18n lazy resources", () => {
  test("defaults the product UI to Simplified Chinese", async () => {
    await loadLanguageResources("zh");

    expect(i18n.language).toBe("zh");
    expect(i18n.t("navbar_editor")).toBe("编辑器");
    expect(i18n.t("no_saved_diagrams")).toBe("暂无保存的图表");
    expect(i18n.t("no_changes")).toBe("已保存");
    expect(i18n.t("landing_rights_reserved")).toBe("保留所有权利。");
    expect(i18n.t("templates_fork_template", { title: "博客数据库 schema" })).toBe(
      "复用博客数据库 schema",
    );
  });

  test("loads language resources on demand", async () => {
    i18n.removeResourceBundle("zh", "translation");

    expect(i18n.hasResourceBundle("zh", "translation")).toBe(false);

    await loadLanguageResources("zh");

    expect(i18n.hasResourceBundle("zh", "translation")).toBe(true);
    expect(i18n.getFixedT("zh")("save")).toBe("保存");
  });

  test("migrates legacy English cache back to the Chinese default", () => {
    expect(resolveInitialLanguage("en", null)).toBe("zh");
    expect(resolveInitialLanguage("en", "1")).toBe("en");
    expect(resolveInitialLanguage("zh", null)).toBe("zh");
  });
});
