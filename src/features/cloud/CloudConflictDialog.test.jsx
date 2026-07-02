import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CloudConflictDialog from "./CloudConflictDialog";

vi.mock("@douyinfe/semi-ui", () => ({
  Button: function Button({ children, onClick }) {
    return (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    );
  },
  Modal: function Modal({ children, title, visible, onCancel }) {
    if (!visible) {
      return null;
    }
    return (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onCancel}>
          cancel
        </button>
      </div>
    );
  },
}));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe("CloudConflictDialog", () => {
  it("offers local, overwrite, and save-as-local recovery actions", async () => {
    const onKeepLocal = vi.fn();
    const onOverwriteCloud = vi.fn();
    const onSaveAsLocal = vi.fn();

    render(
      <CloudConflictDialog
        visible
        remoteModifiedAt="2026-07-02T11:44:00.000Z"
        onKeepLocal={onKeepLocal}
        onOverwriteCloud={onOverwriteCloud}
        onSaveAsLocal={onSaveAsLocal}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "cloud_conflict_title" }));
    expect(screen.getByText("cloud_conflict_description"));
    expect(screen.getByText("2026-07-02T11:44:00.000Z"));

    await userEvent.click(
      screen.getByRole("button", { name: "cloud_conflict_keep_local" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "cloud_conflict_overwrite_cloud" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "cloud_conflict_save_as_local" }),
    );

    expect(onKeepLocal).toHaveBeenCalledTimes(1);
    expect(onOverwriteCloud).toHaveBeenCalledTimes(1);
    expect(onSaveAsLocal).toHaveBeenCalledTimes(1);
  });
});
