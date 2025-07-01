import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type {
  PowerGridBalance,
  EnergySource,
  ChartDataPoint,
  CategoryChartData,
  SourceTotalData,
} from "../types";

/**
 * Format date for display
 */
export const formatDate = (
  dateString: string,
  formatStr: string = "dd/MM/yyyy"
): string => {
  try {
    return format(parseISO(dateString), formatStr, { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Format datetime for display
 */
export const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return dateString;
  }
};

/**
 * Format energy value with appropriate units
 */
export const formatEnergyValue = (
  value: number,
  magnitude?: string
): string => {
  const units = magnitude || "MWh";

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} T${units}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} G${units}`;
  } else {
    return `${value.toFixed(2)} ${units}`;
  }
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Get color for energy source or use default
 */
export const getSourceColor = (source: EnergySource, index: number): string => {
  if (source.color) {
    return source.color;
  }

  // Default color palette
  const defaultColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#8dd1e1",
    "#d084d0",
    "#87ceeb",
    "#ffb347",
    "#dda0dd",
    "#f0e68c",
  ];

  return defaultColors[index % defaultColors.length];
};

/**
 * Process balance data for time series charts
 */
export const processBalanceDataForChart = (
  balances: PowerGridBalance[]
): CategoryChartData[] => {
  const categoryData: Map<string, CategoryChartData> = new Map();

  balances.forEach((balance) => {
    balance.energyCategories.forEach((category) => {
      category.energySources.forEach((source, sourceIndex) => {
        const categoryKey = category.type;

        if (!categoryData.has(categoryKey)) {
          categoryData.set(categoryKey, {
            categoryTitle: category.title,
            categoryType: category.type,
            data: [],
          });
        }

        const chartData = categoryData.get(categoryKey)!;
        const color = getSourceColor(source, sourceIndex);

        source.values.forEach((value) => {
          chartData.data.push({
            datetime: value.datetime,
            value: value.value,
            percentage: value.percentage,
            sourceTitle: source.title,
            color,
          });
        });
      });
    });
  });

  return Array.from(categoryData.values());
};

/**
 * Process balance data for pie/bar charts showing totals
 */
export const processBalanceDataForTotals = (
  balances: PowerGridBalance[]
): SourceTotalData[] => {
  const sourceMap: Map<string, SourceTotalData> = new Map();

  balances.forEach((balance) => {
    balance.energyCategories.forEach((category) => {
      category.energySources.forEach((source, index) => {
        const key = `${source.sourceId}-${category.type}`;

        if (!sourceMap.has(key)) {
          sourceMap.set(key, {
            sourceTitle: source.title,
            total: source.total,
            percentage: source.totalPercentage,
            color: getSourceColor(source, index),
            categoryType: category.type,
          });
        } else {
          // Accumulate values if source appears multiple times
          const existing = sourceMap.get(key)!;
          existing.total += source.total;
          existing.percentage += source.totalPercentage;
        }
      });
    });
  });

  return Array.from(sourceMap.values()).sort((a, b) => b.total - a.total);
};

/**
 * Get category color based on type
 */
export const getCategoryColor = (categoryType: string): string => {
  const categoryColors: Record<string, string> = {
    Renovable: "#22c55e", // Green
    "No-Renovable": "#ef4444", // Red
    Almacenamiento: "#3b82f6", // Blue
    Demanda: "#f59e0b", // Orange
  };

  return categoryColors[categoryType] || "#6b7280";
};

/**
 * Calculate total energy by category
 */
export const calculateCategoryTotals = (
  balances: PowerGridBalance[]
): Record<string, number> => {
  const totals: Record<string, number> = {};

  balances.forEach((balance) => {
    balance.energyCategories.forEach((category) => {
      if (!totals[category.type]) {
        totals[category.type] = 0;
      }

      category.energySources.forEach((source) => {
        totals[category.type] += source.total;
      });
    });
  });

  return totals;
};

/**
 * Filter data by date range
 */
export const filterDataByDateRange = (
  data: ChartDataPoint[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] => {
  return data.filter((point) => {
    const pointDate = parseISO(point.datetime);
    return pointDate >= startDate && pointDate <= endDate;
  });
};

/**
 * Group chart data by time interval (hour, day, etc.)
 */
export const groupDataByInterval = (
  data: ChartDataPoint[],
  intervalHours: number = 1
): ChartDataPoint[] => {
  const grouped: Map<string, ChartDataPoint[]> = new Map();

  data.forEach((point) => {
    const date = parseISO(point.datetime);
    const intervalStart = new Date(date);
    intervalStart.setHours(
      Math.floor(date.getHours() / intervalHours) * intervalHours,
      0,
      0,
      0
    );

    const key = intervalStart.toISOString();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(point);
  });

  return Array.from(grouped.entries())
    .map(([datetime, points]) => {
      const totalValue = points.reduce((sum, p) => sum + p.value, 0);
      const avgPercentage =
        points.reduce((sum, p) => sum + p.percentage, 0) / points.length;

      return {
        datetime,
        value: totalValue,
        percentage: avgPercentage,
        sourceTitle: points.length > 1 ? "Agregado" : points[0].sourceTitle,
        color: points[0].color,
      };
    })
    .sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
};
