import { describe, expect, it } from "vitest";

import { createDiagram, createTable } from "./diagramModel";
import { validateDiagramShape } from "./diagramSchema";

describe("validateDiagramShape", () => {
  it("accepts a normalized diagram", () => {
    const result = validateDiagramShape(
      createDiagram({
        diagramId: "local-1",
        name: "Local diagram",
        tables: [createTable({ id: "users", name: "users" })],
      }),
    );

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("rejects diagrams without a diagramId", () => {
    const result = validateDiagramShape({
      ...createDiagram({ diagramId: "local-1" }),
      diagramId: undefined,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "diagramId",
      message: "diagramId is required.",
    });
  });

  it("reports tables path when tables is not an array", () => {
    const result = validateDiagramShape({
      ...createDiagram({ diagramId: "local-1" }),
      tables: "users",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "tables",
      message: "tables must be an array.",
    });
  });
});
