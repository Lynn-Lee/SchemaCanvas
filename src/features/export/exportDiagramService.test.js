import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { describe, expect, test, vi } from "vitest";

import { Constraint, DB } from "../../data/constants";
import {
  exportCanvasImage,
  exportCanvasPdf,
  exportDiagram,
} from "./exportDiagramService";

const fixturesDir = path.join(cwd(), "src/test/fixtures/export");
const fixture = (name) => readFileSync(path.join(fixturesDir, name), "utf8");

const baseDiagram = {
  name: "Export service fixture",
  database: DB.MYSQL,
  tables: [
    {
      id: "users",
      name: "users",
      fields: [
        {
          id: "users_id",
          name: "id",
          type: "INT",
          primary: true,
          notNull: true,
          unique: false,
          increment: true,
          default: "",
          check: "",
          comment: "",
        },
        {
          id: "users_email",
          name: "email",
          type: "VARCHAR",
          size: "255",
          primary: false,
          notNull: true,
          unique: true,
          increment: false,
          default: "",
          check: "",
          comment: "",
        },
      ],
      indices: [],
      uniqueConstraints: [],
      color: "#175e7a",
    },
    {
      id: "posts",
      name: "posts",
      fields: [
        {
          id: "posts_id",
          name: "id",
          type: "INT",
          primary: true,
          notNull: true,
          unique: false,
          increment: true,
          default: "",
          check: "",
          comment: "",
        },
        {
          id: "posts_user_id",
          name: "user_id",
          type: "INT",
          primary: false,
          notNull: true,
          unique: false,
          increment: false,
          default: "",
          check: "",
          comment: "",
        },
      ],
      indices: [],
      uniqueConstraints: [],
      color: "#175e7a",
    },
  ],
  relationships: [
    {
      id: "fk_posts_users",
      name: "fk_posts_users",
      startTableId: "posts",
      startFieldId: "posts_user_id",
      endTableId: "users",
      endFieldId: "users_id",
      cardinality: "many_to_one",
      updateConstraint: Constraint.CASCADE,
      deleteConstraint: Constraint.CASCADE,
    },
  ],
  notes: [],
  areas: [],
  types: [],
  enums: [],
};

function diagramFor(database, overrides = {}) {
  return {
    ...baseDiagram,
    ...overrides,
    database,
  };
}

describe("exportDiagram", () => {
  test.each([
    ["mysql", DB.MYSQL, "mysql-basic.golden.sql"],
    ["postgresql", DB.POSTGRES, "postgres-basic.golden.sql"],
    ["sqlite", DB.SQLITE, "sqlite-basic.golden.sql"],
  ])("exports stable %s SQL", (_name, database, goldenFile) => {
    const result = exportDiagram({
      diagram: diagramFor(database),
      format: "sql",
    });

    expect(result).toEqual({
      ok: true,
      format: "sql",
      extension: "sql",
      content: fixture(goldenFile),
      issues: [],
    });
  });

  test("exports stable DBML", () => {
    const result = exportDiagram({
      diagram: diagramFor(DB.MYSQL),
      format: "dbml",
    });

    expect(result).toEqual({
      ok: true,
      format: "dbml",
      extension: "dbml",
      content: fixture("basic.golden.dbml"),
      issues: [],
    });
  });

  test.each([
    ["markdown", "md", "basic.golden.md"],
    ["mermaid", "md", "basic.golden.mermaid"],
  ])("exports stable %s documentation content", (format, extension, goldenFile) => {
    const result = exportDiagram({
      diagram: diagramFor(DB.MYSQL),
      format,
    });

    expect(result).toEqual({
      ok: true,
      format,
      extension,
      content: fixture(goldenFile),
      issues: [],
    });
  });
});

describe("exportCanvasImage", () => {
  test("exports PNG through an injected renderer", async () => {
    const element = document.createElement("div");
    const toPng = vi.fn().mockResolvedValue("data:image/png;base64,abc");

    const result = await exportCanvasImage({
      element,
      format: "png",
      renderers: { toPng },
      pixelRatio: 3,
    });

    expect(toPng).toHaveBeenCalledWith(element, { pixelRatio: 3 });
    expect(result).toEqual({
      ok: true,
      format: "png",
      extension: "png",
      content: "data:image/png;base64,abc",
      issues: [],
    });
  });

  test("returns a structured issue when canvas element is missing", async () => {
    const result = await exportCanvasImage({
      element: null,
      format: "png",
      renderers: { toPng: vi.fn() },
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].id).toBe("missing-export-canvas");
  });

  test("propagates renderer failures as structured issues", async () => {
    const result = await exportCanvasImage({
      element: document.createElement("div"),
      format: "jpeg",
      renderers: {
        toJpeg: vi.fn().mockRejectedValue(new Error("renderer exploded")),
      },
    });

    expect(result).toMatchObject({
      ok: false,
      format: "jpeg",
      extension: "jpeg",
      content: "",
      issues: [
        {
          id: "image-export-failed",
          severity: "error",
          objectType: "export",
          message: "renderer exploded",
        },
      ],
    });
  });
});

describe("exportCanvasPdf", () => {
  test("exports PDF through injected image and PDF adapters", async () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 640 });
    Object.defineProperty(element, "offsetHeight", { value: 480 });
    const addImage = vi.fn();
    const save = vi.fn();
    const PdfDocument = vi.fn(function () {
      return { addImage, save };
    });

    const result = await exportCanvasPdf({
      element,
      title: "Export service fixture",
      renderers: { toJpeg: vi.fn().mockResolvedValue("data:image/jpeg;base64,abc") },
      PdfDocument,
      now: () => new Date("2026-07-01T00:00:00.000Z"),
    });

    expect(PdfDocument).toHaveBeenCalledWith("l", "px", [640, 480]);
    expect(addImage).toHaveBeenCalledWith(
      "data:image/jpeg;base64,abc",
      "jpeg",
      0,
      0,
      640,
      480,
    );
    expect(save).toHaveBeenCalledWith(
      "Export service fixture_2026-07-01T00:00:00.000Z.pdf",
    );
    expect(result).toEqual({
      ok: true,
      format: "pdf",
      extension: "pdf",
      content: null,
      issues: [],
    });
  });

  test("propagates PDF adapter failures as structured issues", async () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "offsetWidth", { value: 640 });
    Object.defineProperty(element, "offsetHeight", { value: 480 });

    const result = await exportCanvasPdf({
      element,
      renderers: {
        toJpeg: vi.fn().mockRejectedValue(new Error("pdf render failed")),
      },
      PdfDocument: vi.fn(),
    });

    expect(result).toMatchObject({
      ok: false,
      format: "pdf",
      extension: "pdf",
      content: null,
      issues: [
        {
          id: "pdf-export-failed",
          severity: "error",
          objectType: "export",
          message: "pdf render failed",
        },
      ],
    });
  });
});
