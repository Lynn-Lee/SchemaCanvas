import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CloudAccountStatus from "./CloudAccountStatus";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe("CloudAccountStatus", () => {
  it("explains unavailable cloud without exposing login", () => {
    render(<CloudAccountStatus status="unavailable" />);

    expect(screen.getByRole("heading", { name: "cloud_status_unavailable" }));
    expect(screen.getByText("cloud_status_local_mode_available"));
    expect(
      screen.queryByRole("button", { name: "cloud_action_sign_in" }),
    ).not.toBeInTheDocument();
  });

  it("shows signed-out state with a sign-in action and local mode hint", async () => {
    const onSignIn = vi.fn();

    render(<CloudAccountStatus status="signed-out" onSignIn={onSignIn} />);

    expect(screen.getByRole("heading", { name: "cloud_status_signed_out" }));
    expect(screen.getByText("cloud_status_local_mode_available"));

    await userEvent.click(
      screen.getByRole("button", { name: "cloud_action_sign_in" }),
    );

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows signed-in identity and sign-out action", async () => {
    const onSignOut = vi.fn();

    render(
      <CloudAccountStatus
        status="signed-in"
        account={{ name: "Lynn", email: "lynn@example.test" }}
        onSignOut={onSignOut}
      />,
    );

    expect(screen.getByRole("heading", { name: "cloud_status_signed_in" }));
    expect(screen.getByText("Lynn"));
    expect(screen.getByText("lynn@example.test"));

    await userEvent.click(
      screen.getByRole("button", { name: "cloud_action_sign_out" }),
    );

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("warns expired sessions that local unsaved changes are preserved", () => {
    render(<CloudAccountStatus status="expired-session" />);

    expect(
      screen.getByRole("heading", { name: "cloud_status_expired_session" }),
    );
    expect(screen.getByText("cloud_status_local_changes_preserved"));
    expect(screen.getByRole("button", { name: "cloud_action_sign_in" }));
  });
});
