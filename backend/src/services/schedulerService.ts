import cron from "node-cron";
import { reeApiService, REEApiError } from "./reeApiService.js";
import { databaseService, DatabaseError } from "./databaseService.js";
import { subDays, format } from "date-fns";

export class SchedulerService {
  private jobs: cron.ScheduledTask[] = [];
  private isRunning = false;

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log("Scheduler already running");
      return;
    }

    console.log("Starting REE data scheduler...");

    // Fetch current day data every 15 minutes
    const currentDataJob = cron.schedule(
      "*/15 * * * *",
      async () => {
        await this.fetchCurrentData();
      },
      {
        scheduled: false,
      }
    );

    // Fetch previous day data every hour (for completeness)
    const previousDataJob = cron.schedule(
      "0 * * * *",
      async () => {
        await this.fetchPreviousData();
      },
      {
        scheduled: false,
      }
    );

    // Fetch historical data daily at 2 AM
    const historicalDataJob = cron.schedule(
      "0 2 * * *",
      async () => {
        await this.fetchHistoricalData();
      },
      {
        scheduled: false,
      }
    );

    // Data cleanup weekly on Sunday at 3 AM
    const cleanupJob = cron.schedule(
      "0 3 * * 0",
      async () => {
        await this.cleanupOldData();
      },
      {
        scheduled: false,
      }
    );

    this.jobs = [
      currentDataJob,
      previousDataJob,
      historicalDataJob,
      cleanupJob,
    ];

    // Start all jobs
    this.jobs.forEach((job) => job.start());
    this.isRunning = true;

    console.log("REE data scheduler started successfully");

    // Perform initial data fetch
    this.performInitialFetch();
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("Scheduler not running");
      return;
    }

    console.log("Stopping REE data scheduler...");

    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    this.isRunning = false;

    console.log("REE data scheduler stopped");
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length,
    };
  }

  /**
   * Manual trigger for data fetch
   */
  async manualFetch(
    type: "current" | "previous" | "historical" = "current"
  ): Promise<void> {
    console.log(`Manual fetch triggered: ${type}`);

    try {
      switch (type) {
        case "current":
          await this.fetchCurrentData();
          break;
        case "previous":
          await this.fetchPreviousData();
          break;
        case "historical":
          await this.fetchHistoricalData();
          break;
      }
    } catch (error) {
      console.error(`Manual fetch failed for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Perform initial data fetch when scheduler starts
   */
  private async performInitialFetch(): Promise<void> {
    console.log("Performing initial data fetch...");

    try {
      // Try to fetch today's data first
      await this.fetchCurrentData();

      // Then fetch yesterday's data
      await this.fetchPreviousData();

      console.log("Initial data fetch completed successfully");
    } catch (error) {
      console.error("Initial data fetch failed:", error);
      // Don't throw here, let the scheduled jobs handle retries
    }
  }

  /**
   * Fetch current day data
   */
  private async fetchCurrentData(): Promise<void> {
    try {
      console.log("Fetching current day REE data...");

      const today = new Date();
      const data = await reeApiService.fetchDateData(today);
      await databaseService.storeREEData(data, today);

      console.log(
        `Current day data (${format(
          today,
          "yyyy-MM-dd"
        )}) fetched and stored successfully`
      );
    } catch (error) {
      await this.handleFetchError("current day", error);
    }
  }

  /**
   * Fetch previous day data
   */
  private async fetchPreviousData(): Promise<void> {
    try {
      console.log("Fetching previous day REE data...");

      const yesterday = subDays(new Date(), 1);
      const data = await reeApiService.fetchDateData(yesterday);
      await databaseService.storeREEData(data, yesterday);

      console.log(
        `Previous day data (${format(
          yesterday,
          "yyyy-MM-dd"
        )}) fetched and stored successfully`
      );
    } catch (error) {
      await this.handleFetchError("previous day", error);
    }
  }

  /**
   * Fetch historical data (last 7 days if missing)
   */
  private async fetchHistoricalData(): Promise<void> {
    try {
      console.log("Fetching historical REE data...");

      // Fetch data for the last 7 days
      for (let i = 2; i <= 8; i++) {
        const date = subDays(new Date(), i);

        try {
          const data = await reeApiService.fetchDateData(date);
          await databaseService.storeREEData(data, date);

          console.log(
            `Historical data for ${format(
              date,
              "yyyy-MM-dd"
            )} stored successfully`
          );
        } catch (error) {
          console.error(
            `Failed to fetch historical data for ${format(
              date,
              "yyyy-MM-dd"
            )}:`,
            error
          );
          // Continue with next date
        }
      }

      console.log("Historical data fetch completed");
    } catch (error) {
      await this.handleFetchError("historical", error);
    }
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      console.log("Starting data cleanup...");

      const daysToKeep = parseInt(process.env.DATA_RETENTION_DAYS ?? "365");
      const deletedCount = await databaseService.cleanupOldData(daysToKeep);

      console.log(
        `Data cleanup completed - Deleted ${deletedCount} old records`
      );
    } catch (error) {
      console.error("Data cleanup failed:", error);
    }
  }

  /**
   * Handle fetch errors with appropriate fallback mechanisms
   */
  private async handleFetchError(
    context: string,
    error: unknown
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Failed to fetch ${context} data:`, errorMessage);

    if (error instanceof REEApiError) {
      console.error("REE API Error - implementing fallback strategy");

      // Could implement additional fallback strategies here:
      // 1. Use cached data from database
      // 2. Use alternative data sources
      // 3. Send alerts to administrators
    } else if (error instanceof DatabaseError) {
      console.error("Database Error - data may be lost");

      // Could implement database fallback strategies:
      // 1. Retry with backoff
      // 2. Use alternative database connection
      // 3. Store data in memory temporarily
    } else {
      console.error("Unknown error occurred during data fetch");
    }
  }
}

// Singleton instance
export const schedulerService = new SchedulerService();
