import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { shouldIgnoreEditorHotkey, useEditorHotkeys } from "./useEditorHotkeys";

const useHotkeysMock = vi.fn();

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: (...args) => useHotkeysMock(...args),
}));

function createActions() {
  return {
    fileImport: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    save: vi.fn(),
    open: vi.fn(),
    edit: vi.fn(),
    duplicate: vi.fn(),
    copy: vi.fn(),
    paste: vi.fn(),
    cut: vi.fn(),
    del: vi.fn(),
    viewGrid: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    viewStrictMode: vi.fn(),
    viewFieldSummary: vi.fn(),
    saveDiagramAs: vi.fn(),
    copyAsImage: vi.fn(),
    resetView: vi.fn(),
    fitWindow: vi.fn(),
    toggleDBMLEditor: vi.fn(),
  };
}

describe("useEditorHotkeys", () => {
  it("registers editor shortcuts through a single hook entrypoint", () => {
    const actions = createActions();

    renderHook(() => useEditorHotkeys(actions));

    expect(useHotkeysMock).toHaveBeenCalledWith(
      "mod+s",
      expect.any(Function),
      expect.objectContaining({ preventDefault: true }),
    );
    expect(useHotkeysMock).toHaveBeenCalledWith(
      "mod+shift+s",
      expect.any(Function),
      expect.objectContaining({ preventDefault: true }),
    );
    expect(useHotkeysMock).toHaveBeenCalledWith(
      "alt+e",
      expect.any(Function),
      expect.objectContaining({ preventDefault: true }),
    );
  });

  it("does not fire global editor actions from text inputs or editors", () => {
    const actions = createActions();

    renderHook(() => useEditorHotkeys(actions));

    const saveHandler = useHotkeysMock.mock.calls.find(
      ([keys]) => keys === "mod+s",
    )[1];
    saveHandler({
      target: document.createElement("input"),
    });

    const monacoTarget = document.createElement("div");
    monacoTarget.className = "monaco-editor";
    saveHandler({ target: monacoTarget });

    expect(actions.save).not.toHaveBeenCalled();
  });

  it("detects editable hotkey targets", () => {
    const textarea = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const lexical = document.createElement("div");
    lexical.setAttribute("data-lexical-editor", "true");

    expect(shouldIgnoreEditorHotkey({ target: textarea })).toBe(true);
    expect(shouldIgnoreEditorHotkey({ target: editable })).toBe(true);
    expect(shouldIgnoreEditorHotkey({ target: lexical })).toBe(true);
    expect(shouldIgnoreEditorHotkey({ target: document.body })).toBe(false);
  });
});
