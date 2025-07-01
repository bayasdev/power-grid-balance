import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { format } from "date-fns";
import {
  GET_ELECTRIC_BALANCE_BY_DATE_RANGE,
  GET_LATEST_ELECTRIC_BALANCE,
  GET_ENERGY_SOURCES_BY_CATEGORY,
  GET_SUMMARY_STATS,
  MANUAL_DATA_FETCH,
} from "../lib/graphql/queries";
import type {
  PowerGridBalance,
  SummaryStats,
  EnergySource,
  EnergySourceCategory,
  FetchType,
  DateRange,
} from "../lib/types";

// Hook for fetching electric balance data by date range
export const useElectricBalanceByDateRange = (dateRange: DateRange) => {
  const startDate = format(dateRange.startDate, "yyyy-MM-dd");
  const endDate = format(dateRange.endDate, "yyyy-MM-dd");

  const { loading, error, data, refetch } = useQuery<{
    electricBalanceByDateRange: PowerGridBalance[];
  }>(GET_ELECTRIC_BALANCE_BY_DATE_RANGE, {
    variables: { startDate, endDate },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const retryFetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: data?.electricBalanceByDateRange || [],
    loading,
    error,
    retryFetch,
  };
};

// Hook for fetching latest electric balance
export const useLatestElectricBalance = () => {
  const { loading, error, data, refetch } = useQuery<{
    latestElectricBalance: PowerGridBalance | null;
  }>(GET_LATEST_ELECTRIC_BALANCE, {
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    pollInterval: 300000, // Poll every 5 minutes for latest data
  });

  const retryFetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: data?.latestElectricBalance,
    loading,
    error,
    retryFetch,
  };
};

// Hook for fetching energy sources by category
export const useEnergySourcesByCategory = (
  categoryType: EnergySourceCategory,
  dateRange?: DateRange
) => {
  const variables = dateRange
    ? {
        categoryType,
        startDate: format(dateRange.startDate, "yyyy-MM-dd"),
        endDate: format(dateRange.endDate, "yyyy-MM-dd"),
      }
    : { categoryType };

  const { loading, error, data, refetch } = useQuery<{
    energySourcesByCategory: EnergySource[];
  }>(GET_ENERGY_SOURCES_BY_CATEGORY, {
    variables,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const retryFetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: data?.energySourcesByCategory || [],
    loading,
    error,
    retryFetch,
  };
};

// Hook for fetching summary statistics
export const useSummaryStats = () => {
  const { loading, error, data, refetch } = useQuery<{
    summaryStats: SummaryStats;
  }>(GET_SUMMARY_STATS, {
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    pollInterval: 60000, // Poll every minute for stats
  });

  const retryFetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: data?.summaryStats,
    loading,
    error,
    retryFetch,
  };
};

// Hook for manual data fetching
export const useManualDataFetch = () => {
  const [mutate, { loading, error, data }] = useMutation(MANUAL_DATA_FETCH);

  const fetchData = useCallback(
    async (type: FetchType) => {
      try {
        const result = await mutate({ variables: { type } });
        return result.data?.manualDataFetch;
      } catch (err) {
        console.error("Manual data fetch error:", err);
        throw err;
      }
    },
    [mutate]
  );

  return {
    fetchData,
    loading,
    error,
    lastResult: data?.manualDataFetch,
  };
};

// Hook for managing date range state
export const useDateRange = (initialDays: number = 7) => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - initialDays);

    return { startDate, endDate };
  });

  const updateDateRange = useCallback((newRange: Partial<DateRange>) => {
    setDateRange((prev) => ({
      ...prev,
      ...newRange,
    }));
  }, []);

  const setPresetRange = useCallback((days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setDateRange({ startDate, endDate });
  }, []);

  return {
    dateRange,
    updateDateRange,
    setPresetRange,
  };
};
