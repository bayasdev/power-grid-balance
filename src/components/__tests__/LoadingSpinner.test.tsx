import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner, LoadingCard, Skeleton } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("should render with default size", () => {
    const { container } = render(<LoadingSpinner />);

    const spinnerContainer = container.firstChild as HTMLElement;
    expect(spinnerContainer).toBeInTheDocument();
    expect(spinnerContainer).toHaveClass(
      "flex",
      "items-center",
      "justify-center"
    );
  });

  it("should render with text", () => {
    const testText = "Loading data...";
    render(<LoadingSpinner text={testText} />);

    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it("should render with custom className", () => {
    const customClass = "custom-spinner-class";
    const { container } = render(<LoadingSpinner className={customClass} />);

    const spinnerContainer = container.firstChild as HTMLElement;
    expect(spinnerContainer).toHaveClass(customClass);
  });
});

describe("LoadingCard", () => {
  it("should render with default props", () => {
    render(<LoadingCard />);

    expect(screen.getByText("Cargando datos...")).toBeInTheDocument();
    expect(
      screen.getByText("Por favor espera mientras se cargan los datos.")
    ).toBeInTheDocument();
  });

  it("should render with custom title and description", () => {
    const customTitle = "Custom Loading";
    const customDescription = "Custom description";

    render(<LoadingCard title={customTitle} description={customDescription} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("should render with default classes", () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("animate-pulse", "rounded-md", "bg-muted");
  });

  it("should render with custom className", () => {
    const customClass = "h-4 w-full";
    const { container } = render(<Skeleton className={customClass} />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass(customClass);
  });
});
