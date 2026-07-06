import { beforeAll, describe, expect, it } from "vitest";
import { loadLanguageResources } from "../../i18n/i18n";
import {
  IMPORT_LIMITS,
  validateDiagramImportObject,
  validateImportFile,
  validateImportText,
} from "./importLimits";

beforeAll(() => loadLanguageResources("zh"));

const createDiagram = (overrides = {}) => ({
  tables: [],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  enums: [],
  ...overrides,
});

describe("importLimits", () => {
  it("rejects files larger than the import file limit before parsing", () => {
    const result = validateImportFile({
      name: "large-schema.json",
      size: IMPORT_LIMITS.maxFileBytes + 1,
    });

    expect(result).toEqual({
      ok: false,
      message: "large-schema.json 超过 5 MB 导入限制。",
    });
  });

  it("rejects SQL and DBML text larger than their parser limit", () => {
    const sql = validateImportText("x".repeat(IMPORT_LIMITS.maxTextBytes + 1), {
      label: "SQL",
    });
    const dbml = validateImportText("x".repeat(IMPORT_LIMITS.maxTextBytes + 1), {
      label: "DBML",
    });

    expect(sql.ok).toBe(false);
    expect(sql.message).toBe("SQL 超过 2 MB 文本限制。");
    expect(dbml.ok).toBe(false);
    expect(dbml.message).toBe("DBML 超过 2 MB 文本限制。");
  });

  it("rejects diagram objects with too many tables, fields, or relationships", () => {
    const tooManyTables = createDiagram({
      tables: Array.from({ length: IMPORT_LIMITS.maxTables + 1 }, (_, id) => ({
        id,
        name: `table_${id}`,
        fields: [],
      })),
    });
    const tooManyFields = createDiagram({
      tables: [
        {
          id: "users",
          name: "users",
          fields: Array.from(
            { length: IMPORT_LIMITS.maxFields + 1 },
            (_, id) => ({ id, name: `field_${id}` }),
          ),
        },
      ],
    });
    const tooManyRelationships = createDiagram({
      relationships: Array.from(
        { length: IMPORT_LIMITS.maxRelationships + 1 },
        (_, id) => ({ id, name: `relationship_${id}` }),
      ),
    });

    expect(validateDiagramImportObject(tooManyTables)).toEqual({
      ok: false,
      message: "导入图表包含 501 张表，超过 500 张表限制。",
    });
    expect(validateDiagramImportObject(tooManyFields)).toEqual({
      ok: false,
      message: "导入图表包含 10001 个字段，超过 10000 个字段限制。",
    });
    expect(validateDiagramImportObject(tooManyRelationships)).toEqual({
      ok: false,
      message:
        "导入图表包含 5001 个关系，超过 5000 个关系限制。",
    });
  });

  it("rejects diagram objects with strings above the string length limit", () => {
    const result = validateDiagramImportObject(
      createDiagram({
        title: "x".repeat(IMPORT_LIMITS.maxStringLength + 1),
      }),
    );

    expect(result).toEqual({
      ok: false,
      message:
        "导入图表包含超过 10000 字符限制的字符串。",
    });
  });

  it("allows small import files, text, and diagram objects", () => {
    expect(validateImportFile({ name: "schema.sql", size: 1024 })).toEqual({
      ok: true,
    });
    expect(validateImportText("CREATE TABLE users (id int);", { label: "SQL" }))
      .toEqual({
        ok: true,
      });
    expect(
      validateDiagramImportObject(
        createDiagram({
          tables: [{ id: "users", name: "users", fields: [] }],
        }),
      ),
    ).toEqual({ ok: true });
  });
});
