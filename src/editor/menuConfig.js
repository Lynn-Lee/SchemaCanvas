export const EDITOR_MENU_CATEGORIES = [
  {
    id: "file",
    items: [
      { id: "new", labelKey: "new" },
      { id: "new_window", labelKey: "new_window" },
      { id: "open", labelKey: "open", shortcut: "Ctrl+O", hotkey: "mod+o" },
      { id: "open_recent", labelKey: "open_recent" },
      {
        id: "save",
        labelKey: "save",
        shortcut: "Ctrl+S",
        hotkey: "mod+s",
        disabledWhen: "readOnly",
      },
      {
        id: "save_as",
        labelKey: "save_as",
        shortcut: "Ctrl+Shift+S",
        hotkey: "mod+shift+s",
        disabledWhen: "readOnly",
      },
      {
        id: "save_as_template",
        labelKey: "save_as_template",
        disabledWhen: "readOnly",
      },
      { id: "rename", labelKey: "rename", disabledWhen: "readOnly" },
      {
        id: "delete_diagram",
        labelKey: "delete_diagram",
        disabledWhen: "readOnly",
      },
      { id: "import_from", labelKey: "import_from", disabledWhen: "readOnly" },
      {
        id: "import_from_source",
        labelKey: "import_from_source",
        disabledWhen: "readOnly",
      },
      { id: "export_source", labelKey: "export_source" },
      { id: "export_as", labelKey: "export_as" },
      { id: "exit", labelKey: "exit" },
    ],
  },
  {
    id: "edit",
    items: [
      {
        id: "undo",
        labelKey: "undo",
        shortcut: "Ctrl+Z",
        hotkey: "mod+z",
        disabledWhen: "readOnlyOrNoUndo",
      },
      {
        id: "redo",
        labelKey: "redo",
        shortcut: "Ctrl+Y",
        hotkey: "mod+y",
        disabledWhen: "readOnlyOrNoRedo",
      },
      { id: "clear", labelKey: "clear", disabledWhen: "readOnly" },
      {
        id: "edit",
        labelKey: "edit",
        shortcut: "Ctrl+E",
        hotkey: "mod+e",
        disabledWhen: "readOnly",
      },
      {
        id: "cut",
        labelKey: "cut",
        shortcut: "Ctrl+X",
        hotkey: "mod+x",
        disabledWhen: "readOnly",
      },
      { id: "copy", labelKey: "copy", shortcut: "Ctrl+C", hotkey: "mod+c" },
      {
        id: "paste",
        labelKey: "paste",
        shortcut: "Ctrl+V",
        hotkey: "mod+v",
        disabledWhen: "readOnly",
      },
      {
        id: "duplicate",
        labelKey: "duplicate",
        shortcut: "Ctrl+D",
        hotkey: "mod+d",
        disabledWhen: "readOnly",
      },
      {
        id: "delete",
        labelKey: "delete",
        shortcut: "Del",
        hotkey: "delete",
        disabledWhen: "readOnly",
      },
      {
        id: "copy_as_image",
        labelKey: "copy_as_image",
        shortcut: "Ctrl+Alt+C",
        hotkey: "mod+alt+c",
      },
    ],
  },
  {
    id: "view",
    items: [
      { id: "header", labelKey: "header" },
      { id: "sidebar", labelKey: "sidebar" },
      { id: "issues", labelKey: "issues" },
      {
        id: "dbml_view",
        labelKey: "dbml_view",
        shortcut: "Alt+E",
        hotkey: "alt+e",
      },
      {
        id: "strict_mode",
        labelKey: "strict_mode",
        shortcut: "Ctrl+Shift+M",
        hotkey: "mod+shift+m",
      },
      { id: "presentation_mode", labelKey: "presentation_mode" },
      {
        id: "field_details",
        labelKey: "field_details",
        shortcut: "Ctrl+Shift+F",
        hotkey: "mod+shift+f",
      },
      {
        id: "reset_view",
        labelKey: "reset_view",
        shortcut: "Enter/Return",
        hotkey: "enter",
      },
      { id: "show_comments", labelKey: "show_comments" },
      { id: "show_datatype", labelKey: "show_datatype" },
      {
        id: "show_grid",
        labelKey: "show_grid",
        shortcut: "Ctrl+Shift+G",
        hotkey: "mod+shift+g",
      },
      { id: "snap_to_grid", labelKey: "snap_to_grid" },
      { id: "show_cardinality", labelKey: "show_cardinality" },
      { id: "show_relationship_labels", labelKey: "show_relationship_labels" },
      { id: "show_debug_coordinates", labelKey: "show_debug_coordinates" },
      { id: "theme", labelKey: "theme" },
      {
        id: "zoom_in",
        labelKey: "zoom_in",
        shortcut: "Ctrl+(Up/Wheel)",
        hotkey: "mod+up",
      },
      {
        id: "zoom_out",
        labelKey: "zoom_out",
        shortcut: "Ctrl+(Down/Wheel)",
        hotkey: "mod+down",
      },
      { id: "fullscreen", labelKey: "fullscreen" },
    ],
  },
  {
    id: "settings",
    items: [
      { id: "show_timeline", labelKey: "show_timeline" },
      { id: "autosave", labelKey: "autosave" },
      { id: "table_width", labelKey: "table_width", disabledWhen: "readOnly" },
      {
        id: "configure_custom_types",
        labelKey: "configure_custom_types",
        disabledWhen: "readOnly",
      },
      { id: "language", labelKey: "language" },
      { id: "export_saved_data", labelKey: "export_saved_data" },
      { id: "clear_cache", labelKey: "clear_cache" },
      { id: "flush_storage", labelKey: "flush_storage" },
    ],
  },
  {
    id: "help",
    items: [
      { id: "docs", labelKey: "docs", shortcut: "Ctrl+H", hotkey: "mod+h" },
      { id: "shortcuts", labelKey: "shortcuts" },
      { id: "ask_on_discord", labelKey: "ask_on_discord" },
      { id: "report_bug", labelKey: "report_bug" },
    ],
  },
];

