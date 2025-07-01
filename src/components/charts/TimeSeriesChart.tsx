import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types";
import { formatEnergyValue, getCategoryColor } from "@/lib/utils/dataUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

interface TimeSeriesChartProps {
  data: ChartDataPoint[];
  title?: string;
  showLegend?: boolean;
  groupBy?: "source" | "category";
  className?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title = "Serie Temporal de Energía",
  showLegend = true,
  groupBy = "source",
  className,
}) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();

    data.forEach((point) => {
      const timeKey = point.datetime;
      const seriesKey =
        groupBy === "source" ? point.sourceTitle : point.sourceTitle;

      if (!dataMap.has(timeKey)) {
        dataMap.set(timeKey, {
          datetime: timeKey,
          timestamp: parseISO(point.datetime).getTime(),
        });
      }

      const entry = dataMap.get(timeKey)!;
      entry[seriesKey] = point.value;
    });

    return Array.from(dataMap.values()).sort(
      (a, b) => (a.timestamp as number) - (b.timestamp as number),
    );
  }, [data, groupBy]);

  // Get unique series for lines and create chart config
  const { series, chartConfig } = useMemo(() => {
    const seriesSet = new Set<string>();
    data.forEach((point) => {
      const seriesKey =
        groupBy === "source" ? point.sourceTitle : point.sourceTitle;
      seriesSet.add(seriesKey);
    });

    const seriesArray = Array.from(seriesSet);

    // Create chart config for colors and labels
    const config: ChartConfig = seriesArray.reduce((acc, seriesName) => {
      const key = seriesName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      const dataPoint = data.find(
        (d) =>
          (groupBy === "source" ? d.sourceTitle : d.sourceTitle) === seriesName,
      );

      acc[key] = {
        label: seriesName,
        color: dataPoint?.color || getCategoryColor(seriesName),
      };
      return acc;
    }, {} as ChartConfig);

    return { series: seriesArray, chartConfig: config };
  }, [data, groupBy]);

  // Format X-axis labels
  const formatXAxisLabel = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      return format(date, "dd/MM HH:mm", { locale: es });
    } catch {
      return tickItem;
    }
  };

  // Format Y-axis labels
  const formatYAxisLabel = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}T`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}G`;
    }
    return value.toFixed(0);
  };

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            No hay datos disponibles para mostrar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartContainer
          config={chartConfig}
          className="w-full h-[400px] min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 40,
                bottom: showLegend ? 80 : 60,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="opacity-30"
                stroke="hsl(var(--muted-foreground))"
              />
              <XAxis
                dataKey="datetime"
                tickFormatter={formatXAxisLabel}
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatYAxisLabel}
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                label={{
                  value: "MWh",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
                width={60}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;

                  let formattedLabel = "";
                  try {
                    const date = parseISO(String(label || ""));
                    formattedLabel = format(date, "dd/MM/yyyy HH:mm", {
                      locale: es,
                    });
                  } catch {
                    formattedLabel = String(label || "");
                  }

                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                      <p className="font-medium text-foreground mb-2 pb-2 border-b border-border">
                        {formattedLabel}
                      </p>
                      <div className="space-y-1">
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-0.5 rounded"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm text-foreground">
                                {String(entry.dataKey)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {formatEnergyValue(Number(entry.value || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {showLegend && (
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "14px",
                  }}
                  iconType="line"
                />
              )}

              {series.map((seriesName) => {
                const dataPoint = data.find(
                  (d) =>
                    (groupBy === "source" ? d.sourceTitle : d.sourceTitle) ===
                    seriesName,
                );
                const color = dataPoint?.color || getCategoryColor(seriesName);

                return (
                  <Line
                    key={seriesName}
                    type="monotone"
                    dataKey={seriesName}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{
                      fill: color,
                      strokeWidth: 2,
                      r: 4,
                      stroke: "hsl(var(--background))",
                    }}
                    activeDot={{
                      r: 6,
                      fill: color,
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                    connectNulls={false}
                  />
                );
              })}

              <ReferenceLine
                y={0}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
