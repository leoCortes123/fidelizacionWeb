import { parseEconomicNumber } from "@/lib/format";
import type { BusinessEconomicProfile } from "@/types";

export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const DAY_LABELS: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};

export const DAY_PRESETS: Array<{ label: string; days: number[] }> = [
  { label: "Lun–Vie", days: [1, 2, 3, 4, 5] },
  { label: "Lun–Sáb", days: [1, 2, 3, 4, 5, 6] },
  { label: "Todos", days: [1, 2, 3, 4, 5, 6, 7] },
];

export const COMMON_TIMEZONES = [
  { value: "America/Bogota", label: "Bogotá (COT)" },
  { value: "America/Mexico_City", label: "Ciudad de México" },
  { value: "America/Lima", label: "Lima" },
  { value: "America/New_York", label: "Nueva York" },
];

export const TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Panama",
  "America/Caracas",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
];

/** Interpreta un entero admitiendo separadores de miles usados en es-CO (ej. "1.000"). */
export function parseProgramInteger(value: string): number {
  return parseEconomicNumber(value, "integer") ?? NaN;
}

/** Interpreta un decimal admitiendo coma o punto (ej. "2,5" o "2.5"). */
export function parseProgramDecimal(value: string): number {
  return parseEconomicNumber(value, "percent") ?? NaN;
}

/** Estima los días de operación al mes a partir de los días activos de la semana. */
export function estimateMonthlyOperationDays(operatingDays: number[]): number {
  const count = Math.min(7, Math.max(1, operatingDays.length));
  return Math.max(1, Math.min(31, Math.round((count / 7) * 30)));
}

export interface EconomicProfileSummary {
  dailySales: number | null;
  operationDays: number | null;
  effectiveGrossMargin: number | null;
  effectiveDailyGain: number | null;
  monthlySales: number | null;
  monthlyGain: number | null;
  dailyCustomers: number | null;
  avgTicket: number | null;
  configuredMaxBudget: number | null;
}

function positiveProfileField(
  profile: BusinessEconomicProfile | null,
  value: number | null | undefined,
  field: keyof NonNullable<BusinessEconomicProfile["data_status"]>,
): number | null {
  if (value == null || value <= 0) return null;
  if (profile?.data_status?.[field] === "unknown") return null;
  return value;
}

/** Normaliza los datos económicos del negocio y deriva métricas mensuales, margen y ticket promedio. */
export function analyzeEconomicProfile(
  profile: BusinessEconomicProfile | null,
): EconomicProfileSummary {
  const dailySales = positiveProfileField(profile, profile?.daily_avg_sales, "daily_avg_sales");
  const operationDays = positiveProfileField(
    profile,
    profile?.monthly_operation_days,
    "monthly_operation_days",
  );
  const rawDailyGain =
    profile?.daily_gain != null &&
    profile.daily_gain >= 0 &&
    profile?.data_status?.daily_gain !== "unknown"
      ? profile.daily_gain
      : null;
  const rawGrossMargin =
    profile?.gross_margin != null &&
    profile.gross_margin >= 0 &&
    profile.gross_margin <= 100 &&
    profile?.data_status?.gross_margin !== "unknown"
      ? profile.gross_margin
      : null;
  const dailyCustomers = positiveProfileField(
    profile,
    profile?.avg_customers_per_day,
    "avg_customers_per_day",
  );
  const configuredMaxBudget = positiveProfileField(
    profile,
    profile?.max_monthly_reward_budget,
    "max_monthly_reward_budget",
  );

  const monthlySales =
    dailySales !== null && operationDays !== null ? dailySales * operationDays : null;
  const effectiveGrossMargin =
    rawGrossMargin !== null
      ? rawGrossMargin
      : dailySales !== null && rawDailyGain !== null && rawDailyGain <= dailySales
        ? Math.round((rawDailyGain / dailySales) * 10000) / 100
        : null;
  const effectiveDailyGain =
    rawDailyGain !== null
      ? rawDailyGain
      : dailySales !== null && effectiveGrossMargin !== null
        ? Math.round(dailySales * (effectiveGrossMargin / 100))
        : null;
  const monthlyGain =
    effectiveDailyGain !== null && operationDays !== null
      ? effectiveDailyGain * operationDays
      : null;
  const avgTicket =
    dailySales !== null && dailyCustomers !== null ? Math.round(dailySales / dailyCustomers) : null;

  return {
    dailySales,
    operationDays,
    effectiveGrossMargin,
    effectiveDailyGain,
    monthlySales,
    monthlyGain,
    dailyCustomers,
    avgTicket,
    configuredMaxBudget,
  };
}

