import JSZip from "jszip";
import { beforeEach, describe, expect, test, vi } from "vitest";

const savedFiles = [];
const store = {
  diagrams: [],
  templates: [],
};

vi.mock("file-saver", () => ({
  saveAs: vi.fn((content, fileName) => {
    savedFiles.push({ content, fileName });
  }),
}));

vi.mock("../data/db", () => ({
  db: {
    diagrams: {
      each: async (callback) => {
        for (const diagram of store.diagrams) {
          await callback(diagram);
        }
      },
    },
    templates: {
      where: () => ({
        each: async (callback) => {
          for (const template of store.templates) {
            await callback(template);
          }
        },
      }),
    },
  },
}));

const { exportSavedData } = await import("./exportSavedData");

const diagram = (overrides) => ({
  id: "diagram-1",
  name: "Customer/Orders: Q3?",
  references: [],
  areas: [],
  tables: [],
  notes: [],
  ...overrides,
});

const template = (overrides) => ({
  id: "template-1",
  title: "Billing*Template",
  references: [],
  areas: [],
  tables: [],
  notes: [],
  custom: 1,
  ...overrides,
});

async function zipEntries(blob) {
  const zip = await JSZip.loadAsync(blob);
  return Object.keys(zip.files).filter((name) => !zip.files[name].dir).sort();
}

describe("exportSavedData", () => {
  beforeEach(() => {
    savedFiles.length = 0;
    store.diagrams = [];
    store.templates = [];
  });

  test("creates an isolated zip for each export", async () => {
    store.diagrams = [diagram({ id: "first", name: "First diagram" })];
    store.templates = [];

    await exportSavedData({ now: () => new Date("2026-07-01T22:00:01.000Z") });

    store.diagrams = [diagram({ id: "second", name: "Second diagram" })];

    await exportSavedData({ now: () => new Date("2026-07-01T22:00:02.000Z") });

    expect(savedFiles).toHaveLength(2);
    await expect(zipEntries(savedFiles[0].content)).resolves.toEqual([
      "diagrams/First_diagram_first.json",
    ]);
    await expect(zipEntries(savedFiles[1].content)).resolves.toEqual([
      "diagrams/Second_diagram_second.json",
    ]);
  });

  test("sanitizes entry filenames and uses an ISO-safe zip filename", async () => {
    store.diagrams = [diagram()];
    store.templates = [template()];

    await exportSavedData({ now: () => new Date("2026-07-01T22:00:01.000Z") });

    expect(savedFiles[0].fileName).toBe("drawdb-backup-2026-07-01T22-00-01.zip");
    await expect(zipEntries(savedFiles[0].content)).resolves.toEqual([
      "diagrams/Customer_Orders_Q3_diagram-1.json",
      "templates/Billing_Template_template-1.json",
    ]);
  });
});
