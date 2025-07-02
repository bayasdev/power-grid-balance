import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnergyPieChart, EnergyDonutChart } from "../EnergyPieChart";
import type { SourceTotalData } from "@/lib/types";

// Mock recharts to avoid complex chart rendering in tests
vi.mock("recharts", () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data, dataKey }: { data: SourceTotalData[]; dataKey: string }) => (
    <div data-testid="pie" data-datakey={dataKey}>
      {data.map((item, index) => (
        <div key={index} data-testid="pie-cell">
          {item[dataKey as keyof SourceTotalData]}
        </div>
      ))}
    </div>
  ),
  Cell: ({ fill }: { fill: string }) => (
    <div data-testid="pie-cell" style={{ backgroundColor: fill }} />
  ),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe("EnergyPieChart", () => {
  const mockData: SourceTotalData[] = [
    {
      sourceTitle: "Solar",
      total: 1500,
      percentage: 35.5,
      color: "#22c55e",
      categoryType: "Renovable",
    },
    {
      sourceTitle: "Eólica",
      total: 1200,
      percentage: 28.4,
      color: "#3b82f6",
      categoryType: "Renovable",
    },
    {
      sourceTitle: "Gas Natural",
      total: 800,
      percentage: 18.9,
      color: "#ef4444",
      categoryType: "No-Renovable",
    },
  ];

  it("should render with data", () => {
    render(<EnergyPieChart data={mockData} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("should render empty state when no data provided", () => {
    render(<EnergyPieChart data={[]} />);

    expect(
      screen.getByText("No hay datos disponibles para mostrar"),
    ).toBeInTheDocument();
  });

  it("should render with custom title", () => {
    const customTitle = "Custom Chart Title";
    render(<EnergyPieChart data={mockData} title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it("should render default title when not provided", () => {
    render(<EnergyPieChart data={mockData} />);

    expect(
      screen.getByText("Distribución de Fuentes de Energía"),
    ).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const customClass = "custom-pie-chart";
    const { container } = render(
      <EnergyPieChart data={mockData} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("should render chart with correct data structure", () => {
    render(<EnergyPieChart data={mockData} />);

    const pieElement = screen.getByTestId("pie");
    expect(pieElement).toHaveAttribute("data-datakey", "value");
  });

  it("should handle data with missing colors", () => {
    const dataWithoutColors = mockData.map((item) => ({
      ...item,
      color: undefined,
    }));

    render(<EnergyPieChart data={dataWithoutColors} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("should handle showLegend prop", () => {
    render(<EnergyPieChart data={mockData} showLegend={false} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("should handle custom innerRadius and outerRadius", () => {
    render(
      <EnergyPieChart data={mockData} innerRadius={50} outerRadius={150} />,
    );

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });
});

describe("EnergyDonutChart", () => {
  const mockData: SourceTotalData[] = [
    {
      sourceTitle: "Solar",
      total: 1500,
      percentage: 35.5,
      color: "#22c55e",
      categoryType: "Renovable",
    },
    {
      sourceTitle: "Eólica",
      total: 1200,
      percentage: 28.4,
      color: "#3b82f6",
      categoryType: "Renovable",
    },
  ];

  it("should render donut chart with data", () => {
    render(<EnergyDonutChart data={mockData} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("should render empty state when no data provided", () => {
    render(<EnergyDonutChart data={[]} />);

    // Check for total display showing 0.00 MWh when no data
    expect(screen.getByText("0.00 MWh")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("should render with custom title", () => {
    const customTitle = "Custom Donut Title";
    render(<EnergyDonutChart data={mockData} title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it("should render default title when not provided", () => {
    render(<EnergyDonutChart data={mockData} />);

    expect(
      screen.getByText("Distribución de Fuentes de Energía"),
    ).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const customClass = "custom-donut-chart";
    const { container } = render(
      <EnergyDonutChart data={mockData} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("should handle showLegend prop", () => {
    render(<EnergyDonutChart data={mockData} showLegend={false} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("should handle custom outerRadius", () => {
    render(<EnergyDonutChart data={mockData} outerRadius={150} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });
});
