import { describe, expect, it } from "vitest";

import { DB } from "../../data/constants";
import { validateSharedDiagramContent } from "./validateSharedDiagram";

const validDiagram = (overrides = {}) => ({
  title: "Shared billing",
  database: DB.POSTGRES,
  tables: [
    {
      id: "accounts",
      name: "accounts",
      fields: [
        {
          id: "account_id",
          name: "id",
          type: "INTEGER",
          default: "",
          primary: true,
          notNull: true,
        },
      ],
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  transform: { pan: { x: 0, y: 0 }, zoom: 1 },
  ...overrides,
});

describe("validateSharedDiagramContent", () => {
  it("rejects shared diagrams above the import table limit", () => {
    const tables = Array.from({ length: 501 }, (_, index) => ({
      id: `table-${index}`,
      name: `table_${index}`,
      fields: [],
    }));

    const result = validateSharedDiagramContent(
      JSON.stringify(validDiagram({ tables })),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "import-limit",
    });
  });

  it("rejects shared diagrams with invalid field defaults", () => {
    const result = validateSharedDiagramContent(
      JSON.stringify(
        validDiagram({
          tables: [
            {
              id: "events",
              name: "events",
              fields: [
                {
                  id: "event_id",
                  name: "id",
                  type: "INTEGER",
                  default: "abc",
                  primary: true,
                  notNull: true,
                },
              ],
            },
          ],
        }),
      ),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "diagram-validation",
    });
    expect(result.issues).toEqual([
      expect.objectContaining({ id: "invalid-default:event_id" }),
    ]);
  });

  it("returns normalized data for valid shared diagrams", () => {
    const result = validateSharedDiagramContent(JSON.stringify(validDiagram()));

    expect(result).toMatchObject({
      ok: true,
      diagram: expect.objectContaining({
        database: DB.POSTGRES,
        name: "Shared billing",
        tables: [
          expect.objectContaining({
            id: "accounts",
            name: "accounts",
          }),
        ],
        areas: [],
      }),
    });
  });
});
