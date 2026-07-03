import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { describe, expect, test } from "vitest";
import { Parser } from "node-sql-parser";
import { Parser as OracleParser } from "oracle-sql-parser";
import { DB } from "../../data/constants";
import { importSQL } from ".";
import { fromPostgres } from "./postgres";

const fixturesDir = path.join(cwd(), "src/test/fixtures/sql");
const fixturePath = (name) => path.join(fixturesDir, name);

const dialects = [
  ["MySQL", DB.MYSQL, "mysql-basic.sql"],
  ["PostgreSQL", DB.POSTGRES, "postgres-basic.sql"],
  ["SQLite", DB.SQLITE, "sqlite-basic.sql"],
  ["MariaDB", DB.MARIADB, "mariadb-basic.sql"],
  ["MSSQL", DB.MSSQL, "mssql-basic.sql"],
  ["Oracle", DB.ORACLESQL, "oracle-basic.sql"],
];

function parseSql(sql, db) {
  if (db === DB.ORACLESQL) {
    return new OracleParser().parse(sql);
  }

  if (db === DB.MSSQL) {
    return parseMssqlFixture(sql);
  }

  return new Parser().astify(sql, { database: db });
}

function parseMssqlFixture(sql) {
  const parser = new Parser();
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => {
      if (/^ALTER\s+TABLE/i.test(statement)) {
        return parseMssqlForeignKeyAlter(statement);
      }
      return parser.astify(statement, { database: DB.MSSQL });
    });
}

function parseMssqlForeignKeyAlter(statement) {
  const match = statement.match(
    /^ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s+\((\w+)\)\s+REFERENCES\s+(\w+)\s+\((\w+)\)$/i,
  );
  if (!match) {
    throw new Error(`Unsupported MSSQL fixture statement: ${statement}`);
  }
  const [, startTable, startField, endTable, endField] = match;

  return {
    type: "alter",
    table: [{ table: startTable }],
    expr: [
      {
        action: "add",
        create_definitions: {
          constraint_type: "foreign key",
          definition: [{ column: startField }],
          reference_definition: {
            table: [{ table: endTable }],
            definition: [{ column: endField }],
            on_action: [],
          },
        },
      },
    ],
  };
}

function findTable(diagram, name) {
  return diagram.tables.find((table) => table.name.toLowerCase() === name);
}

function postgresEnumAst(name, values = ["active", "archived"]) {
  return {
    type: "create",
    keyword: "type",
    resource: "enum",
    name: { name },
    create_definitions: {
      value: values.map((value) => ({ value })),
    },
  };
}

function postgresCompositeTypeAst(name) {
  return {
    type: "create",
    keyword: "type",
    name: { name },
    create_definitions: [
      {
        resource: "column",
        column: { column: { expr: { value: "line1" } } },
        definition: { dataType: "TEXT" },
      },
    ],
  };
}

function postgresTableAst(columnType) {
  return {
    type: "create",
    keyword: "table",
    table: [{ table: "accounts" }],
    create_definitions: [
      {
        resource: "column",
        column: { column: { expr: { value: "status" } } },
        definition: { dataType: columnType },
      },
    ],
  };
}

describe("importSQL fixtures", () => {
  for (const [name, db, fixture] of dialects) {
    test(`${name} basic SQL imports tables, primary key, and relationship`, () => {
      const sql = readFileSync(fixturePath(fixture), "utf8");
      const ast = parseSql(sql, db);

      const diagram = importSQL(ast, db, db);
      const users = findTable(diagram, "users");
      const posts = findTable(diagram, "posts");

      expect(diagram.tables).toHaveLength(2);
      expect(users?.fields.some((field) => field.name === "id")).toBe(true);
      expect(users?.fields.find((field) => field.name === "id")?.primary).toBe(
        true,
      );
      expect(posts?.fields.some((field) => field.name === "user_id")).toBe(
        true,
      );
      expect(diagram.relationships).toHaveLength(1);
      expect(diagram.relationships[0]).toMatchObject({
        startTableId: posts?.id,
        endTableId: users?.id,
      });
    });
  }
});

describe("PostgreSQL custom type matching", () => {
  test("matches composite type names with regex metacharacters literally", () => {
    const diagram = fromPostgres(
      [postgresCompositeTypeAst("(a+)+b"), postgresTableAst('"(a+)+b"')],
      DB.POSTGRES,
    );

    expect(findTable(diagram, "accounts")?.fields[0].type).toBe("(a+)+b");
  });

  test("treats regex metacharacters in enum names as literal text", () => {
    const diagram = fromPostgres(
      [postgresEnumAst(".*"), postgresTableAst("INTEGER")],
      DB.POSTGRES,
    );

    expect(findTable(diagram, "accounts")?.fields[0].type).toBe("INTEGER");
  });

  test("does not throw when enum names contain invalid regex syntax", () => {
    expect(() =>
      fromPostgres(
        [postgresEnumAst("status["), postgresTableAst("status[")],
        DB.POSTGRES,
      ),
    ).not.toThrow();
  });
});
