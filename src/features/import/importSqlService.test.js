import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { describe, expect, test } from "vitest";
import { DB } from "../../data/constants";
import { IMPORT_LIMITS } from "./importLimits";
import { importSqlText } from "./importSqlService";

const fixturesDir = path.join(cwd(), "src/test/fixtures/sql");
const fixture = (name) => readFileSync(path.join(fixturesDir, name), "utf8");

describe("importSqlText", () => {
  test("imports valid SQL into a normalized diagram preview", () => {
    const result = importSqlText({
      sql: fixture("mysql-basic.sql"),
      dialect: DB.MYSQL,
      diagramDatabase: DB.MYSQL,
    });

    expect(result.ok).toBe(true);
    expect(result.diagram?.database).toBe(DB.MYSQL);
    expect(result.diagram?.tables.map((table) => table.name)).toEqual([
      "users",
      "posts",
    ]);
    expect(result.diagram?.relationships).toHaveLength(1);
    expect(result.preview).toEqual({
      tableCount: 2,
      relationshipCount: 1,
      typeCount: 0,
      enumCount: 0,
      warningCount: 0,
      errorCount: 0,
    });
    expect(result.issues).toEqual([]);
  });

  test("rejects empty SQL without returning a diagram", () => {
    const result = importSqlText({
      sql: "   ",
      dialect: DB.MYSQL,
      diagramDatabase: DB.MYSQL,
    });

    expect(result.ok).toBe(false);
    expect(result.diagram).toBeNull();
    expect(result.preview).toBeNull();
    expect(result.issues[0]).toMatchObject({
      id: "empty-sql",
      severity: "error",
      objectType: "source",
    });
  });

  test("rejects SQL text above the import text limit", () => {
    const result = importSqlText({
      sql: "x".repeat(IMPORT_LIMITS.maxTextBytes + 1),
      dialect: DB.MYSQL,
      diagramDatabase: DB.MYSQL,
    });

    expect(result.ok).toBe(false);
    expect(result.diagram).toBeNull();
    expect(result.issues[0]).toMatchObject({
      id: "sql-import-limit",
      severity: "error",
      objectType: "source",
    });
  });

  test("returns a parser error issue for invalid SQL", () => {
    const result = importSqlText({
      sql: "CREATE TABLE",
      dialect: DB.MYSQL,
      diagramDatabase: DB.MYSQL,
    });

    expect(result.ok).toBe(false);
    expect(result.diagram).toBeNull();
    expect(result.issues[0]).toMatchObject({
      id: "invalid-sql",
      severity: "error",
      objectType: "source",
    });
  });

  test("keeps importable tables and warns for unsupported statements", () => {
    const result = importSqlText({
      sql: `${fixture("mysql-basic.sql")}\nCREATE VIEW active_users AS SELECT id FROM users;`,
      dialect: DB.MYSQL,
      diagramDatabase: DB.MYSQL,
    });

    expect(result.ok).toBe(true);
    expect(result.diagram?.tables).toHaveLength(2);
    expect(result.preview?.warningCount).toBe(1);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "unsupported-sql-statement:create",
        severity: "warning",
        objectType: "source",
      }),
    );
  });
});
