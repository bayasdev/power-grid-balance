import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimeSeriesChart } from "../TimeSeriesChart";
import type { ChartDataPoint } from "@/lib/types";

// Mock recharts to avoid complex chart rendering in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid="line" data-datakey={dataKey} style={{ stroke }} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="x-axis" data-datakey={dataKey} />
  ),
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

describe("TimeSeriesChart", () => {
  const mockData: ChartDataPoint[] = [
    {
      datetime: "2024-01-01T00:00:00Z",
      value: 1200,
      percentage: 35.5,
      sourceTitle: "Solar",
      color: "#22c55e",
    },
    {
      datetime: "2024-01-01T01:00:00Z",
      value: 800,
      percentage: 23.7,
      sourceTitle: "Eólica",
      color: "#3b82f6",
    },
    {
      datetime: "2024-01-01T02:00:00Z",
      value: 600,
      percentage: 17.8,
      sourceTitle: "Gas Natural",
      color: "#ef4444",
    },
  ];

  it("should render with data", () => {
    render(<TimeSeriesChart data={mockData} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("responsive-container")).toHaveLength(2);
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
  });

  it("should render empty state when no data provided", () => {
    render(<TimeSeriesChart data={[]} />);

    expect(
      screen.getByText("No hay datos disponibles para mostrar"),
    ).toBeInTheDocument();
  });

  it("should render with custom title", () => {
    const customTitle = "Custom Time Series Title";
    render(<TimeSeriesChart data={mockData} title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it("should render default title when not provided", () => {
    render(<TimeSeriesChart data={mockData} />);

    expect(screen.getByText("Serie Temporal de Energía")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const customClass = "custom-time-series";
    const { container } = render(
      <TimeSeriesChart data={mockData} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("should handle showLegend prop", () => {
    render(<TimeSeriesChart data={mockData} showLegend={false} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle groupBy prop", () => {
    render(<TimeSeriesChart data={mockData} groupBy="category" />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should render with tooltip and cartesian grid by default", () => {
    render(<TimeSeriesChart data={mockData} />);

    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
  });

  it("should handle data with missing colors", () => {
    const dataWithoutColors = mockData.map((item) => ({
      ...item,
      color: undefined,
    }));

    render(<TimeSeriesChart data={dataWithoutColors} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should format datetime correctly for x-axis", () => {
    render(<TimeSeriesChart data={mockData} />);

    const xAxis = screen.getByTestId("x-axis");
    expect(xAxis).toHaveAttribute("data-datakey", "datetime");
  });
});
