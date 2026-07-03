import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";

function BrokenRoute() {
  throw new Error("route render failed");
}

describe("ErrorBoundary", () => {
  test("renders a route fallback when a child throws", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenRoute />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole("alert", {
        name: /something went wrong/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reload this page/i)).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
