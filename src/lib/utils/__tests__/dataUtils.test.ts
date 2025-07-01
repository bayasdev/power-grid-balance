import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatEnergyValue,
  formatPercentage,
  getSourceColor,
  getCategoryColor,
  processBalanceDataForChart,
  processBalanceDataForTotals,
  calculateCategoryTotals,
} from "../dataUtils";
import type { PowerGridBalance, EnergySource } from "../../types";

describe("dataUtils", () => {
  describe("formatDate", () => {
    it("should format ISO date string correctly", () => {
      const result = formatDate("2024-01-15T10:30:00Z");
      expect(result).toBe("15/01/2024");
    });

    it("should use custom format string", () => {
      const result = formatDate("2024-01-15T10:30:00Z", "yyyy-MM-dd");
      expect(result).toBe("2024-01-15");
    });

    it("should return original string on invalid date", () => {
      const result = formatDate("invalid-date");
      expect(result).toBe("invalid-date");
    });
  });

  describe("formatDateTime", () => {
    it("should format ISO datetime string correctly", () => {
      const result = formatDateTime("2024-01-15T10:30:00Z");
      // The result will depend on the local timezone, so let's just check the format
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      expect(result).toContain("15/01/2024");
    });

    it("should return original string on invalid datetime", () => {
      const result = formatDateTime("invalid-datetime");
      expect(result).toBe("invalid-datetime");
    });
  });

  describe("formatEnergyValue", () => {
    it("should format small values with default units", () => {
      const result = formatEnergyValue(150.5);
      expect(result).toBe("150.50 MWh");
    });

    it("should format large values in TWh", () => {
      const result = formatEnergyValue(2500000);
      expect(result).toBe("2.50 TMWh");
    });

    it("should format medium values in GWh", () => {
      const result = formatEnergyValue(1500);
      expect(result).toBe("1.50 GMWh");
    });

    it("should use custom magnitude", () => {
      const result = formatEnergyValue(100, "kWh");
      expect(result).toBe("100.00 kWh");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage with one decimal", () => {
      const result = formatPercentage(45.678);
      expect(result).toBe("45.7%");
    });

    it("should handle zero", () => {
      const result = formatPercentage(0);
      expect(result).toBe("0.0%");
    });
  });

  describe("getSourceColor", () => {
    it("should return source color if provided", () => {
      const source: EnergySource = {
        id: "1",
        sourceId: "solar",
        groupId: "renewable",
        type: "solar",
        title: "Solar",
        color: "#ff0000",
        isComposite: false,
        total: 100,
        totalPercentage: 50,
        values: [],
      };
      const result = getSourceColor(source, 0);
      expect(result).toBe("#ff0000");
    });

    it("should return default color if no source color", () => {
      const source: EnergySource = {
        id: "1",
        sourceId: "solar",
        groupId: "renewable",
        type: "solar",
        title: "Solar",
        isComposite: false,
        total: 100,
        totalPercentage: 50,
        values: [],
      };
      const result = getSourceColor(source, 0);
      expect(result).toBe("#8884d8");
    });

    it("should cycle through default colors", () => {
      const source: EnergySource = {
        id: "1",
        sourceId: "solar",
        groupId: "renewable",
        type: "solar",
        title: "Solar",
        isComposite: false,
        total: 100,
        totalPercentage: 50,
        values: [],
      };
      const result = getSourceColor(source, 10);
      expect(result).toBe("#8884d8"); // Should wrap around
    });
  });

  describe("getCategoryColor", () => {
    it("should return correct color for Renovable", () => {
      const result = getCategoryColor("Renovable");
      expect(result).toBe("#22c55e");
    });

    it("should return correct color for No-Renovable", () => {
      const result = getCategoryColor("No-Renovable");
      expect(result).toBe("#ef4444");
    });

    it("should return default color for unknown category", () => {
      const result = getCategoryColor("Unknown");
      expect(result).toBe("#6b7280");
    });
  });

  describe("processBalanceDataForChart", () => {
    it("should process balance data correctly", () => {
      const mockBalance: PowerGridBalance = {
        id: "1",
        balanceId: "balance-1",
        balanceDate: "2024-01-15",
        type: "daily",
        title: "Daily Balance",
        lastUpdate: "2024-01-15T10:00:00Z",
        energyCategories: [
          {
            id: "cat-1",
            categoryId: "renewable",
            type: "Renovable",
            title: "Energía Renovable",
            lastUpdate: "2024-01-15T10:00:00Z",
            energySources: [
              {
                id: "src-1",
                sourceId: "solar",
                groupId: "renewable",
                type: "solar",
                title: "Solar",
                isComposite: false,
                total: 100,
                totalPercentage: 50,
                values: [
                  {
                    id: "val-1",
                    datetime: "2024-01-15T10:00:00Z",
                    value: 100,
                    percentage: 50,
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = processBalanceDataForChart([mockBalance]);
      expect(result).toHaveLength(1);
      expect(result[0].categoryType).toBe("Renovable");
      expect(result[0].data).toHaveLength(1);
      expect(result[0].data[0].value).toBe(100);
    });
  });

  describe("processBalanceDataForTotals", () => {
    it("should process totals correctly", () => {
      const mockBalance: PowerGridBalance = {
        id: "1",
        balanceId: "balance-1",
        balanceDate: "2024-01-15",
        type: "daily",
        title: "Daily Balance",
        lastUpdate: "2024-01-15T10:00:00Z",
        energyCategories: [
          {
            id: "cat-1",
            categoryId: "renewable",
            type: "Renovable",
            title: "Energía Renovable",
            lastUpdate: "2024-01-15T10:00:00Z",
            energySources: [
              {
                id: "src-1",
                sourceId: "solar",
                groupId: "renewable",
                type: "solar",
                title: "Solar",
                isComposite: false,
                total: 100,
                totalPercentage: 50,
                values: [],
              },
              {
                id: "src-2",
                sourceId: "wind",
                groupId: "renewable",
                type: "wind",
                title: "Eólica",
                isComposite: false,
                total: 80,
                totalPercentage: 40,
                values: [],
              },
            ],
          },
        ],
      };

      const result = processBalanceDataForTotals([mockBalance]);
      expect(result).toHaveLength(2);
      expect(result[0].total).toBe(100); // Should be sorted by total desc
      expect(result[1].total).toBe(80);
    });
  });

  describe("calculateCategoryTotals", () => {
    it("should calculate category totals correctly", () => {
      const mockBalance: PowerGridBalance = {
        id: "1",
        balanceId: "balance-1",
        balanceDate: "2024-01-15",
        type: "daily",
        title: "Daily Balance",
        lastUpdate: "2024-01-15T10:00:00Z",
        energyCategories: [
          {
            id: "cat-1",
            categoryId: "renewable",
            type: "Renovable",
            title: "Energía Renovable",
            lastUpdate: "2024-01-15T10:00:00Z",
            energySources: [
              {
                id: "src-1",
                sourceId: "solar",
                groupId: "renewable",
                type: "solar",
                title: "Solar",
                isComposite: false,
                total: 100,
                totalPercentage: 50,
                values: [],
              },
              {
                id: "src-2",
                sourceId: "wind",
                groupId: "renewable",
                type: "wind",
                title: "Eólica",
                isComposite: false,
                total: 80,
                totalPercentage: 40,
                values: [],
              },
            ],
          },
          {
            id: "cat-2",
            categoryId: "nonrenewable",
            type: "No-Renovable",
            title: "Energía No Renovable",
            lastUpdate: "2024-01-15T10:00:00Z",
            energySources: [
              {
                id: "src-3",
                sourceId: "gas",
                groupId: "nonrenewable",
                type: "gas",
                title: "Gas Natural",
                isComposite: false,
                total: 120,
                totalPercentage: 60,
                values: [],
              },
            ],
          },
        ],
      };

      const result = calculateCategoryTotals([mockBalance]);
      expect(result["Renovable"]).toBe(180);
      expect(result["No-Renovable"]).toBe(120);
    });
  });
});
