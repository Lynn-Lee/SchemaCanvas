import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { saveAs } from "file-saver";
import { describe, expect, it, vi } from "vitest";

import { DB } from "../../data/constants";
import LocalDiagramList from "./LocalDiagramList";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

vi.mock("@douyinfe/semi-ui", () => ({
  Banner: function Banner({ description }) {
    return <div role="status">{description}</div>;
  },
  Button: function Button({ children, onClick, disabled, "aria-label": ariaLabel }) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  },
  Input: function Input({ value, onChange, placeholder }) {
    return (
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  },
  Spin: function Spin() {
    return <div>Loading</div>;
  },
  Toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) =>
      ({
        copy: "Copy",
        database: "Database",
        delete: "Delete",
        export: "Export",
        last_modified: "Last modified",
        no_saved_diagrams: "You have no saved diagrams",
        oops_smth_went_wrong: "Oops! Something went wrong.",
        relationships: "Relationships",
        search: "Search...",
        tables: "Tables",
        are_you_sure_delete_diagram:
          "Are you sure you want to delete this diagram? This operation is irreversible.",
      })[key] ?? key,
    i18n: { language: "en" },
  }),
}));

function createRepository() {
  const diagrams = [
    {
      diagramId: "orders",
      name: "Orders Service",
      database: DB.POSTGRES,
      tableCount: 3,
      relationshipCount: 2,
      lastModified: new Date("2026-07-01T10:15:00Z"),
    },
    {
      diagramId: "billing",
      name: "Billing",
      database: DB.MYSQL,
      tableCount: 1,
      relationshipCount: 0,
      lastModified: new Date("2026-07-02T08:30:00Z"),
    },
  ];

  return {
    listRecentDiagrams: vi.fn(async () => diagrams),
    duplicateDiagram: vi.fn(async () => ({ diagramId: "orders-copy" })),
    deleteDiagram: vi.fn(async () => 1),
    getDiagramById: vi.fn(async (diagramId) => ({
      diagramId,
      name: "Orders Service",
      database: DB.POSTGRES,
      tables: [],
      relationships: [],
    })),
  };
}

describe("LocalDiagramList", () => {
  it("shows local diagram metadata and supports search", async () => {
    render(
      <LocalDiagramList
        repository={createRepository()}
        selectedDiagramId="orders"
        setSelectedDiagramId={vi.fn()}
      />,
    );

    expect(await screen.findByText("Orders Service")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/7\/1\/2026/)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Search..."), "bill");

    expect(screen.queryByText("Orders Service")).not.toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("selects, duplicates, deletes with confirmation, and exports diagrams", async () => {
    const repository = createRepository();
    const setSelectedDiagramId = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <LocalDiagramList
        repository={repository}
        selectedDiagramId=""
        setSelectedDiagramId={setSelectedDiagramId}
      />,
    );

    const row = await screen.findByRole("row", { name: /Orders Service/ });
    await userEvent.click(row);
    expect(setSelectedDiagramId).toHaveBeenCalledWith("orders");

    await userEvent.click(within(row).getByRole("button", { name: "Copy Orders Service" }));
    expect(repository.duplicateDiagram).toHaveBeenCalledWith("orders");

    const refreshedRow = await screen.findByRole("row", {
      name: /Orders Service/,
    });
    await userEvent.click(
      within(refreshedRow).getByRole("button", { name: "Delete Orders Service" }),
    );
    expect(confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this diagram? This operation is irreversible.",
    );
    expect(repository.deleteDiagram).toHaveBeenCalledWith("orders");

    const rowAfterDelete = await screen.findByRole("row", {
      name: /Orders Service/,
    });
    await userEvent.click(
      within(rowAfterDelete).getByRole("button", { name: "Export Orders Service" }),
    );
    await waitFor(() => expect(repository.getDiagramById).toHaveBeenCalledWith("orders"));
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "Orders Service.json");

    confirm.mockRestore();
  });
});
