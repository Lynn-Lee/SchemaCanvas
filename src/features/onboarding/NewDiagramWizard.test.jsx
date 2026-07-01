import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DB } from "../../data/constants";
import NewDiagramWizard from "./NewDiagramWizard";

vi.mock("@douyinfe/semi-ui", () => ({
  Button: function Button({ children, onClick }) {
    return (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    );
  },
  Tag: function Tag({ children }) {
    return <span>{children}</span>;
  },
}));

describe("NewDiagramWizard", () => {
  it("shows local-first onboarding choices for a new editor user", () => {
    render(
      <NewDiagramWizard
        onCreateBlank={vi.fn()}
        onOpenTemplates={vi.fn()}
        onOpenImport={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Create a local diagram" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Saved by default in this browser only."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create blank diagram" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start from template" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Import SQL, DBML, or JSON" }),
    ).toBeInTheDocument();
  });

  it("creates a blank diagram with the selected database", async () => {
    const onCreateBlank = vi.fn();

    render(
      <NewDiagramWizard
        onCreateBlank={onCreateBlank}
        onOpenTemplates={vi.fn()}
        onOpenImport={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "PostgreSQL" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Create blank diagram" }),
    );

    expect(onCreateBlank).toHaveBeenCalledWith(DB.POSTGRES);
  });

  it("opens templates and import paths from the wizard", async () => {
    const onOpenTemplates = vi.fn();
    const onOpenImport = vi.fn();

    render(
      <NewDiagramWizard
        onCreateBlank={vi.fn()}
        onOpenTemplates={onOpenTemplates}
        onOpenImport={onOpenImport}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Start from template" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Import SQL, DBML, or JSON" }),
    );

    expect(onOpenTemplates).toHaveBeenCalledTimes(1);
    expect(onOpenImport).toHaveBeenCalledTimes(1);
  });
});
