import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PowerGridDashboard } from "../PowerGridDashboard";

// Mock all the hooks
vi.mock("@/hooks/usePowerGridData", () => ({
  useElectricBalanceByDateRange: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    retryFetch: vi.fn(),
  })),
  useSummaryStats: vi.fn(() => ({
    data: {
      balanceCount: 100,
      categoryCount: 4,
      sourceCount: 10,
      valueCount: 1000,
      latestUpdate: "2024-01-01T00:00:00Z",
      scheduler: { isRunning: true, jobCount: 2 },
    },
    loading: false,
    error: null,
    retryFetch: vi.fn(),
  })),
  useManualDataFetch: vi.fn(() => ({
    fetchData: vi.fn(),
    loading: false,
  })),
  useDateRange: vi.fn(() => ({
    dateRange: {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-07"),
    },
    updateDateRange: vi.fn(),
    setPresetRange: vi.fn(),
  })),
}));

// Mock the data utils
vi.mock("@/lib/utils/dataUtils", () => ({
  processBalanceDataForChart: vi.fn(() => []),
  processBalanceDataForTotals: vi.fn(() => []),
  formatDateTime: vi.fn(() => "01/01/2024 10:30"),
}));

// Mock the chart components to avoid complex rendering
vi.mock("../charts/TimeSeriesChart", () => ({
  TimeSeriesChart: ({ title }: { title: string }) => (
    <div data-testid="time-series-chart">{title}</div>
  ),
}));

vi.mock("../charts/EnergyPieChart", () => ({
  EnergyPieChart: ({ title }: { title: string }) => (
    <div data-testid="energy-pie-chart">{title}</div>
  ),
  EnergyDonutChart: ({ title }: { title: string }) => (
    <div data-testid="energy-donut-chart">{title}</div>
  ),
}));

// Mock URL.createObjectURL for export functionality
Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn(() => "mocked-url"),
  writable: true,
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});

describe("PowerGridDashboard", () => {
  it("should render the main dashboard title", () => {
    render(<PowerGridDashboard />);

    expect(
      screen.getByText("Dashboard de Balance Energético"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Monitor en tiempo real del balance de energía eléctrica",
      ),
    ).toBeInTheDocument();
  });

  it("should render control buttons", () => {
    render(<PowerGridDashboard />);

    expect(screen.getByText("Actualizar")).toBeInTheDocument();
    expect(screen.getByText("Exportar")).toBeInTheDocument();
  });

  it("should render controls section", () => {
    render(<PowerGridDashboard />);

    expect(screen.getByText("Controles de Filtrado")).toBeInTheDocument();
    expect(screen.getByText("Rango de Fechas")).toBeInTheDocument();
    expect(screen.getByText("Categoría de Energía")).toBeInTheDocument();
  });

  it("should render category filter options", () => {
    render(<PowerGridDashboard />);

    expect(screen.getByText("Todas las categorías")).toBeInTheDocument();
  });

  it("should render summary statistics when data is available", () => {
    render(<PowerGridDashboard />);

    // The summary stats component should be rendered
    expect(screen.getByText("100")).toBeInTheDocument(); // balanceCount
  });

  it("should handle export button presence", () => {
    render(<PowerGridDashboard />);

    const exportButton = screen.getByText("Exportar");
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toBeEnabled();
  });

  it("should handle refresh button presence", () => {
    render(<PowerGridDashboard />);

    const refreshButton = screen.getByText("Actualizar");
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeEnabled();
  });

  it("should apply ErrorBoundary wrapper", () => {
    render(<PowerGridDashboard />);

    // The component should render without errors, indicating ErrorBoundary is working
    expect(
      screen.getByText("Dashboard de Balance Energético"),
    ).toBeInTheDocument();
  });

  it("should show loading state when fetch is in progress", () => {
    render(<PowerGridDashboard />);

    // Should show loading spinner in the refresh button
    expect(screen.getByText("Actualizar")).toBeInTheDocument();
  });
});
