import React from "react";
import { PieChart, Pie, Legend, Cell } from "recharts";
import type { SourceTotalData } from "@/lib/types";
import {
  formatEnergyValue,
  formatPercentage,
  getCategoryColor,
} from "@/lib/utils/dataUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

interface EnergyPieChartProps {
  data: SourceTotalData[];
  title?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export const EnergyPieChart: React.FC<EnergyPieChartProps> = ({
  data,
  title = "Distribución de Fuentes de Energía",
  showLegend = true,
  innerRadius = 0,
  outerRadius,
  className,
}) => {
  // Calculate total using absolute values for correct percentages
  const totalSum = data.reduce((sum, item) => sum + Math.abs(item.total), 0);

  // Process data for the chart and create config with recalculated percentages
  const chartData = data.map((item) => ({
    name: item.sourceTitle,
    value: Math.abs(item.total), // Use absolute value for pie chart display
    percentage: totalSum > 0 ? (Math.abs(item.total) / totalSum) * 100 : 0,
    originalValue: item.total, // Keep original value for tooltip
    categoryType: item.categoryType,
    fill: `var(--color-${item.sourceTitle
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")})`,
  }));

  // Create chart config for colors and labels
  const chartConfig: ChartConfig = data.reduce((config, item) => {
    const key = item.sourceTitle
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    config[key] = {
      label: item.sourceTitle,
      color: item.color || getCategoryColor(item.categoryType),
    };
    return config;
  }, {} as ChartConfig);

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
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="w-full h-[400px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const data = payload[0].payload;

                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: data.fill }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {data.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Energía:</span>
                          <span className="font-medium text-foreground">
                            {formatEnergyValue(
                              data.originalValue || data.value,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Porcentaje:</span>
                          <span className="font-medium text-foreground">
                            {formatPercentage(data.percentage)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Categoría:</span>
                          <span className="font-medium text-foreground">
                            {data.categoryType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={outerRadius || 120}
              innerRadius={innerRadius}
              paddingAngle={2}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={80}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                }}
                formatter={(value) => {
                  const truncated =
                    value.length > 15 ? `${value.substring(0, 15)}...` : value;
                  return (
                    <span className="text-xs text-foreground" title={value}>
                      {truncated}
                    </span>
                  );
                }}
              />
            )}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const EnergyDonutChart: React.FC<
  Omit<EnergyPieChartProps, "innerRadius">
> = ({ data, ...props }) => {
  const totalAbsolute = data.reduce(
    (sum, item) => sum + Math.abs(item.total),
    0,
  );
  const totalActual = data.reduce((sum, item) => sum + item.total, 0);

  // Calculate correct percentages for the donut chart using absolute values
  const processedData = data.map((item) => ({
    name: item.sourceTitle,
    value: Math.abs(item.total), // Use absolute value for pie chart display
    percentage:
      totalAbsolute > 0 ? (Math.abs(item.total) / totalAbsolute) * 100 : 0,
    originalValue: item.total, // Keep original value for tooltip
    fill: `var(--color-${item.sourceTitle
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")})`,
  }));
  return (
    <Card className={props.className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          {props.title || "Distribución de Fuentes de Energía"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-center mb-4">
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {formatEnergyValue(totalActual)}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
        </div>
        <div className="relative">
          <ChartContainer
            config={data.reduce((config, item) => {
              const key = item.sourceTitle
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "");
              config[key] = {
                label: item.sourceTitle,
                color: item.color || getCategoryColor(item.categoryType),
              };
              return config;
            }, {} as ChartConfig)}
            className="w-full h-[400px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;

                  const data = payload[0].payload;

                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.fill }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {data.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Energía:</span>
                            <span className="font-medium text-foreground">
                              {formatEnergyValue(
                                data.originalValue || data.value,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Porcentaje:</span>
                            <span className="font-medium text-foreground">
                              {formatPercentage(data.percentage)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {props.showLegend !== false && (
                <Legend
                  verticalAlign="bottom"
                  height={80}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    lineHeight: "1.2",
                  }}
                  formatter={(value) => {
                    const truncated =
                      value.length > 15
                        ? `${value.substring(0, 15)}...`
                        : value;
                    return (
                      <span className="text-xs text-foreground" title={value}>
                        {truncated}
                      </span>
                    );
                  }}
                />
              )}
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