export const EDITOR_HOTKEYS = [
  { id: "import", keys: "mod+i", action: "fileImport" },
  { id: "undo", keys: "mod+z", action: "undo", shortcut: "Ctrl+Z" },
  { id: "redo", keys: "mod+y", action: "redo", shortcut: "Ctrl+Y" },
  { id: "save", keys: "mod+s", action: "save", shortcut: "Ctrl+S" },
  { id: "open", keys: "mod+o", action: "open", shortcut: "Ctrl+O" },
  { id: "edit", keys: "mod+e", action: "edit", shortcut: "Ctrl+E" },
  { id: "duplicate", keys: "mod+d", action: "duplicate", shortcut: "Ctrl+D" },
  { id: "copy", keys: "mod+c", action: "copy", shortcut: "Ctrl+C" },
  { id: "paste", keys: "mod+v", action: "paste", shortcut: "Ctrl+V" },
  { id: "cut", keys: "mod+x", action: "cut", shortcut: "Ctrl+X" },
  { id: "delete", keys: "delete", action: "del", shortcut: "Del" },
  {
    id: "show_grid",
    keys: "mod+shift+g",
    action: "viewGrid",
    shortcut: "Ctrl+Shift+G",
  },
  { id: "zoom_in", keys: "mod+up", action: "zoomIn" },
  { id: "zoom_out", keys: "mod+down", action: "zoomOut" },
  {
    id: "strict_mode",
    keys: "mod+shift+m",
    action: "viewStrictMode",
    shortcut: "Ctrl+Shift+M",
  },
  {
    id: "field_details",
    keys: "mod+shift+f",
    action: "viewFieldSummary",
    shortcut: "Ctrl+Shift+F",
  },
  {
    id: "save_as",
    keys: "mod+shift+s",
    action: "saveDiagramAs",
    shortcut: "Ctrl+Shift+S",
  },
  {
    id: "copy_as_image",
    keys: "mod+alt+c",
    action: "copyAsImage",
    shortcut: "Ctrl+Alt+C",
  },
  { id: "reset_view", keys: "enter", action: "resetView" },
  { id: "docs", keys: "mod+h", action: "openDocs", shortcut: "Ctrl+H" },
  { id: "fit_window", keys: "mod+alt+w", action: "fitWindow" },
  {
    id: "toggle_dbml_editor",
    keys: "alt+e",
    action: "toggleDBMLEditor",
    shortcut: "Alt+E",
  },
];

export function getEditorMenuItem(categoryId, itemId) {
  return EDITOR_MENU_CATEGORIES.find((category) => category.id === categoryId)
    ?.items.find((item) => item.id === itemId);
}

export function getEditorMenuShortcut(categoryId, itemId) {
  return getEditorMenuItem(categoryId, itemId)?.shortcut;
}

export function isEditorMenuItemDisabled(categoryId, itemId, state) {
  const item = getEditorMenuItem(categoryId, itemId);
  if (!item?.disabledWhen) return false;

  if (item.disabledWhen === "readOnly") return Boolean(state.readOnly);
  if (item.disabledWhen === "readOnlyOrNoUndo") {
    return Boolean(state.readOnly) || state.undoCount === 0;
  }
  if (item.disabledWhen === "readOnlyOrNoRedo") {
    return Boolean(state.readOnly) || state.redoCount === 0;
  }
  return false;
}
