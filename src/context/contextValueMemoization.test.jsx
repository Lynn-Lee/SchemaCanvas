/* global process */
import { memo, useContext, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import UndoRedoContextProvider, { UndoRedoContext } from "./UndoRedoContext";
import SelectContextProvider, { SelectContext } from "./SelectContext";
import TransformContextProvider, { TransformContext } from "./TransformContext";
import SaveStateContextProvider, { SaveStateContext } from "./SaveStateContext";
import LayoutContextProvider, { LayoutContext } from "./LayoutContext";
import SettingsContextProvider, { SettingsContext } from "./SettingsContext";

const providerFiles = [
  "UndoRedoContext.jsx",
  "SelectContext.jsx",
  "TransformContext.jsx",
  "SaveStateContext.jsx",
  "LayoutContext.jsx",
  "SettingsContext.jsx",
  "AreasContext.jsx",
  "NotesContext.jsx",
  "TypesContext.jsx",
  "EnumsContext.jsx",
];
const providerCases = [
  {
    name: "UndoRedoContextProvider",
    Provider: UndoRedoContextProvider,
    Context: UndoRedoContext,
  },
  {
    name: "SelectContextProvider",
    Provider: SelectContextProvider,
    Context: SelectContext,
  },
  {
    name: "TransformContextProvider",
    Provider: TransformContextProvider,
    Context: TransformContext,
  },
  {
    name: "SaveStateContextProvider",
    Provider: SaveStateContextProvider,
    Context: SaveStateContext,
  },
  {
    name: "LayoutContextProvider",
    Provider: LayoutContextProvider,
    Context: LayoutContext,
    wrapper: MemoryRouter,
  },
  {
    name: "SettingsContextProvider",
    Provider: SettingsContextProvider,
    Context: SettingsContext,
    wrapper: MemoryRouter,
  },
];

function ContextRenderHarness({ Provider, Context, wrapper: Wrapper }) {
  const [tick, setTick] = useState(0);
  const renderCount = vi.fn();

  const Consumer = memo(function Consumer() {
    useContext(Context);
    renderCount();
    return <span data-testid="renders">{renderCount.mock.calls.length}</span>;
  });

  const content = (
    <>
      <button onClick={() => setTick((value) => value + 1)}>rerender</button>
      <span data-testid="tick">{tick}</span>
      <Provider>
        <Consumer />
      </Provider>
    </>
  );

  return Wrapper ? <Wrapper>{content}</Wrapper> : content;
}

describe("Context provider value memoization", () => {
  beforeEach(() => {
    const storage = new Map();

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key) => storage.get(key) ?? null),
      setItem: vi.fn((key, value) => {
        storage.set(key, String(value));
      }),
      removeItem: vi.fn((key) => {
        storage.delete(key);
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(providerCases)(
    "$name keeps consumer renders stable when only the parent rerenders",
    ({ Provider, Context, wrapper }) => {
      render(
        <ContextRenderHarness
          Provider={Provider}
          Context={Context}
          wrapper={wrapper}
        />,
      );

      expect(screen.getByTestId("renders")).toHaveTextContent("1");

      fireEvent.click(screen.getByText("rerender"));

      expect(screen.getByTestId("tick")).toHaveTextContent("1");
      expect(screen.getByTestId("renders")).toHaveTextContent("1");
    },
  );

  it("keeps the target context provider values behind named memoized values", () => {
    for (const file of providerFiles) {
      const source = readFileSync(join(process.cwd(), "src/context", file), {
        encoding: "utf8",
      });

      expect(source).toContain("useMemo");
      expect(source).not.toMatch(/Provider\s+value=\{\{/);
    }
  });
});
