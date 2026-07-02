import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CloudDiagrams from "./CloudDiagrams";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

function createRepository({ diagrams, teams } = {}) {
  return {
    listCloudDiagrams: vi.fn().mockResolvedValue({
      ok: true,
      diagrams: diagrams ?? [],
    }),
    listTeams: vi.fn().mockResolvedValue({
      ok: true,
      teams: teams ?? [],
    }),
  };
}

function renderCloudDiagrams(props) {
  return render(
    <MemoryRouter>
      <CloudDiagrams {...props} />
    </MemoryRouter>,
  );
}

describe("CloudDiagrams", () => {
  it("explains unavailable cloud when no backend is configured", async () => {
    renderCloudDiagrams();

    expect(
      await screen.findByRole("heading", { name: "cloud_diagrams_unavailable" }),
    ).toBeInTheDocument();
    expect(screen.getByText("cloud_diagrams_local_mode_available"));
  });

  it("shows an empty state for configured cloud with no diagrams", async () => {
    renderCloudDiagrams({ repository: createRepository() });

    expect(
      await screen.findByRole("heading", { name: "cloud_diagrams_empty" }),
    ).toBeInTheDocument();
    expect(screen.getByText("cloud_diagrams_empty_description"));
  });

  it("shows mine diagrams with permission and modified timestamp", async () => {
    const repository = createRepository({
      diagrams: [
        {
          id: "cloud-1",
          name: "Billing schema",
          database: "PostgreSQL",
          tableCount: 8,
          permission: "owner",
          teamId: null,
          modifiedAt: "2026-07-02T08:30:00.000Z",
        },
      ],
    });

    renderCloudDiagrams({ repository });

    expect(await screen.findByText("Billing schema")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL"));
    expect(screen.getByText("8 tables"));
    expect(screen.getByText("owner"));
    expect(screen.getByText("2026-07-02 08:30"));
    expect(
      screen.getByRole("link", { name: "cloud_diagrams_open_cloud_diagram" }),
    ).toHaveAttribute("href", "/editor?cloudDiagramId=cloud-1");
  });

  it("filters diagrams by teams returned from the repository", async () => {
    const repository = createRepository({
      teams: [
        { id: "team-1", name: "Platform" },
        { id: "team-2", name: "Analytics" },
      ],
      diagrams: [
        {
          id: "cloud-1",
          name: "Platform schema",
          permission: "editor",
          teamId: "team-1",
          modifiedAt: "2026-07-02T08:30:00.000Z",
        },
        {
          id: "cloud-2",
          name: "Analytics schema",
          permission: "viewer",
          teamId: "team-2",
          modifiedAt: "2026-07-02T09:15:00.000Z",
        },
      ],
    });

    renderCloudDiagrams({ repository });

    expect(await screen.findByText("Platform schema")).toBeInTheDocument();
    expect(screen.getByText("Analytics schema")).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText("cloud_diagrams_team_filter"),
      "team:team-2",
    );

    await waitFor(() => {
      expect(screen.queryByText("Platform schema")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Analytics schema")).toBeInTheDocument();
  });
});
