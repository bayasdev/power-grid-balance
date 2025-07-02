import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManualDataFetchControls } from "../ManualDataFetchControls";

// Mock the useManualDataFetch hook
const mockFetchData = vi.fn();
const mockUseManualDataFetch = {
  fetchData: mockFetchData,
};

vi.mock("@/hooks/usePowerGridData", () => ({
  useManualDataFetch: () => mockUseManualDataFetch,
}));

// Mock Sonner using hoisted functions
const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
    variant: string;
    size: string;
    className: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`button-${variant}`}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: string;
  }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: string;
  }) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: string;
  }) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: string;
  }) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
}));

// Mock LoadingSpinner
vi.mock("../LoadingSpinner", () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Calendar: ({ className }: { className: string }) => (
    <div data-testid="calendar-icon" className={className} />
  ),
  History: ({ className }: { className: string }) => (
    <div data-testid="history-icon" className={className} />
  ),
  Download: ({ className }: { className: string }) => (
    <div data-testid="download-icon" className={className} />
  ),
  CalendarClock: ({ className }: { className: string }) => (
    <div data-testid="calendar-clock-icon" className={className} />
  ),
}));

describe("ManualDataFetchControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it("renders the component with title and three buttons", () => {
    render(<ManualDataFetchControls />);

    expect(screen.getByText("Actualización Manual")).toBeInTheDocument();
    expect(screen.getByTestId("download-icon")).toBeInTheDocument();
    expect(screen.getByText("Actuales")).toBeInTheDocument();
    expect(screen.getByText("Anteriores")).toBeInTheDocument();
    expect(screen.getByText("Históricos")).toBeInTheDocument();
  });

  it("renders buttons with correct variants", () => {
    render(<ManualDataFetchControls />);

    const buttons = screen.getAllByTestId("button-outline");
    expect(buttons).toHaveLength(3);
  });

  it("calls fetchData with correct type when current button is clicked", async () => {
    const user = userEvent.setup();
    mockFetchData.mockResolvedValue({
      success: true,
      message: "Success",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    expect(mockFetchData).toHaveBeenCalledWith("current");
  });

  it("calls fetchData with correct type when previous button is clicked", async () => {
    const user = userEvent.setup();
    mockFetchData.mockResolvedValue({
      success: true,
      message: "Success",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls />);

    const previousButton = screen.getByText("Anteriores");
    await user.click(previousButton);

    expect(mockFetchData).toHaveBeenCalledWith("previous");
  });

  it("calls fetchData with correct type when historical button is clicked", async () => {
    const user = userEvent.setup();
    mockFetchData.mockResolvedValue({
      success: true,
      message: "Success",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls />);

    const historicalButton = screen.getByText("Históricos");
    await user.click(historicalButton);

    expect(mockFetchData).toHaveBeenCalledWith("historical");
  });

  it("shows success toast when fetch is successful", async () => {
    const user = userEvent.setup();
    mockFetchData.mockResolvedValue({
      success: true,
      message: "Data fetched successfully",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Datos Actuales obtenidos correctamente",
        expect.objectContaining({
          description: expect.stringContaining("Actualizado:"),
        }),
      );
    });
  });

  it("shows error toast when fetch fails", async () => {
    const user = userEvent.setup();
    mockFetchData.mockResolvedValue({
      success: false,
      message: "API Error",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Error al obtener datos Actuales",
        expect.objectContaining({
          description: "API Error",
        }),
      );
    });
  });

  it("shows error toast when fetch throws an exception", async () => {
    const user = userEvent.setup();
    mockFetchData.mockRejectedValue(new Error("Network error"));

    render(<ManualDataFetchControls />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Error de conexión",
        expect.objectContaining({
          description: "Network error",
        }),
      );
    });
  });

  it("calls onFetchComplete when fetch is successful", async () => {
    const user = userEvent.setup();
    const mockOnFetchComplete = vi.fn();
    mockFetchData.mockResolvedValue({
      success: true,
      message: "Success",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls onFetchComplete={mockOnFetchComplete} />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    await waitFor(() => {
      expect(mockOnFetchComplete).toHaveBeenCalled();
    });
  });

  it("does not call onFetchComplete when fetch fails", async () => {
    const user = userEvent.setup();
    const mockOnFetchComplete = vi.fn();
    mockFetchData.mockResolvedValue({
      success: false,
      message: "Error",
      timestamp: "2024-01-01T10:00:00Z",
    });

    render(<ManualDataFetchControls onFetchComplete={mockOnFetchComplete} />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    await waitFor(() => {
      expect(mockOnFetchComplete).not.toHaveBeenCalled();
    });
  });

  it("disables all buttons while any button is loading", async () => {
    const user = userEvent.setup();
    // Create a promise that we can control
    let resolvePromise: (value: {
      success: boolean;
      message: string;
      timestamp: string;
    }) => void;
    const controlledPromise = new Promise<{
      success: boolean;
      message: string;
      timestamp: string;
    }>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchData.mockReturnValue(controlledPromise);

    render(<ManualDataFetchControls />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    // Check that all buttons are disabled while loading
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });

    // Resolve the promise to finish loading
    resolvePromise!({
      success: true,
      message: "Success",
      timestamp: "2024-01-01T10:00:00Z",
    });

    // Wait for loading to finish
    await waitFor(() => {
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  it("shows loading spinner only on the clicked button", async () => {
    const user = userEvent.setup();
    // Create a promise that we can control
    let resolvePromise: (value: {
      success: boolean;
      message: string;
      timestamp: string;
    }) => void;
    const controlledPromise = new Promise<{
      success: boolean;
      message: string;
      timestamp: string;
    }>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchData.mockReturnValue(controlledPromise);

    render(<ManualDataFetchControls />);

    const currentButton = screen.getByText("Actuales");
    await user.click(currentButton);

    // Should show exactly one loading spinner
    const loadingSpinners = screen.getAllByTestId("loading-spinner");
    expect(loadingSpinners).toHaveLength(1);

    // The spinner should have the correct size
    expect(loadingSpinners[0]).toHaveAttribute("data-size", "sm");

    // Resolve the promise to finish loading
    resolvePromise!({
      success: true,
      message: "Success",
      timestamp: "2024-01-01T10:00:00Z",
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });
});
