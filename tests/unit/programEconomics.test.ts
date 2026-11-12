import { describe, expect, it } from "vitest";
import {
  analyzeEconomicProfile,
  analyzeProgramEconomics,
  estimateMonthlyOperationDays,
  parseProgramDecimal,
  parseProgramInteger,
} from "@/features/loyalty/programEconomics";
import { parseEconomicNumber } from "@/lib/format";
import type { BusinessEconomicProfile } from "@/types";

describe("programEconomics", () => {
  it("estima días de operación al mes según los días semanales activos", () => {
    expect(estimateMonthlyOperationDays([1, 2, 3, 4, 5])).toBe(21);
    expect(estimateMonthlyOperationDays([1, 2, 3, 4, 5, 6])).toBe(26);
    expect(estimateMonthlyOperationDays([1, 2, 3, 4, 5, 6, 7])).toBe(30);
  });

  it("interpreta números es-CO y rechaza miles mal agrupados como 1000.000", () => {
    expect(parseEconomicNumber("200.000", "cop")).toBe(200000);
    expect(parseEconomicNumber("1000.000", "cop")).toBeNull();
    expect(parseEconomicNumber("200,5", "integer")).toBe(200.5);
    expect(parseProgramInteger("1.500")).toBe(1500);
    expect(parseProgramDecimal("2,75")).toBe(2.75);
  });

  it("analiza el perfil económico respetando estados unknown y derivando margen/ticket", () => {
    const profile: BusinessEconomicProfile = {
      id: "eco-1",
      business_id: "biz-1",
      daily_avg_sales: 250000,
      monthly_operation_days: 26,
      daily_gain: 75000,
      gross_margin: null,
      avg_customers_per_day: 25,
      max_monthly_reward_budget: 130000,
      data_status: {
        daily_avg_sales: "confirmed",
        monthly_operation_days: "confirmed",
        daily_gain: "confirmed",
        gross_margin: "unknown",
        avg_customers_per_day: "estimated",
        max_monthly_reward_budget: "confirmed",
      },
      updated_by: "u-1",
      updated_at: "2026-10-01T00:00:00Z",
    };

    const summary = analyzeEconomicProfile(profile);
    expect(summary.monthlySales).toBe(6_500_000);
    expect(summary.effectiveGrossMargin).toBe(30);
    expect(summary.monthlyGain).toBe(1_950_000);
    expect(summary.avgTicket).toBe(10_000);

    const program = analyzeProgramEconomics({
      economic: summary,
      copPerPoint: 1000,
      budgetRatePercent: 2,
    });
    expect(program.referenceBudget).toBe(130_000);
    expect(program.suggestedRateFromCap).toBe(2);
    expect(program.pointsPerThousand).toBe(50);
    expect(program.utilityAbsorptionPct).toBe("6.7");
    expect(program.netMarginAfterRewards).toBe("28.0");
  });
});
