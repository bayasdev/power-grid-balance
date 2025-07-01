import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies so that no real cron jobs or API/database calls are executed
vi.mock("node-cron", () => {
  const schedule = vi.fn().mockReturnValue({
    start: vi.fn(),
    stop: vi.fn(),
  });
  return { default: { schedule } };
});

vi.mock("../reeApiService.js", () => ({
  reeApiService: {
    fetchDateData: vi.fn().mockResolvedValue({ data: {}, included: [] }),
  },
  REEApiError: class REEApiError extends Error {},
}));

vi.mock("../databaseService.js", () => ({
  databaseService: {
    storeREEData: vi.fn().mockResolvedValue(undefined),
    cleanupOldData: vi.fn().mockResolvedValue(0),
  },
  DatabaseError: class DatabaseError extends Error {},
}));

import { SchedulerService } from "../schedulerService.js";

describe("SchedulerService", () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
    scheduler = new SchedulerService();
  });

  it("starts and stops scheduled jobs correctly", () => {
    // Start scheduler
    scheduler.start();
    const runningStatus = scheduler.getStatus();
    expect(runningStatus.isRunning).toBe(true);
    expect(runningStatus.jobCount).toBeGreaterThan(0);

    // Stop scheduler
    scheduler.stop();
    const stoppedStatus = scheduler.getStatus();
    expect(stoppedStatus.isRunning).toBe(false);
    expect(stoppedStatus.jobCount).toBe(0);
  });
});