export interface ProgramEconomicsAnalysis {
  budgetRate: number;
  validCop: boolean;
  referenceBudget: number | null;
  maxBudget: number | null;
  effectiveProgramBudget: number | null;
  costPerPoint: number | null;
  pointsPerThousand: number;
  pointValueCop: number | null;
  pointsPer1000Spent: number | null;
  estimatedCostRate: number | null;
  examplePurchasePoints: number | null;
  exampleAvgTicketPoints: number | null;
  examplePurchaseCostCop: number | null;
  suggestedRateFromCap: number | null;
  utilityAbsorptionPct: string | null;
  netMarginAfterRewards: string | null;
}

/** Calcula equivalencias de loopoints, simulación en caja e impacto en utilidad/margen del programa. */
export function analyzeProgramEconomics({
  economic,
  copPerPoint,
  budgetRatePercent,
  explicitPointsPerThousand,
}: {
  economic: EconomicProfileSummary;
  copPerPoint: number;
  budgetRatePercent: number;
  explicitPointsPerThousand?: number;
}): ProgramEconomicsAnalysis {
  const budgetRate =
    Number.isFinite(budgetRatePercent) && budgetRatePercent >= 0 && budgetRatePercent <= 100
      ? Math.round(budgetRatePercent * 100) / 10000
      : NaN;
  const validCop = Number.isInteger(copPerPoint) && copPerPoint > 0;

  const referenceBudget =
    economic.monthlySales !== null && Number.isFinite(budgetRate)
      ? Math.floor(economic.monthlySales * budgetRate)
      : null;
  const maxBudget = economic.configuredMaxBudget ?? referenceBudget ?? null;
  const effectiveProgramBudget = referenceBudget ?? maxBudget;

  const costPerPoint =
    validCop && Number.isFinite(budgetRate) && budgetRate > 0 ? budgetRate * copPerPoint : null;
  const pointsPerThousand =
    costPerPoint !== null && costPerPoint > 0
      ? Math.max(1, Math.min(1_000_000, Math.round(1000 / costPerPoint)))
      : 100;

  const hasExplicitPoints =
    explicitPointsPerThousand !== undefined &&
    Number.isFinite(explicitPointsPerThousand) &&
    explicitPointsPerThousand > 0;

  const pointValueCop = hasExplicitPoints ? 1000 / explicitPointsPerThousand! : costPerPoint;
  const pointsPer1000Spent = validCop ? 1000 / copPerPoint : null;
  const estimatedCostRate =
    validCop && hasExplicitPoints
      ? 1000 / (copPerPoint * explicitPointsPerThousand!)
      : Number.isFinite(budgetRate)
        ? budgetRate
        : null;

  const examplePurchasePoints = validCop ? Math.floor(50000 / copPerPoint) : null;
  const exampleAvgTicketPoints =
    economic.avgTicket !== null && validCop ? Math.floor(economic.avgTicket / copPerPoint) : null;
  const examplePurchaseCostCop =
    examplePurchasePoints !== null && pointValueCop !== null
      ? Math.round(examplePurchasePoints * pointValueCop)
      : null;

  const suggestedRateFromCap =
    economic.monthlySales !== null &&
    economic.monthlySales > 0 &&
    economic.configuredMaxBudget !== null
      ? Math.min(
          100,
          Math.max(
            0.1,
            Math.round((economic.configuredMaxBudget / economic.monthlySales) * 10000) / 100,
          ),
        )
      : null;

  const utilityAbsorptionPct =
    economic.monthlyGain !== null && economic.monthlyGain > 0 && effectiveProgramBudget !== null
      ? ((effectiveProgramBudget / economic.monthlyGain) * 100).toFixed(1)
      : null;
  const netMarginAfterRewards =
    economic.effectiveGrossMargin !== null && Number.isFinite(budgetRate) && budgetRate >= 0
      ? Math.max(0, economic.effectiveGrossMargin - budgetRate * 100).toFixed(1)
      : null;

  return {
    budgetRate,
    validCop,
    referenceBudget,
    maxBudget,
    effectiveProgramBudget,
    costPerPoint,
    pointsPerThousand,
    pointValueCop,
    pointsPer1000Spent,
    estimatedCostRate,
    examplePurchasePoints,
    exampleAvgTicketPoints,
    examplePurchaseCostCop,
    suggestedRateFromCap,
    utilityAbsorptionPct,
    netMarginAfterRewards,
  };
}
