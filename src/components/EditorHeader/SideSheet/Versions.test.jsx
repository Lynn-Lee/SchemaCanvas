import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IdContext } from "../../Workspace";
import Versions from "./Versions";
import { getVersion, getCommitsWithFile, VERSION_FILENAME } from "../../../api/gists";

const toastError = vi.hoisted(() => vi.fn());
const setters = vi.hoisted(() => ({
  setAreas: vi.fn(),
  setLayout: vi.fn(),
  setTables: vi.fn(),
  setRelationships: vi.fn(),
  setNotes: vi.fn(),
  setTypes: vi.fn(),
  setEnums: vi.fn(),
}));

vi.mock("@douyinfe/semi-ui", () => {
  function Steps({ children }) {
    return <div>{children}</div>;
  }

  function Step({ onClick, title, description }) {
    return (
      <button type="button" onClick={onClick}>
        {title}
        {description}
      </button>
    );
  }

  Steps.Step = Step;

  return {
    Button: function Button({ children, onClick, disabled }) {
      return (
        <button type="button" onClick={onClick} disabled={disabled}>
          {children}
        </button>
      );
    },
    Spin: function Spin() {
      return <span>loading</span>;
    },
    Steps,
    Tag: function Tag({ children }) {
      return <span>{children}</span>;
    },
    Toast: {
      error: toastError,
      info: vi.fn(),
    },
    Tooltip: function Tooltip({ children }) {
      return <>{children}</>;
    },
  };
});

vi.mock("../../Workspace", async () => {
  const { createContext } = await import("react");

  return {
    IdContext: createContext({
      gistId: "",
      setGistId: () => {},
      version: "",
      setVersion: () => {},
    }),
    default: function Workspace() {
      return null;
    },
  };
});

vi.mock("../../../api/gists", () => ({
  VERSION_FILENAME: "version.json",
  create: vi.fn(),
  get: vi.fn(),
  getCommitsWithFile: vi.fn(),
  getVersion: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("../../../hooks", () => ({
  useAreas: () => ({ areas: [], setAreas: setters.setAreas }),
  useDiagram: () => ({
    database: "postgresql",
    tables: [],
    relationships: [],
    setTables: setters.setTables,
    setRelationships: setters.setRelationships,
  }),
  useEnums: () => ({ enums: [], setEnums: setters.setEnums }),
  useLayout: () => ({ setLayout: setters.setLayout }),
  useNotes: () => ({ notes: [], setNotes: setters.setNotes }),
  useTransform: () => ({ transform: { pan: { x: 0, y: 0 }, zoom: 1 } }),
  useTypes: () => ({ types: [], setTypes: setters.setTypes }),
}));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("./Migration", () => ({
  default: function Migration() {
    return null;
  },
}));

describe("Versions", () => {
  it("rejects invalid version history payloads before mutating diagram state", async () => {
    const setVersion = vi.fn();
    const setTitle = vi.fn();
    getCommitsWithFile.mockResolvedValue({
      data: [{ version: "badsha123", committed_at: "2026-07-04T00:00:00Z" }],
      pagination: { hasMore: false, cursor: null },
    });
    getVersion.mockResolvedValue({
      data: {
        files: {
          [VERSION_FILENAME]: {
            content: JSON.stringify({
              title: "Bad version",
              database: "postgresql",
              tables: [
                {
                  id: "events",
                  name: "events",
                  fields: [
                    {
                      id: "event_id",
                      name: "id",
                      type: "INTEGER",
                      default: "not-an-integer",
                    },
                  ],
                },
              ],
              relationships: [],
              notes: [],
              subjectAreas: [],
            }),
          },
        },
      },
    });

    render(
      <IdContext.Provider
        value={{
          gistId: "gist-1",
          setGistId: vi.fn(),
          version: "",
          setVersion,
        }}
      >
        <Versions open title="Current" setTitle={setTitle} />
      </IdContext.Provider>,
    );

    fireEvent.click(await screen.findByText("badsha1"));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("failed_to_load_diagram"),
    );
    expect(setVersion).not.toHaveBeenCalled();
    expect(setters.setTables).not.toHaveBeenCalled();
    expect(setters.setRelationships).not.toHaveBeenCalled();
    expect(setters.setAreas).not.toHaveBeenCalled();
    expect(setTitle).not.toHaveBeenCalled();
  });
});
