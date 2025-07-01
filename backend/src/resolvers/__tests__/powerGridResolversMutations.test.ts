import { describe, it, expect, vi } from "vitest";

// Mock schedulerService before importing resolver. Create stub inside factory, then retrieve it after import.
vi.mock("../../services/schedulerService.js", () => {
  return {
    schedulerService: {
      manualFetch: vi.fn(),
    },
  };
});

import { powerGridResolvers } from "../powerGridResolvers.js";
// Import mocked schedulerService to access spy instance
import { schedulerService } from "../../services/schedulerService.js";
const manualFetchMock = schedulerService.manualFetch as unknown as ReturnType<
  typeof vi.fn
>;

describe("powerGridResolvers Mutation.manualDataFetch", () => {
  it("returns success response when scheduler.manualFetch resolves", async () => {
    manualFetchMock.mockResolvedValue(undefined);

    const response =
      await powerGridResolvers.Mutation.manualDataFetch("current");

    expect(response).toMatchObject({
      success: true,
      message: expect.stringContaining("Successfully fetched current data"),
    });
  });

  it("handles errors from scheduler.manualFetch and returns failure response", async () => {
    manualFetchMock.mockRejectedValue(new Error("network failure"));

    const response =
      await powerGridResolvers.Mutation.manualDataFetch("current");

    expect(response.success).toBe(false);
    expect(response.message).toMatch(/Failed to fetch data: network failure/);
  });
});
