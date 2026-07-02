import { lazy } from "react";

export const LazyMonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((module) => ({
    default: module.Editor,
  })),
);

export const LazyMonacoDiffEditor = lazy(() =>
  import("@monaco-editor/react").then((module) => ({
    default: module.DiffEditor,
  })),
);

export function MonacoLoadingFallback({ height = "100%" }) {
  return (
    <div
      className="flex items-center justify-center text-xs opacity-60 border border-dashed border-gray-300 rounded"
      style={{ height }}
      role="status"
      aria-live="polite"
    >
      Loading editor...
    </div>
  );
}
