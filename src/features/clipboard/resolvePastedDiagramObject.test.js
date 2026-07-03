import { describe, expect, it } from "vitest";
import { resolvePastedDiagramObject } from "./resolvePastedDiagramObject";

describe("resolvePastedDiagramObject", () => {
  it("accepts clipboard objects that satisfy noteSchema", () => {
    expect(
      resolvePastedDiagramObject({
        id: 1,
        x: 20,
        y: 30,
        title: "Valid note",
        content: "body",
        color: "#ffffff",
        height: 160,
      }),
    ).toMatchObject({ type: "note" });
  });

  it("rejects clipboard objects that do not satisfy noteSchema", () => {
    expect(
      resolvePastedDiagramObject({
        id: 1,
        x: 20,
        y: 30,
        title: "Broken note",
        content: "missing required height and valid color",
        color: "not-a-color",
      }),
    ).toBeNull();
  });
});
