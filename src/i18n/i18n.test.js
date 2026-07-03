import { describe, expect, test } from "vitest";

import i18n, { loadLanguageResources } from "./i18n";

describe("i18n lazy resources", () => {
  test("loads non-default language resources on demand", async () => {
    i18n.removeResourceBundle("zh", "translation");

    expect(i18n.hasResourceBundle("zh", "translation")).toBe(false);

    await loadLanguageResources("zh");

    expect(i18n.hasResourceBundle("zh", "translation")).toBe(true);
    expect(i18n.getFixedT("zh")("save")).toBe("保存");
  });
});
