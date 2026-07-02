import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ExtensionsContext, {
  getCloudCapability,
} from "../../context/ExtensionsContext";
import CloudAccountEntry from "./CloudAccountEntry";

vi.mock("@douyinfe/semi-icons", () => ({
  IconUser: function IconUser() {
    return null;
  },
}));

vi.mock("@douyinfe/semi-ui", () => ({
  Button: function Button({ children, onClick, "aria-label": ariaLabel }) {
    return (
      <button type="button" aria-label={ariaLabel} onClick={onClick}>
        {children}
      </button>
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

describe("getCloudCapability", () => {
  it("defaults cloud account features to disabled", () => {
    expect(getCloudCapability()).toMatchObject({
      enabled: false,
      reason: "unavailable",
    });
  });

  it("enables cloud account features from explicit capability config", () => {
    expect(
      getCloudCapability({
        cloudCapability: {
          enabled: true,
          apiUrl: "https://cloud.example.test",
        },
      }),
    ).toMatchObject({
      enabled: true,
      apiUrl: "https://cloud.example.test",
    });
  });
});

describe("CloudAccountEntry", () => {
  it("does not show the account entry when cloud is not configured", () => {
    render(
      <ExtensionsContext.Provider value={{}}>
        <CloudAccountEntry />
      </ExtensionsContext.Provider>,
    );

    expect(
      screen.queryByRole("button", { name: "cloud_account" }),
    ).not.toBeInTheDocument();
  });

  it("shows the account entry when cloud capability is configured", () => {
    render(
      <ExtensionsContext.Provider
        value={{
          cloudCapability: {
            enabled: true,
            apiUrl: "https://cloud.example.test",
          },
        }}
      >
        <CloudAccountEntry />
      </ExtensionsContext.Provider>,
    );

    expect(
      screen.getByRole("button", { name: "cloud_account" }),
    ).toBeInTheDocument();
  });

  it("only opens the account UI when clicked", async () => {
    const openCloudAccount = vi.fn();
    const login = vi.fn();
    const saveCloudDiagram = vi.fn();

    render(
      <ExtensionsContext.Provider
        value={{
          cloudCapability: { enabled: true },
          openCloudAccount,
          cloudRepository: {
            login,
            saveCloudDiagram,
          },
        }}
      >
        <CloudAccountEntry />
      </ExtensionsContext.Provider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "cloud_account" }),
    );

    expect(openCloudAccount).toHaveBeenCalledTimes(1);
    expect(login).not.toHaveBeenCalled();
    expect(saveCloudDiagram).not.toHaveBeenCalled();
  });
});
