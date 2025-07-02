import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDateRange } from "../usePowerGridData";

describe("usePowerGridData hooks", () => {
  describe("useDateRange", () => {
    it("should initialize with default days", () => {
      const { result } = renderHook(() => useDateRange(7));

      expect(result.current.dateRange.startDate).toBeInstanceOf(Date);
      expect(result.current.dateRange.endDate).toBeInstanceOf(Date);

      const daysDiff = Math.floor(
        (result.current.dateRange.endDate.getTime() -
          result.current.dateRange.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(7);
    });

    it("should update date range", () => {
      const { result } = renderHook(() => useDateRange(7));

      const newStartDate = new Date("2024-01-01");
      act(() => {
        result.current.updateDateRange({ startDate: newStartDate });
      });

      expect(result.current.dateRange.startDate).toEqual(newStartDate);
    });

    it("should set preset range", () => {
      const { result } = renderHook(() => useDateRange(7));

      act(() => {
        result.current.setPresetRange(30);
      });

      const daysDiff = Math.floor(
        (result.current.dateRange.endDate.getTime() -
          result.current.dateRange.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(30);
    });

    it("should handle edge case with 0 days", () => {
      const { result } = renderHook(() => useDateRange(0));

      const daysDiff = Math.floor(
        (result.current.dateRange.endDate.getTime() -
          result.current.dateRange.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(0);
    });

    it("should update only specified properties", () => {
      const { result } = renderHook(() => useDateRange(7));

      const originalEndDate = result.current.dateRange.endDate;
      const newStartDate = new Date("2024-01-01");

      act(() => {
        result.current.updateDateRange({ startDate: newStartDate });
      });

      expect(result.current.dateRange.startDate).toEqual(newStartDate);
      expect(result.current.dateRange.endDate).toEqual(originalEndDate);
    });
  });
});
