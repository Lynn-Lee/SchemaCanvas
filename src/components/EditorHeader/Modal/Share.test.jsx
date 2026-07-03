import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Share from "./Share";
import { IdContext } from "../../Workspace";
import { create, isSharingBackendConfigured } from "../../../api/gists";

vi.mock("@douyinfe/semi-icons", () => ({
  IconCode: function IconCode() {
    return null;
  },
  IconLink: function IconLink() {
    return null;
  },
}));

vi.mock("@douyinfe/semi-ui", () => {
  const Collapse = function Collapse({ children }) {
    return <div>{children}</div>;
  };
  Collapse.Panel = function CollapsePanel({ children, header }) {
    return (
    <div>
      {header}
      {children}
    </div>
    );
  };

  return {
    Banner: function Banner({ title, description }) {
      return (
        <div>
          {title && <div>{title}</div>}
          {description && <div>{description}</div>}
        </div>
      );
    },
    Button: function Button({ children, onClick }) {
      return (
        <button type="button" onClick={onClick}>
          {children}
        </button>
      );
    },
    Collapse,
    Input: function Input({ value }) {
      return <input readOnly value={value} />;
    },
    Radio: function Radio({ children }) {
      return <label>{children}</label>;
    },
    RadioGroup: function RadioGroup({ children }) {
      return <div>{children}</div>;
    },
    Space: function Space({ children }) {
      return <div>{children}</div>;
    },
    Spin: function Spin() {
      return <div>spin</div>;
    },
    Tag: function Tag({ children }) {
      return <span>{children}</span>;
    },
    Toast: {
      error: vi.fn(),
      success: vi.fn(),
  },
  Typography: {
    Text: function Text({ children }) {
      return <span>{children}</span>;
    },
  },
  };
});

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("../../../data/databases", () => ({
  databases: {
    generic: {
      hasEnums: false,
      hasTypes: false,
    },
  },
}));

vi.mock("../../Workspace", async () => {
  const React = await import("react");
  return {
    IdContext: React.createContext({ gistId: "", setGistId: vi.fn() }),
  };
});

vi.mock("../../../context/ExtensionsContext", () => ({
  Slot: () => null,
  useExtensions: () => ({}),
}));

vi.mock("../../../hooks", () => ({
  useAreas: () => ({ areas: [] }),
  useDiagram: () => ({
    tables: [],
    relationships: [],
    database: "generic",
  }),
  useEnums: () => ({ enums: [] }),
  useNotes: () => ({ notes: [] }),
  useTransform: () => ({ transform: { x: 0, y: 0, zoom: 1 } }),
  useTypes: () => ({ types: [] }),
}));

vi.mock("../../../api/gists", () => ({
  SHARE_FILENAME: "share.json",
  SHARE_BACKEND_NOT_CONFIGURED: "SHARE_BACKEND_NOT_CONFIGURED",
  create: vi.fn(),
  isApiError: (result) => result?.ok === false,
  isSharingBackendConfigured: vi.fn(),
  patch: vi.fn(),
}));

describe("Share modal", () => {
  beforeEach(() => {
    create.mockReset();
    isSharingBackendConfigured.mockReturnValue(true);
  });

  it("requires confirmation before creating the first share link", async () => {
    create.mockResolvedValue("share-123");
    const setGistId = vi.fn();

    render(
      <IdContext.Provider value={{ gistId: "", setGistId }}>
        <Share title="Local diagram" setModal={vi.fn()} />
      </IdContext.Provider>,
    );

    expect(
      screen.getByText("share_data_disclosure_title"),
    ).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "confirm_share_upload" }),
    );

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(setGistId).toHaveBeenCalledWith("share-123");
  });

  it("shows a configuration message before confirmation when sharing backend is missing", () => {
    isSharingBackendConfigured.mockReturnValue(false);

    render(
      <IdContext.Provider value={{ gistId: "", setGistId: vi.fn() }}>
        <Share title="Local diagram" setModal={vi.fn()} />
      </IdContext.Provider>,
    );

    expect(screen.getByText("share_backend_not_configured")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "confirm_share_upload" }),
    ).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
