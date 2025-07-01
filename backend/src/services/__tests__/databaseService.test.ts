import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma client used inside DatabaseService before it is imported
vi.mock("../../../generated/prisma/client.js", () => {
  // Shared mock functions to assert they are called
  const powerGridBalanceMock = {
    count: vi.fn().mockResolvedValue(5),
    findFirst: vi
      .fn()
      .mockResolvedValue({ lastUpdate: new Date("2024-05-05T00:00:00Z") }),
    deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
  };

  const energyCategoryMock = { count: vi.fn().mockResolvedValue(10) };
  const energySourceMock = { count: vi.fn().mockResolvedValue(30) };
  const energyValueMock = { count: vi.fn().mockResolvedValue(300) };

  // Fake PrismaClient constructor
  const PrismaClient = vi.fn().mockImplementation(() => ({
    powerGridBalance: powerGridBalanceMock,
    energyCategory: energyCategoryMock,
    energySource: energySourceMock,
    energyValue: energyValueMock,
    $disconnect: vi.fn(),
  }));

  return { PrismaClient };
});

import { databaseService } from "../databaseService.js";

// Ensure environment variable does not break cleanupOldData logic
process.env.DATA_RETENTION_DAYS = "365";

describe("DatabaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct summary stats", async () => {
    const stats = await databaseService.getSummaryStats();
    expect(stats).toMatchObject({
      balanceCount: 5,
      categoryCount: 10,
      sourceCount: 30,
      valueCount: 300,
      latestUpdate: new Date("2024-05-05T00:00:00Z"),
    });
  });

  it("cleans up old data and returns deleted count", async () => {
    const deleted = await databaseService.cleanupOldData(365);
    expect(deleted).toBe(2);
  });
});
