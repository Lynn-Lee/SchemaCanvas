import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

vi.mock("lottie-react", () => ({
  default: () => null,
}));

vi.mock("@douyinfe/semi-ui", () => ({
  Toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import useAreas from "./useAreas";
import useCanvas from "./useCanvas";
import useCollab from "./useCollab";
import useDiagram from "./useDiagram";
import useEnums from "./useEnums";
import useLayout from "./useLayout";
import useNotes from "./useNotes";
import useSaveState from "./useSaveState";
import useSelect from "./useSelect";
import useSettings from "./useSettings";
import useTransform from "./useTransform";
import useTypes from "./useTypes";
import useUndoRedo from "./useUndoRedo";

const hookCases = [
  ["useAreas", useAreas, "AreasContextProvider"],
  ["useCanvas", useCanvas, "CanvasContextProvider"],
  ["useCollab", useCollab, "CollabContextProvider"],
  ["useDiagram", useDiagram, "DiagramContextProvider"],
  ["useEnums", useEnums, "EnumsContextProvider"],
  ["useLayout", useLayout, "LayoutContextProvider"],
  ["useNotes", useNotes, "NotesContextProvider"],
  ["useSaveState", useSaveState, "SaveStateContextProvider"],
  ["useSelect", useSelect, "SelectContextProvider"],
  ["useSettings", useSettings, "SettingsContextProvider"],
  ["useTransform", useTransform, "TransformContextProvider"],
  ["useTypes", useTypes, "TypesContextProvider"],
  ["useUndoRedo", useUndoRedo, "UndoRedoContextProvider"],
];

describe("context hook null guards", () => {
  beforeEach(() => {
    useContext.mockReset();
  });

  it.each(hookCases)(
    "%s throws a clear error when used outside its provider",
    (hookName, hook, providerName) => {
      useContext.mockReturnValue(null);

      expect(() => hook()).toThrow(
        `${hookName} must be used within ${providerName}`,
      );
    },
  );

  it.each(hookCases)(
    "%s returns the provided context value",
    (_hookName, hook) => {
      const contextValue = { provided: true };
      useContext.mockReturnValue(contextValue);

      expect(hook()).toBe(contextValue);
    },
  );
});
