import { describe, it, expect, vi } from "vitest";

// Mock the services used by the resolver so that no real DB/API work is performed
vi.mock("../../services/databaseService.js", () => ({
  databaseService: {
    getSummaryStats: vi.fn().mockResolvedValue({
      balanceCount: 10,
      categoryCount: 40,
      sourceCount: 100,
      valueCount: 1000,
      latestUpdate: new Date("2023-01-01T00:00:00Z"),
    }),
  },
}));

vi.mock("../../services/schedulerService.js", () => ({
  schedulerService: {
    getStatus: vi.fn().mockReturnValue({ isRunning: true, jobCount: 4 }),
  },
}));

import { powerGridResolvers } from "../powerGridResolvers.js";

describe("powerGridResolvers", () => {
  describe("Query.electricBalanceByDateRange validation", () => {
    it("throws if startDate is not a valid ISO date", async () => {
      await expect(
        powerGridResolvers.Query.electricBalanceByDateRange(
          "not-a-date",
          "2023-01-01"
        )
      ).rejects.toThrow(/Invalid date format/);
    });

    it("throws if endDate is not a valid ISO date", async () => {
      await expect(
        powerGridResolvers.Query.electricBalanceByDateRange(
          "2023-01-01",
          "bad-date"
        )
      ).rejects.toThrow(/Invalid date format/);
    });

    it("throws if startDate comes after endDate", async () => {
      await expect(
        powerGridResolvers.Query.electricBalanceByDateRange(
          "2023-02-01",
          "2023-01-01"
        )
      ).rejects.toThrow(/Start date must be before end date/);
    });

    it("throws if date range exceeds 365 days", async () => {
      await expect(
        powerGridResolvers.Query.electricBalanceByDateRange(
          "2020-01-01",
          "2021-12-31"
        )
      ).rejects.toThrow(/Date range cannot exceed 365 days/);
    });
  });

  describe("Query.summaryStats", () => {
    it("returns aggregated stats together with scheduler status", async () => {
      const result = await powerGridResolvers.Query.summaryStats();
      expect(result).toMatchObject({
        balanceCount: 10,
        categoryCount: 40,
        sourceCount: 100,
        valueCount: 1000,
        scheduler: { isRunning: true, jobCount: 4 },
      });
    });
  });
});
