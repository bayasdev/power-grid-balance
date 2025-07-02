import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorDisplay, InlineError } from "../ErrorDisplay";

describe("ErrorDisplay", () => {
  const mockError = new Error("Test error message");

  it("should render error message", () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should render retry button when onRetry is provided", () => {
    const mockRetry = vi.fn();
    render(<ErrorDisplay error={mockError} onRetry={mockRetry} />);

    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", async () => {
    const mockRetry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorDisplay error={mockError} onRetry={mockRetry} />);

    const retryButton = screen.getByText("Reintentar");
    await user.click(retryButton);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry button when onRetry is not provided", () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.queryByText("Reintentar")).not.toBeInTheDocument();
  });

  it("should render with custom title", () => {
    const customTitle = "Custom Error Title";
    render(<ErrorDisplay error={mockError} title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it("should render default title when not provided", () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText("Error al cargar datos")).toBeInTheDocument();
  });

  it("should handle network error message", () => {
    const networkError = new Error("Network error occurred");
    render(<ErrorDisplay error={networkError} />);

    expect(
      screen.getByText("Error de conexión. Verifica tu conexión a internet."),
    ).toBeInTheDocument();
  });
});

describe("InlineError", () => {
  it("should render string error", () => {
    const stringError = "Simple error string";
    render(<InlineError error={stringError} />);

    expect(screen.getByText(stringError)).toBeInTheDocument();
  });

  it("should render Error object", () => {
    const errorObject = new Error("Error object message");
    render(<InlineError error={errorObject} />);

    expect(screen.getByText("Error object message")).toBeInTheDocument();
  });

  it("should render retry button when onRetry is provided", () => {
    const mockRetry = vi.fn();
    render(<InlineError error="Test error" onRetry={mockRetry} />);

    // The retry button in InlineError is just an icon, so we check for its presence
    const retryButton = screen.getByRole("button");
    expect(retryButton).toBeInTheDocument();
  });
});
