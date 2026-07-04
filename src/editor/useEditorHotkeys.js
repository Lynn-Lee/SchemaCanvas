import { useHotkeys } from "react-hotkeys-hook";

export function shouldIgnoreEditorHotkey(event) {
  const target = event?.target;
  if (!(target instanceof Element)) return false;

  const tagName = target.tagName?.toLowerCase();
  if (["input", "textarea", "select"].includes(tagName)) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  if (target.closest("[data-lexical-editor]")) return true;
  if (target.closest(".monaco-editor")) return true;

  return false;
}

function runEditorHotkey(event, action) {
  if (shouldIgnoreEditorHotkey(event)) return;
  action?.(event);
}

export function useEditorHotkeys(actions) {
  useHotkeys(
    "mod+i",
    (event) => runEditorHotkey(event, actions.fileImport),
    { preventDefault: true },
  );
  useHotkeys("mod+z", (event) => runEditorHotkey(event, actions.undo), {
    preventDefault: true,
  });
  useHotkeys("mod+y", (event) => runEditorHotkey(event, actions.redo), {
    preventDefault: true,
  });
  useHotkeys("mod+s", (event) => runEditorHotkey(event, actions.save), {
    preventDefault: true,
  });
  useHotkeys("mod+o", (event) => runEditorHotkey(event, actions.open), {
    preventDefault: true,
  });
  useHotkeys("mod+e", (event) => runEditorHotkey(event, actions.edit), {
    preventDefault: true,
  });
  useHotkeys("mod+d", (event) => runEditorHotkey(event, actions.duplicate), {
    preventDefault: true,
  });
  useHotkeys("mod+c", (event) => runEditorHotkey(event, actions.copy), {
    preventDefault: true,
  });
  useHotkeys("mod+v", (event) => runEditorHotkey(event, actions.paste), {
    preventDefault: true,
  });
  useHotkeys("mod+x", (event) => runEditorHotkey(event, actions.cut), {
    preventDefault: true,
  });
  useHotkeys("delete", (event) => runEditorHotkey(event, actions.del), {
    preventDefault: true,
  });
  useHotkeys("mod+shift+g", (event) => runEditorHotkey(event, actions.viewGrid), {
    preventDefault: true,
  });
  useHotkeys("mod+up", (event) => runEditorHotkey(event, actions.zoomIn), {
    preventDefault: true,
  });
  useHotkeys("mod+down", (event) => runEditorHotkey(event, actions.zoomOut), {
    preventDefault: true,
  });
  useHotkeys(
    "mod+shift+m",
    (event) => runEditorHotkey(event, actions.viewStrictMode),
    { preventDefault: true },
  );
  useHotkeys(
    "mod+shift+f",
    (event) => runEditorHotkey(event, actions.viewFieldSummary),
    { preventDefault: true },
  );
  useHotkeys(
    "mod+shift+s",
    (event) => runEditorHotkey(event, actions.saveDiagramAs),
    { preventDefault: true },
  );
  useHotkeys("mod+alt+c", (event) => runEditorHotkey(event, actions.copyAsImage), {
    preventDefault: true,
  });
  useHotkeys("enter", (event) => runEditorHotkey(event, actions.resetView), {
    preventDefault: true,
  });
  useHotkeys("mod+alt+w", (event) => runEditorHotkey(event, actions.fitWindow), {
    preventDefault: true,
  });
  useHotkeys(
    "alt+e",
    (event) => runEditorHotkey(event, actions.toggleDBMLEditor),
    { preventDefault: true },
  );
}
