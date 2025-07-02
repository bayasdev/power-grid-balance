import {
  PrismaClient,
  PowerGridBalance,
} from "../../generated/prisma/client.js";
import {
  REEApiResponse,
  EnergyCategory,
  EnergyValue,
} from "./reeApiService.js";
import { startOfDay, endOfDay } from "date-fns";

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Store REE API response data in the database
   */
  async storeREEData(
    apiResponse: REEApiResponse,
    balanceDate: Date,
  ): Promise<void> {
    try {
      // Validate that we have the minimum required data
      if (!apiResponse.data?.id || !apiResponse.data?.attributes?.title) {
        throw new Error("Invalid API response: missing required data fields");
      }

      const balanceRecord = await this._upsertPowerGridBalance(
        apiResponse,
        balanceDate,
      );
      const categories = this._filterValidCategories(
        apiResponse.included ?? [],
      );

      for (const categoryData of categories) {
        await this._upsertCategorySourcesAndValues(
          categoryData,
          balanceRecord.id,
        );
      }
    } catch (error) {
      console.error("Error storing REE data:", error);
      throw new DatabaseError(
        "Failed to store REE data in database",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Upserts a category, its sources, and their values.
   */
  private async _upsertCategorySourcesAndValues(
    categoryData: EnergyCategory,
    balanceId: string,
  ): Promise<void> {
    // Validate required fields before proceeding
    if (
      !categoryData.id ||
      !categoryData.type ||
      !categoryData.attributes?.title ||
      !categoryData.attributes?.["last-update"]
    ) {
      console.warn(
        "Skipping category with missing required fields:",
        categoryData.id,
      );
      return;
    }

    const category = await this.prisma.energyCategory.upsert({
      where: { categoryId: categoryData.id },
      update: {
        type: categoryData.type,
        title: categoryData.attributes.title,
        description: categoryData.attributes.description ?? null,
        lastUpdate: categoryData.attributes["last-update"],
        balanceId: balanceId,
      },
      create: {
        categoryId: categoryData.id,
        type: categoryData.type,
        title: categoryData.attributes.title,
        description: categoryData.attributes.description ?? null,
        lastUpdate: categoryData.attributes["last-update"],
        balanceId: balanceId,
      },
    });

    const sources = categoryData.attributes.content ?? [];
    for (const sourceData of sources) {
      if (
        sourceData.groupId &&
        sourceData.groupId === categoryData.id &&
        sourceData.id &&
        sourceData.type &&
        sourceData.attributes?.title &&
        sourceData.attributes?.["last-update"]
      ) {
        const sourcePayload = {
          groupId: sourceData.groupId,
          type: sourceData.type,
          title: sourceData.attributes.title,
          description: sourceData.attributes.description ?? null,
          color: sourceData.attributes.color ?? null,
          icon: sourceData.attributes.icon ?? null,
          magnitude: sourceData.attributes.magnitude ?? null,
          isComposite: sourceData.attributes.composite ?? false,
          lastUpdate: sourceData.attributes["last-update"],
          total: sourceData.attributes.total ?? 0,
          totalPercentage: sourceData.attributes["total-percentage"] ?? 0,
          categoryId: category.id,
        };

        const upsertedSource = await this.prisma.energySource.upsert({
          where: { sourceId: sourceData.id },
          update: sourcePayload,
          create: {
            sourceId: sourceData.id,
            ...sourcePayload,
          },
        });

        const values = sourceData.attributes.values ?? [];
        if (values.length > 0) {
          await this._upsertEnergyValues(values, upsertedSource.id);
        }
      }
    }
  }

  /**
   * Upserts the main power grid balance record.
   */
  private async _upsertPowerGridBalance(
    apiResponse: REEApiResponse,
    balanceDate: Date,
  ): Promise<PowerGridBalance> {
    const normalizedBalanceDate = startOfDay(balanceDate);

    // Validate required fields
    if (
      !apiResponse.data?.id ||
      !apiResponse.data?.attributes?.title ||
      !apiResponse.data?.attributes?.["last-update"]
    ) {
      throw new Error("Invalid API response: missing required balance data");
    }

    const balanceData = {
      type: apiResponse.data.type ?? "balance",
      title: apiResponse.data.attributes.title,
      description: apiResponse.data.attributes.description ?? null,
      lastUpdate: apiResponse.data.attributes["last-update"],
      cacheHit: apiResponse.data.meta?.["cache-control"]?.cache === "HIT",
      cacheExpireAt: apiResponse.data.meta?.["cache-control"]?.expireAt ?? null,
      updatedAt: new Date(),
    };

    return this.prisma.powerGridBalance.upsert({
      where: {
        balanceId_balanceDate: {
          balanceId: apiResponse.data.id,
          balanceDate: normalizedBalanceDate,
        },
      },
      update: balanceData,
      create: {
        balanceId: apiResponse.data.id,
        balanceDate: normalizedBalanceDate,
        ...balanceData,
      },
    });
  }

  /**
   * Filters valid energy categories from the API response.
   */
  private _filterValidCategories(
    included: REEApiResponse["included"],
  ): EnergyCategory[] {
    return included.filter((item): item is EnergyCategory => {
      // First check basic properties
      const hasBasicProperties =
        item.type &&
        ["Renovable", "No-Renovable", "Almacenamiento", "Demanda"].includes(
          item.type,
        ) &&
        item.id &&
        item.attributes &&
        item.attributes.title &&
        item.attributes["last-update"];

      if (!hasBasicProperties) {
        return false;
      }

      // Check if this item has the content property (which indicates it's a category)
      // Use type assertion to safely check for content property
      const hasContentProperty =
        item.attributes &&
        typeof item.attributes === "object" &&
        "content" in item.attributes;

      if (!hasContentProperty) {
        return false;
      }

      // Now we know content exists, check if it's an array
      const content = (item.attributes as { content: unknown }).content;
      return Array.isArray(content);
    });
  }

  /**
   * Upserts energy values for a source.
   */
  private async _upsertEnergyValues(
    values: EnergyValue[],
    sourceId: string,
  ): Promise<void> {
    // Filter out values with missing required fields
    const validValues = values.filter(
      (value) =>
        value.datetime &&
        value.value !== undefined &&
        value.percentage !== undefined,
    );

    const valueUpsertPromises = validValues.map((value) => {
      const valuePayload = {
        value: value.value!,
        percentage: value.percentage!,
      };
      return this.prisma.energyValue.upsert({
        where: {
          sourceId_datetime: {
            sourceId: sourceId,
            datetime: value.datetime!,
          },
        },
        update: valuePayload,
        create: {
          ...valuePayload,
          datetime: value.datetime!,
          sourceId: sourceId,
        },
      });
    });

    await Promise.all(valueUpsertPromises);
  }

  /**
   * Get electric balance data by date range
   */
  async getElectricBalanceByDateRange(startDate: Date, endDate: Date) {
    try {
      const balances = await this.prisma.powerGridBalance.findMany({
        where: {
          balanceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          energyCategories: {
            include: {
              energySources: {
                include: {
                  values: {
                    where: {
                      datetime: {
                        gte: startDate,
                        lte: endDate,
                      },
                    },
                    orderBy: {
                      datetime: "asc",
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          lastUpdate: "desc",
        },
      });

      return balances;
    } catch (error) {
      console.error("Error fetching electric balance data:", error);
      throw new DatabaseError(
        "Failed to fetch electric balance data",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Get the latest electric balance data
   */
  async getLatestElectricBalance() {
    try {
      return await this.prisma.powerGridBalance.findFirst({
        include: {
          energyCategories: {
            include: {
              energySources: {
                include: {
                  values: {
                    orderBy: {
                      datetime: "desc",
                    },
                    take: 50, // Limit to latest 50 values per source
                  },
                },
              },
            },
          },
        },
        orderBy: {
          lastUpdate: "desc",
        },
      });
    } catch (error) {
      console.error("Error fetching latest electric balance:", error);
      throw new DatabaseError(
        "Failed to fetch latest electric balance",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Get electric balance data for a specific date
   */
  async getElectricBalanceByDate(date: Date) {
    const startOfDate = startOfDay(date);
    const endOfDate = endOfDay(date);

    return this.getElectricBalanceByDateRange(startOfDate, endOfDate);
  }

  /**
   * Get energy sources by category and date range
   */
  async getEnergySourcesByCategory(
    categoryType: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const dateFilter =
        startDate && endDate
          ? {
              some: {
                datetime: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            }
          : undefined;

      return await this.prisma.energySource.findMany({
        where: {
          category: {
            type: categoryType,
          },
          values: dateFilter,
        },
        include: {
          values: {
            where: dateFilter?.some,
            orderBy: {
              datetime: "asc",
            },
          },
          category: true,
        },
        orderBy: {
          title: "asc",
        },
      });
    } catch (error) {
      console.error("Error fetching energy sources by category:", error);
      throw new DatabaseError(
        "Failed to fetch energy sources by category",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats() {
    try {
      const [balanceCount, categoryCount, sourceCount, valueCount] =
        await Promise.all([
          this.prisma.powerGridBalance.count(),
          this.prisma.energyCategory.count(),
          this.prisma.energySource.count(),
          this.prisma.energyValue.count(),
        ]);

      const latestBalance = await this.prisma.powerGridBalance.findFirst({
        orderBy: { lastUpdate: "desc" },
        select: { lastUpdate: true },
      });

      return {
        balanceCount,
        categoryCount,
        sourceCount,
        valueCount,
        latestUpdate: latestBalance?.lastUpdate,
      };
    } catch (error) {
      console.error("Error fetching summary stats:", error);
      throw new DatabaseError(
        "Failed to fetch summary statistics",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Clean up old data (optional, for data retention)
   */
  async cleanupOldData(daysToKeep: number = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.powerGridBalance.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up ${result.count} old balance records`);
      return result.count;
    } catch (error) {
      console.error("Error cleaning up old data:", error);
      throw new DatabaseError(
        "Failed to cleanup old data",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
