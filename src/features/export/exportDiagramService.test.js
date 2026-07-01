import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { describe, expect, test } from "vitest";

import { Constraint, DB } from "../../data/constants";
import { exportDiagram } from "./exportDiagramService";

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
});
