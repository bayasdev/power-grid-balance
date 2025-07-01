import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";
import { format, startOfDay, endOfDay } from "date-fns";

// Zod schemas for API response validation
const EnergyValueSchema = z.object({
  value: z.number().optional(),
  percentage: z.number().optional(),
  datetime: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
});

const EnergySourceSchema = z.object({
  type: z.string().optional(),
  id: z.string().optional(),
  groupId: z.string().optional().nullable(),
  attributes: z
    .object({
      title: z.string().optional(),
      description: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      icon: z.string().optional().nullable(),
      type: z.string().optional().nullable(),
      magnitude: z.string().optional().nullable(),
      composite: z.boolean().optional().default(false),
      "last-update": z
        .string()
        .transform((str) => new Date(str))
        .optional(),
      values: z.array(EnergyValueSchema).optional().default([]),
      total: z.number().optional(),
      "total-percentage": z.number().optional(),
    })
    .optional(),
});

const EnergyCategorySchema = z.object({
  type: z.string().optional(),
  id: z.string().optional(),
  attributes: z
    .object({
      title: z.string().optional(),
      "last-update": z
        .string()
        .transform((str) => new Date(str))
        .optional(),
      description: z.string().optional().nullable(),
      magnitude: z.string().optional().nullable(),
      content: z.array(EnergySourceSchema).optional(),
    })
    .optional(),
});

// More flexible schema that can handle both category and source items
const REEIncludedItemSchema = z.union([
  EnergyCategorySchema,
  EnergySourceSchema,
  // Add a catch-all for unexpected structures
  z.object({
    type: z.string().optional(),
    id: z.string().optional(),
    groupId: z.string().optional().nullable(),
    attributes: z.record(z.unknown()).optional(), // Allow any additional attributes
  }),
]);

const REEApiResponseSchema = z.object({
  data: z
    .object({
      type: z.string().optional(),
      id: z.string().optional(),
      attributes: z
        .object({
          title: z.string().optional(),
          "last-update": z
            .string()
            .transform((str) => new Date(str))
            .optional(),
          description: z.string().optional().nullable(),
        })
        .optional(),
      meta: z
        .object({
          "cache-control": z
            .object({
              cache: z.string().optional(),
              expireAt: z
                .string()
                .transform((str) => new Date(str))
                .optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  included: z.array(REEIncludedItemSchema).optional().default([]),
});

export type REEApiResponse = z.infer<typeof REEApiResponseSchema>;
export type EnergySource = z.infer<typeof EnergySourceSchema>;
export type EnergyCategory = z.infer<typeof EnergyCategorySchema>;
export type EnergyValue = z.infer<typeof EnergyValueSchema>;

export class REEApiService {
  private readonly baseUrl = "https://apidatos.ree.es";
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Fetch electric balance data for a date range
   */
  async fetchElectricBalance(
    startDate: Date,
    endDate: Date,
    timeTrunc: "hour" | "day" | "month" | "year" = "day",
  ): Promise<REEApiResponse> {
    const url = this.buildElectricBalanceUrl(startDate, endDate, timeTrunc);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await betterFetch<REEApiResponse>(url, {
          output: REEApiResponseSchema,
          timeout: 30000, // 30 seconds
          retry: {
            type: "exponential",
            attempts: 2,
            baseDelay: this.retryDelay,
            maxDelay: this.retryDelay * 4,
          },
        });

        if (error) {
          throw new Error(
            `REE API request failed: ${error.message ?? "Unknown error"}`,
          );
        }

        if (!data) {
          throw new Error("No data received from REE API");
        }

        return data;
      } catch (error) {
        console.error(
          `REE API attempt ${attempt}/${this.maxRetries} failed:`,
          error,
        );

        if (attempt === this.maxRetries) {
          throw new REEApiError(
            `Failed to fetch data after ${this.maxRetries} attempts: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            error instanceof Error ? error : new Error(String(error)),
          );
        }

        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
      }
    }

    throw new REEApiError("Unexpected error in fetchElectricBalance");
  }

  /**
   * Fetch data for the current day
   */
  async fetchTodayData(): Promise<REEApiResponse> {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    return this.fetchElectricBalance(startOfToday, endOfToday, "day");
  }

  /**
   * Fetch data for a specific date
   */
  async fetchDateData(date: Date): Promise<REEApiResponse> {
    const startOfDate = startOfDay(date);
    const endOfDate = endOfDay(date);

    return this.fetchElectricBalance(startOfDate, endOfDate, "day");
  }

  /**
   * Fetch data for a date range with daily aggregation
   */
  async fetchDateRangeData(
    startDate: Date,
    endDate: Date,
  ): Promise<REEApiResponse> {
    return this.fetchElectricBalance(startDate, endDate, "day");
  }

  /**
   * Fetch monthly data for a given year and month
   */
  async fetchMonthlyData(year: number, month: number): Promise<REEApiResponse> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    return this.fetchElectricBalance(startDate, endDate, "day");
  }

  private buildElectricBalanceUrl(
    startDate: Date,
    endDate: Date,
    timeTrunc: string,
  ): string {
    const start = format(startDate, "yyyy-MM-dd'T'HH:mm");
    const end = format(endDate, "yyyy-MM-dd'T'HH:mm");

    return `${this.baseUrl}/es/datos/balance/balance-electrico?start_date=${start}&end_date=${end}&time_trunc=${timeTrunc}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class REEApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "REEApiError";
  }
}

// Singleton instance
export const reeApiService = new REEApiService();
