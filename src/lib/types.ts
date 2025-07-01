export interface EnergyValue {
  id: string;
  value: number;
  percentage: number;
  datetime: string;
}

export interface EnergySource {
  id: string;
  sourceId: string;
  groupId: string;
  type: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  magnitude?: string;
  isComposite: boolean;
  total: number;
  totalPercentage: number;
  values: EnergyValue[];
}

export interface EnergyCategory {
  id: string;
  categoryId: string;
  type: string;
  title: string;
  description?: string;
  lastUpdate: string;
  energySources: EnergySource[];
}

export interface PowerGridBalance {
  id: string;
  balanceId: string;
  balanceDate: string;
  type: string;
  title: string;
  description?: string;
  lastUpdate: string;
  cacheHit?: boolean;
  energyCategories: EnergyCategory[];
}

export interface SummaryStats {
  balanceCount: number;
  categoryCount: number;
  sourceCount: number;
  valueCount: number;
  latestUpdate?: string;
  scheduler: {
    isRunning: boolean;
    jobCount: number;
  };
}

export interface MutationResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export type EnergySourceCategory =
  | "Renovable"
  | "No-Renovable"
  | "Almacenamiento"
  | "Demanda";

export type FetchType = "current" | "previous" | "historical";

// Chart data interfaces for visualizations
export interface ChartDataPoint {
  datetime: string;
  value: number;
  percentage: number;
  sourceTitle: string;
  color?: string;
}

export interface CategoryChartData {
  categoryTitle: string;
  categoryType: string;
  data: ChartDataPoint[];
}

export interface SourceTotalData {
  sourceTitle: string;
  total: number;
  percentage: number;
  color?: string;
  categoryType: string;
}

// Date range interface
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
