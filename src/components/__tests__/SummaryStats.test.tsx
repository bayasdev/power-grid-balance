import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryStatsComponent, StatCard } from "../SummaryStats";
import type { SummaryStats } from "@/lib/types";

describe("SummaryStatsComponent", () => {
  const mockStats: SummaryStats = {
    balanceCount: 1250,
    categoryCount: 4,
    sourceCount: 25,
    valueCount: 15000,
    latestUpdate: "2024-01-15T10:30:00Z",
    scheduler: {
      isRunning: true,
      jobCount: 3,
    },
  };

  it("should render all stat items with correct values", () => {
    render(<SummaryStatsComponent stats={mockStats} />);

    expect(screen.getByText("Balances de Energía")).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("Registros de balance")).toBeInTheDocument();

    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Tipos de energía")).toBeInTheDocument();

    expect(screen.getByText("Fuentes de Energía")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Fuentes registradas")).toBeInTheDocument();

    expect(screen.getByText("Valores de Datos")).toBeInTheDocument();
    expect(screen.getByText("15,000")).toBeInTheDocument();
    expect(screen.getByText("Puntos de datos")).toBeInTheDocument();
  });

  it("should display last update information when available", () => {
    render(<SummaryStatsComponent stats={mockStats} />);

    expect(screen.getByText("Última Actualización")).toBeInTheDocument();
    expect(
      screen.getByText("Datos más recientes disponibles"),
    ).toBeInTheDocument();
    // The formatted date will depend on timezone, so we just check it exists
    expect(
      screen.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/),
    ).toBeInTheDocument();
  });

  it("should display no data message when latestUpdate is not available", () => {
    const statsWithoutUpdate = {
      ...mockStats,
      latestUpdate: undefined,
    };

    render(<SummaryStatsComponent stats={statsWithoutUpdate} />);

    expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
  });

  it("should display scheduler status as active", () => {
    render(<SummaryStatsComponent stats={mockStats} />);

    expect(screen.getByText("Estado del Planificador")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByText("Recopilando datos automáticamente"),
    ).toBeInTheDocument();
  });

  it("should display scheduler status as inactive", () => {
    const inactiveSchedulerStats = {
      ...mockStats,
      scheduler: {
        isRunning: false,
        jobCount: 0,
      },
    };

    render(<SummaryStatsComponent stats={inactiveSchedulerStats} />);

    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Recopilación pausada")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const customClass = "custom-stats-class";
    const { container } = render(
      <SummaryStatsComponent stats={mockStats} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("should format large numbers with locale-specific formatting", () => {
    const largeNumberStats = {
      ...mockStats,
      balanceCount: 1234567,
      valueCount: 9876543,
    };

    render(<SummaryStatsComponent stats={largeNumberStats} />);

    expect(screen.getByText("1,234,567")).toBeInTheDocument();
    expect(screen.getByText("9,876,543")).toBeInTheDocument();
  });
});

describe("StatCard", () => {
  it("should render basic stat card", () => {
    render(
      <StatCard title="Test Stat" value="100" description="Test description" />,
    );

    expect(screen.getByText("Test Stat")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should render with icon", () => {
    const testIcon = <div data-testid="test-icon">Icon</div>;
    render(<StatCard title="Test Stat" value="100" icon={testIcon} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("should render positive trend", () => {
    render(
      <StatCard
        title="Test Stat"
        value="100"
        trend={{ value: 15, isPositive: true }}
      />,
    );

    expect(screen.getByText("15%")).toBeInTheDocument();
    // Check that the trend exists (the specific styling may vary)
    const trendText = screen.getByText("15%");
    expect(trendText).toBeInTheDocument();
  });

  it("should render negative trend", () => {
    render(
      <StatCard
        title="Test Stat"
        value="100"
        trend={{ value: 10, isPositive: false }}
      />,
    );

    expect(screen.getByText("10%")).toBeInTheDocument();
    // Check that the trend exists (the specific styling may vary)
    const trendText = screen.getByText("10%");
    expect(trendText).toBeInTheDocument();
  });

  it("should render without description when not provided", () => {
    render(<StatCard title="Test Stat" value="100" />);

    expect(screen.getByText("Test Stat")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByText("Test description")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const customClass = "custom-stat-card";
    const { container } = render(
      <StatCard title="Test Stat" value="100" className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("should handle numeric values", () => {
    render(<StatCard title="Test Stat" value={42} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render trend with correct rotation for negative values", () => {
    const { container } = render(
      <StatCard
        title="Test Stat"
        value="100"
        trend={{ value: 5, isPositive: false }}
      />,
    );

    const trendIcon = container.querySelector(".rotate-180");
    expect(trendIcon).toBeInTheDocument();
  });
});
