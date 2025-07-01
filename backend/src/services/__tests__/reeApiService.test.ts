import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @better-fetch/fetch to observe calls and simulate responses
vi.mock("@better-fetch/fetch", () => {
  return {
    betterFetch: vi.fn(),
  };
});

import { betterFetch } from "@better-fetch/fetch";
import { reeApiService } from "../reeApiService.js";
import { format } from "date-fns";

// Cast to spy for TypeScript convenience
const betterFetchSpy = betterFetch as unknown as ReturnType<typeof vi.fn>;

describe("REEApiService", () => {
  beforeEach(() => {
    betterFetchSpy.mockReset();
  });

  it("builds correct URL and passes it to fetch", async () => {
    const start = new Date("2023-01-01T00:00:00Z");
    const end = new Date("2023-01-02T00:00:00Z");

    // Make fetch resolve successfully
    betterFetchSpy.mockResolvedValue({
      data: { data: {}, included: [] },
      error: undefined,
    });

    await reeApiService.fetchElectricBalance(start, end, "day");

    expect(betterFetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = betterFetchSpy.mock.calls[0][0] as string;

    const expectedStart = format(start, "yyyy-MM-dd'T'HH:mm");
    const expectedEnd = format(end, "yyyy-MM-dd'T'HH:mm");

    expect(calledUrl).toBe(
      `https://apidatos.ree.es/es/datos/balance/balance-electrico?start_date=${expectedStart}&end_date=${expectedEnd}&time_trunc=day`
    );
  });

  it("retries up to maxRetries and then throws on persistent errors", async () => {
    // Always return error
    betterFetchSpy.mockResolvedValue({
      data: undefined,
      error: { message: "fail" },
    });

    const start = new Date("2023-01-01T00:00:00Z");
    const end = new Date("2023-01-01T01:00:00Z");

    await expect(
      reeApiService.fetchElectricBalance(start, end, "day")
    ).rejects.toThrow(/Failed to fetch data after/);

    // Should have attempted 3 times (maxRetries)
    expect(betterFetchSpy).toHaveBeenCalledTimes(3);
  });
});
