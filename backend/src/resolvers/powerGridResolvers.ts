import { databaseService } from "../services/databaseService.js";
import { schedulerService } from "../services/schedulerService.js";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

type FetchType = "current" | "previous" | "historical";

type EnergySourceCategory =
  | "Renovable"
  | "No-Renovable"
  | "Almacenamiento"
  | "Demanda";

interface MutationResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

interface SummaryStatsResponse {
  balanceCount: number;
  categoryCount: number;
  sourceCount: number;
  valueCount: number;
  latestUpdate?: Date;
  scheduler: {
    isRunning: boolean;
    jobCount: number;
  };
}

// Utility functions for validation
const validateDateString = (dateStr: string): Date => {
  if (!isValid(parseISO(dateStr))) {
    throw new Error(
      `Invalid date format: ${dateStr}. Use ISO 8601 format (YYYY-MM-DD)`
    );
  }
  return parseISO(dateStr);
};

const validateDateRange = (startDate: Date, endDate: Date): void => {
  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }

  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff > 365) {
    throw new Error("Date range cannot exceed 365 days");
  }
};

export const powerGridResolvers = {
  Query: {
    /**
     * Get electric balance data by date range
     */
    electricBalanceByDateRange: async (startDate: string, endDate: string) => {
      const start = validateDateString(startDate);
      const end = validateDateString(endDate);

      validateDateRange(start, end);

      console.log(
        `Fetching electric balance data from ${startDate} to ${endDate}`
      );

      const data = await databaseService.getElectricBalanceByDateRange(
        startOfDay(start),
        endOfDay(end)
      );

      if (!data || data.length === 0) {
        console.log(`No data found for date range ${startDate} to ${endDate}`);
        return [];
      }

      return data;
    },

    /**
     * Get the latest electric balance data
     */
    latestElectricBalance: async () => {
      console.log("Fetching latest electric balance data");

      const data = await databaseService.getLatestElectricBalance();

      if (!data) {
        console.log("No electric balance data found");

        return null;
      }

      return data;
    },

    /**
     * Get electric balance data for a specific date
     */
    electricBalanceByDate: async (date: string) => {
      const parsedDate = validateDateString(date);

      console.log(`Fetching electric balance data for ${date}`);

      const data = await databaseService.getElectricBalanceByDate(parsedDate);

      if (!data || data.length === 0) {
        console.log(`No data found for date ${date}`);
        return [];
      }

      return data;
    },

    /**
     * Get energy sources by category
     */
    energySourcesByCategory: async (
      categoryType: EnergySourceCategory,
      startDate?: string,
      endDate?: string
    ) => {
      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate && endDate) {
        start = startOfDay(validateDateString(startDate));
        end = endOfDay(validateDateString(endDate));
        validateDateRange(start, end);
      }

      console.log(`Fetching energy sources for category: ${categoryType}`);

      return await databaseService.getEnergySourcesByCategory(
        categoryType,
        start,
        end
      );
    },

    /**
     * Get summary statistics
     */
    summaryStats: async (): Promise<SummaryStatsResponse> => {
      console.log("Fetching summary statistics");

      const stats = await databaseService.getSummaryStats();
      const schedulerStatus = schedulerService.getStatus();

      return {
        ...stats,
        scheduler: schedulerStatus,
      };
    },
  },

  Mutation: {
    /**
     * Manually trigger data fetch
     */
    manualDataFetch: async (type: FetchType): Promise<MutationResponse> => {
      console.log(`Manual data fetch triggered: ${type}`);

      try {
        await schedulerService.manualFetch(type);

        return {
          success: true,
          message: `Successfully fetched ${type} data`,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Error in manualDataFetch mutation:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        return {
          success: false,
          message: `Failed to fetch data: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };
      }
    },

    /**
     * Start the scheduler
     */
    startScheduler: async (): Promise<MutationResponse> => {
      try {
        console.log("Starting scheduler via mutation");

        schedulerService.start();

        return {
          success: true,
          message: "Scheduler started successfully",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Error in startScheduler mutation:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        return {
          success: false,
          message: `Failed to start scheduler: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };
      }
    },

    /**
     * Stop the scheduler
     */
    stopScheduler: async (): Promise<MutationResponse> => {
      try {
        console.log("Stopping scheduler via mutation");

        schedulerService.stop();

        return {
          success: true,
          message: "Scheduler stopped successfully",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Error in stopScheduler mutation:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        return {
          success: false,
          message: `Failed to stop scheduler: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };
      }
    },
  },
};
