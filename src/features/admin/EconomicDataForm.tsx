import { useEffect, useState } from "react";
import { Calculator, CircleDollarSign, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUpsertEconomicProfile } from "@/features/loyalty/hooks";
import { analyzeEconomicProfile } from "@/features/loyalty/programEconomics";
import { errorMessage } from "@/lib/errors";
import { formatCOP, formatNumber, parseEconomicNumber } from "@/lib/format";
import { useFormDraft } from "@/lib/useFormDraft";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessEconomicProfile, EconomicDataStatus, EconomicField } from "@/types";

export { parseEconomicNumber } from "@/lib/format";

export interface EconomicFieldConfig {
  field: EconomicField;
  label: string;
  hint: string;
  placeholder?: string;
  kind: "cop" | "integer" | "percent";
  min: number;
  max: number;
}

export const ECONOMIC_FIELDS: EconomicFieldConfig[] = [
  {
    field: "daily_avg_sales",
    label: "Ventas diarias promedio",
    hint: "Total que vendes en un día normal (en pesos COP, antes de descontar costos o gastos).",
    placeholder: "Ej. 350.000",
    kind: "cop",
    min: 0,
    max: 1_000_000_000,
  },
  {
    field: "monthly_operation_days",
    label: "Días de operación al mes",
    hint: "Cantidad de días al mes que abre tu negocio (1 a 31). Sirve para proyectar tus ventas mensuales.",
    placeholder: "Ej. 26",
    kind: "integer",
    min: 1,
    max: 31,
  },
  {
    field: "daily_gain",
    label: "Ganancia diaria",
    hint: "Utilidad aproximada que te queda en un día normal tras cubrir el costo de productos o insumos.",
    placeholder: "Ej. 105.000",
    kind: "cop",
    min: 0,
    max: 1_000_000_000,
  },
  {
    field: "gross_margin",
    label: "Margen bruto",
    hint: "Porcentaje de cada venta que es ganancia (0 a 100 %). Se calcula automáticamente si ingresas ventas y ganancia diarias.",
    placeholder: "Ej. 30",
    kind: "percent",
    min: 0,
    max: 100,
  },
  {
    field: "avg_customers_per_day",
    label: "Clientes por día",
    hint: "Número aproximado de compras o clientes atendidos al día. Ayuda a calcular el ticket promedio.",
    placeholder: "Ej. 40",
    kind: "integer",
    min: 0,
    max: 1_000_000,
  },
  {
    field: "max_monthly_reward_budget",
    label: "Presupuesto mensual de recompensas",
    hint: "Tope máximo en COP que deseas entregar en premios al mes para cuidar tu utilidad.",
    placeholder: "Ej. 150.000",
    kind: "cop",
    min: 0,
    max: 1_000_000_000,
  },
];

export type EconomicFormValues = Record<EconomicField, string>;
export type EconomicStatusMap = Record<EconomicField, EconomicDataStatus>;
type ErrorMap = Partial<Record<EconomicField, string>>;

export const ECONOMIC_STATUS_OPTIONS: Array<{
  value: EconomicDataStatus;
  label: string;
}> = [
  { value: "confirmed", label: "Confirmado" },
  { value: "estimated", label: "Estimado" },
  { value: "unknown", label: "Desconocido" },
];

export const ECONOMIC_STATUS_LABEL: Record<EconomicDataStatus, string> = {
  confirmed: "Confirmado",
  estimated: "Estimado",
  unknown: "Desconocido",
};

export const ECONOMIC_STATUS_VARIANT: Record<EconomicDataStatus, "success" | "warning" | "muted"> =
  {
    confirmed: "success",
    estimated: "warning",
    unknown: "muted",
  };

export function deriveAutoEconomicStatus(
  value: string,
  kind: EconomicFieldConfig["kind"],
): EconomicDataStatus {
  if (!value.trim()) return "unknown";
  const parsed = parseEconomicNumber(value, kind);
  return parsed === 0 ? "unknown" : "confirmed";
}

export function isEconomicProfileEmpty(profile: BusinessEconomicProfile | null): boolean {
  if (!profile) return true;
  if (Object.keys(profile.data_status ?? {}).length > 0 || Boolean(profile.updated_at)) {
    return false;
  }
  return (
    profile.daily_avg_sales == null &&
    profile.monthly_operation_days == null &&
    profile.daily_gain == null &&
    profile.gross_margin == null &&
    profile.avg_customers_per_day == null &&
    profile.max_monthly_reward_budget == null
  );
}

function formatPercentValue(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function buildEconomicInitial(
  profile: BusinessEconomicProfile | null,
  autoStatus = false,
  suggestedOperationDays?: number,
): {
  values: EconomicFormValues;
  status: EconomicStatusMap;
  autoComputed: EconomicField[];
} {
  const values = {} as EconomicFormValues;
  const status = {} as EconomicStatusMap;
  const autoComputed: EconomicField[] = [];
  const canSuggestDays =
    isEconomicProfileEmpty(profile) &&
    suggestedOperationDays !== undefined &&
    Number.isInteger(suggestedOperationDays) &&
    suggestedOperationDays >= 1 &&
    suggestedOperationDays <= 31;

  for (const { field, kind } of ECONOMIC_FIELDS) {
    const raw = profile?.[field] ?? null;
    if (field === "monthly_operation_days" && raw === null && canSuggestDays) {
      values[field] = String(suggestedOperationDays);
      status[field] = autoStatus ? deriveAutoEconomicStatus(values[field], kind) : "estimated";
      autoComputed.push("monthly_operation_days");
      continue;
    }

    if (autoStatus) {
      values[field] = raw === null || raw === 0 ? "" : String(raw);
      status[field] = deriveAutoEconomicStatus(values[field], kind);
      continue;
    }

    values[field] = raw === null ? "" : String(raw);
    const stored = profile?.data_status?.[field];
    status[field] =
      stored === "confirmed" || stored === "estimated" || stored === "unknown"
        ? stored
        : raw === null
          ? "unknown"
          : "estimated";
  }

  return { values, status, autoComputed };
}

function validateEconomicEntry(
  config: EconomicFieldConfig,
  rawValue: string,
  autoStatus: boolean,
): { parsed: number | null; error: string | null } {
  const parsed = parseEconomicNumber(rawValue, config.kind);
  if (parsed === null) {
    return {
      parsed: null,
      error: autoStatus
        ? "Introduce un número válido o déjalo vacío."
        : "Introduce un valor o marca «Desconocido».",
    };
  }
  if (config.kind !== "percent" && !Number.isInteger(parsed)) {
    return { parsed: null, error: "Debe ser un número entero." };
  }
  if (parsed < config.min || parsed > config.max) {
    return {
      parsed: null,
      error:
        config.kind === "percent"
          ? `Debe estar entre ${config.min} y ${config.max}.`
          : `Debe estar entre ${formatNumber(config.min)} y ${formatNumber(config.max)}.`,
    };
  }
  return { parsed, error: null };
}

interface EconomicDraftState {
  values: EconomicFormValues;
  status: EconomicStatusMap;
  autoComputed: EconomicField[];
}

function normalizeAutoFields(fields: unknown): Set<EconomicField> {
  if (!Array.isArray(fields)) return new Set();
  const allowed = new Set<EconomicField>(ECONOMIC_FIELDS.map((item) => item.field));
  return new Set(
    fields.filter((item): item is EconomicField => allowed.has(item as EconomicField)),
  );
}

export function EconomicDataForm({
  businessId,
  profile,
  title = "Datos del negocio",
  intro = "Todos estos datos son opcionales: si no los tienes a la mano, déjalos sin dato o marca «Desconocido». Sin embargo, proporcionarlos ayuda a calcular el análisis financiero y sugerir recompensas rentables.",
  submitLabel = "Guardar datos económicos",
  autoStatus = false,
  suggestedOperationDays,
  draftKey,
  onSaved,
}: {
  businessId: string;
  profile: BusinessEconomicProfile | null;
  title?: string;
  intro?: string;
  submitLabel?: string;
  autoStatus?: boolean;
  suggestedOperationDays?: number;
  draftKey?: string;
  onSaved?: () => void;
}) {
  const draft = useFormDraft<EconomicDraftState>({
    key: draftKey ?? `economic:${businessId}`,
    enabled: Boolean(draftKey),
  });
  const [initial] = useState(() =>
    buildEconomicInitial(profile, autoStatus, suggestedOperationDays),
  );
  const [restoredDraft] = useState(() => draft.read());
  const [values, setValues] = useState<EconomicFormValues>(() =>
    restoredDraft?.values ? { ...initial.values, ...restoredDraft.values } : initial.values,
  );
  const [status, setStatus] = useState<EconomicStatusMap>(() =>
    restoredDraft?.status ? { ...initial.status, ...restoredDraft.status } : initial.status,
  );
  const [autoComputed, setAutoComputed] = useState<Set<EconomicField>>(() =>
    restoredDraft ? normalizeAutoFields(restoredDraft.autoComputed) : new Set(initial.autoComputed),
  );
  const [dirty, setDirty] = useState(() => Boolean(restoredDraft));
  const [errors, setErrors] = useState<ErrorMap>({});
  const upsert = useUpsertEconomicProfile();

  useEffect(() => {
    if (dirty && draftKey) {
      draft.save({
        values,
        status,
        autoComputed: [...autoComputed],
      });
    }
  }, [autoComputed, dirty, draft.save, draftKey, status, values]);

  function getFieldStatus(
    config: EconomicFieldConfig,
    rawValue = values[config.field],
  ): EconomicDataStatus {
    return autoStatus ? deriveAutoEconomicStatus(rawValue, config.kind) : status[config.field];
  }

  function applyAutoStatusForDerived(
    currentStatus: EconomicStatusMap,
    field: EconomicField,
    hasValue: boolean,
  ): EconomicStatusMap {
    if (autoStatus) return currentStatus;
    if (hasValue && (currentStatus[field] === "unknown" || currentStatus[field] === "confirmed")) {
      return { ...currentStatus, [field]: "estimated" };
    }
    if (!hasValue && currentStatus[field] !== "unknown") {
      return { ...currentStatus, [field]: "unknown" };
    }
    return currentStatus;
  }

  function updateValue(field: EconomicField, value: string) {
    setDirty(true);
    const nextValues: EconomicFormValues = { ...values, [field]: value };
    const nextAuto = new Set(autoComputed);
    nextAuto.delete(field);
    let nextStatus: EconomicStatusMap =
      !autoStatus && status[field] === "unknown" && value.trim() !== ""
        ? { ...status, [field]: "estimated" }
        : { ...status };

    const sales = parseEconomicNumber(nextValues.daily_avg_sales, "cop");
    const gain = parseEconomicNumber(nextValues.daily_gain, "cop");
    const margin = parseEconomicNumber(nextValues.gross_margin, "percent");

    if (field === "daily_avg_sales" || field === "daily_gain") {
      if (field === "daily_avg_sales" && nextAuto.has("daily_gain")) {
        if (sales !== null && sales > 0 && margin !== null && margin >= 0 && margin <= 100) {
          nextValues.daily_gain = String(Math.round(sales * (margin / 100)));
          nextStatus = applyAutoStatusForDerived(nextStatus, "daily_gain", true);
        } else {
          nextValues.daily_gain = "";
          nextStatus = applyAutoStatusForDerived(nextStatus, "daily_gain", false);
        }
      } else {
        const canComputeMargin =
          sales !== null && sales > 0 && gain !== null && gain >= 0 && gain <= sales;
        if (canComputeMargin) {
          if (nextValues.gross_margin.trim() === "" || nextAuto.has("gross_margin")) {
            nextValues.gross_margin = formatPercentValue((gain / sales) * 100);
            nextAuto.add("gross_margin");
            nextStatus = applyAutoStatusForDerived(nextStatus, "gross_margin", true);
          }
        } else if (nextAuto.has("gross_margin")) {
          nextValues.gross_margin = "";
          nextAuto.delete("gross_margin");
          nextStatus = applyAutoStatusForDerived(nextStatus, "gross_margin", false);
        }
      }
    } else if (field === "gross_margin") {
      const canComputeGain =
        sales !== null && sales > 0 && margin !== null && margin >= 0 && margin <= 100;
      if (canComputeGain) {
        if (nextValues.daily_gain.trim() === "" || nextAuto.has("daily_gain")) {
          nextValues.daily_gain = String(Math.round(sales * (margin / 100)));
          nextAuto.add("daily_gain");
          nextStatus = applyAutoStatusForDerived(nextStatus, "daily_gain", true);
        }
      } else if (nextAuto.has("daily_gain")) {
        nextValues.daily_gain = "";
        nextAuto.delete("daily_gain");
        nextStatus = applyAutoStatusForDerived(nextStatus, "daily_gain", false);
      }
    }

    setValues(nextValues);
    setAutoComputed(nextAuto);
    setStatus(nextStatus);
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      gross_margin: nextAuto.has("gross_margin") ? undefined : current.gross_margin,
      daily_gain: nextAuto.has("daily_gain") ? undefined : current.daily_gain,
    }));
  }

  function updateStatus(field: EconomicField, next: EconomicDataStatus) {
    setDirty(true);
    setStatus((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (next === "unknown") {
      updateValue(field, "");
      setStatus((current) => ({ ...current, [field]: "unknown" }));
    }
  }

  function recalculateGrossMargin() {
    const sales = parseEconomicNumber(values.daily_avg_sales, "cop");
    const gain = parseEconomicNumber(values.daily_gain, "cop");
    if (sales === null || sales <= 0 || gain === null || gain < 0 || gain > sales) return;
    const computed = formatPercentValue((gain / sales) * 100);
    setDirty(true);
    setValues((current) => ({ ...current, gross_margin: computed }));
    setAutoComputed((current) => new Set(current).add("gross_margin"));
    if (!autoStatus && (status.gross_margin === "unknown" || status.gross_margin === "confirmed")) {
      setStatus((current) => ({ ...current, gross_margin: "estimated" }));
    }
    setErrors((current) => ({ ...current, gross_margin: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: ErrorMap = {};
    const payload = {
      businessId,
      dailyAvgSales: null as number | null,
      monthlyOperationDays: null as number | null,
      dailyGain: null as number | null,
      grossMargin: null as number | null,
      avgCustomersPerDay: null as number | null,
      maxMonthlyRewardBudget: null as number | null,
      dataStatus: { ...status } as EconomicStatusMap,
    };

    for (const config of ECONOMIC_FIELDS) {
      const currentStatus = getFieldStatus(config);
      payload.dataStatus[config.field] = currentStatus;
      if (currentStatus === "unknown") {
        continue;
      }

      const { parsed, error } = validateEconomicEntry(config, values[config.field], autoStatus);
      if (error || parsed === null) {
        nextErrors[config.field] = error ?? "Introduce un número válido.";
        continue;
      }

      switch (config.field) {
        case "daily_avg_sales":
          payload.dailyAvgSales = parsed;
          break;
        case "monthly_operation_days":
          payload.monthlyOperationDays = parsed;
          break;
        case "daily_gain":
          payload.dailyGain = parsed;
          break;
        case "gross_margin":
          payload.grossMargin = parsed;
          break;
        case "avg_customers_per_day":
          payload.avgCustomersPerDay = parsed;
          break;
        case "max_monthly_reward_budget":
          payload.maxMonthlyRewardBudget = parsed;
          break;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Revisa los datos marcados.");
      const firstInvalid = ECONOMIC_FIELDS.find((item) => nextErrors[item.field]);
      if (firstInvalid) {
        window.requestAnimationFrame(() => {
          document.getElementById(`economic-${firstInvalid.field}`)?.focus();
        });
      }
      return;
    }

    try {
      await upsert.mutateAsync(payload);
      setDirty(false);
      draft.clear();
      toast.success("Datos económicos guardados");
      onSaved?.();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const parsedSales = parseEconomicNumber(values.daily_avg_sales, "cop");
  const parsedDays = parseEconomicNumber(values.monthly_operation_days, "integer");
  const parsedGain = parseEconomicNumber(values.daily_gain, "cop");
  const parsedMargin = parseEconomicNumber(values.gross_margin, "percent");
  const parsedCustomers = parseEconomicNumber(values.avg_customers_per_day, "integer");
  const parsedBudget = parseEconomicNumber(values.max_monthly_reward_budget, "cop");

  const validSales =
    parsedSales !== null && Number.isInteger(parsedSales) && parsedSales > 0 ? parsedSales : null;
  const validDays =
    parsedDays !== null && Number.isInteger(parsedDays) && parsedDays >= 1 && parsedDays <= 31
      ? parsedDays
      : null;
  const validGain =
    parsedGain !== null && Number.isInteger(parsedGain) && parsedGain >= 0 ? parsedGain : null;
  const validMargin =
    parsedMargin !== null && parsedMargin >= 0 && parsedMargin <= 100 ? parsedMargin : null;
  const validCustomers =
    parsedCustomers !== null && Number.isInteger(parsedCustomers) && parsedCustomers > 0
      ? parsedCustomers
      : null;
  const validBudget =
    parsedBudget !== null && Number.isInteger(parsedBudget) && parsedBudget > 0
      ? parsedBudget
      : null;

  const expectedComputedMargin =
    validSales !== null && validGain !== null && validGain <= validSales
      ? formatPercentValue((validGain / validSales) * 100)
      : null;
  const canRecalculateMargin =
    expectedComputedMargin !== null &&
    !autoComputed.has("gross_margin") &&
    values.gross_margin.trim() !== expectedComputedMargin;
  const gainExceedsSales = validSales !== null && validGain !== null && validGain > validSales;

  const liveEconomic = analyzeEconomicProfile({
    id: profile?.id ?? "",
    business_id: businessId,
    daily_avg_sales: validSales,
    monthly_operation_days: validDays,
    daily_gain: validGain,
    gross_margin: validMargin,
    avg_customers_per_day: validCustomers,
    max_monthly_reward_budget: validBudget,
    data_status: {
      daily_avg_sales: validSales !== null ? "confirmed" : "unknown",
      monthly_operation_days: validDays !== null ? "confirmed" : "unknown",
      daily_gain: validGain !== null ? "confirmed" : "unknown",
      gross_margin: validMargin !== null ? "confirmed" : "unknown",
      avg_customers_per_day: validCustomers !== null ? "confirmed" : "unknown",
      max_monthly_reward_budget: validBudget !== null ? "confirmed" : "unknown",
    },
    updated_by: profile?.updated_by ?? null,
    updated_at: profile?.updated_at ?? "",
  });
  const { monthlySales, monthlyGain, avgTicket } = liveEconomic;
  const budgetSalesPct =
    validBudget !== null && monthlySales !== null && monthlySales > 0
      ? ((validBudget / monthlySales) * 100).toFixed(2).replace(/\.?0+$/, "")
      : null;
  const budgetGainPct =
    validBudget !== null && monthlyGain !== null && monthlyGain > 0
      ? ((validBudget / monthlyGain) * 100).toFixed(1).replace(/\.0$/, "")
      : null;
  const hasLiveSummary =
    monthlySales !== null || monthlyGain !== null || avgTicket !== null || validBudget !== null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-none bg-primary/10 text-primary">
            <CircleDollarSign className="size-4" aria-hidden="true" />
          </span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            {ECONOMIC_FIELDS.map((config) => {
              const id = `economic-${config.field}`;
              const statusId = `${id}-status`;
              const statusBadgeId = `${id}-status-badge`;
              const feedbackId = `${id}-feedback`;
              const fieldStatus = getFieldStatus(config);
              const fieldError = errors[config.field];
              const isAuto = autoComputed.has(config.field) && values[config.field].trim() !== "";
              const validation =
                fieldStatus === "unknown"
                  ? null
                  : validateEconomicEntry(config, values[config.field], autoStatus);
              const autoInvalid =
                autoStatus && fieldStatus !== "unknown" && validation?.error !== null;
              const badgeVariant =
                autoStatus && (fieldError || autoInvalid)
                  ? fieldError
                    ? "destructive"
                    : "warning"
                  : ECONOMIC_STATUS_VARIANT[fieldStatus];
              const badgeLabel =
                autoStatus && (fieldError || autoInvalid)
                  ? "Por revisar"
                  : ECONOMIC_STATUS_LABEL[fieldStatus];
              const previewValue =
                validation?.error === null && validation.parsed !== null
                  ? config.kind === "percent"
                    ? `${values[config.field]} %`
                    : config.kind === "cop"
                      ? formatCOP(validation.parsed)
                      : `${formatNumber(validation.parsed)}`
                  : null;

              return (
                <div
                  key={config.field}
                  className={cn(
                    "flex flex-col justify-between gap-3 rounded-none border p-3.5 transition-colors sm:p-4",
                    fieldError
                      ? "border-destructive/60 bg-destructive/5 dark:border-red-800 dark:bg-red-950/25"
                      : autoInvalid
                        ? "border-amber-200/90 bg-amber-50/30 dark:border-amber-900/70 dark:bg-amber-950/15"
                        : fieldStatus === "confirmed"
                          ? "border-emerald-200/90 bg-emerald-50/30 dark:border-emerald-900/70 dark:bg-emerald-950/15"
                          : fieldStatus === "estimated"
                            ? "border-amber-200/90 bg-amber-50/30 dark:border-amber-900/70 dark:bg-amber-950/15"
                            : "border-border bg-muted/20",
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor={id} className="leading-snug">
                          {config.label}
                        </Label>
                        {isAuto && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <Sparkles className="size-3" aria-hidden="true" />
                            {config.field === "monthly_operation_days"
                              ? "Calculado según tu horario"
                              : "Calculado automáticamente"}
                          </span>
                        )}
                      </div>
                      <Badge id={statusBadgeId} variant={badgeVariant} className="shrink-0">
                        {badgeLabel}
                      </Badge>
                    </div>

                    <Input
                      id={id}
                      inputMode={config.kind === "percent" ? "decimal" : "numeric"}
                      placeholder={
                        !autoStatus && fieldStatus === "unknown"
                          ? "Sin dato"
                          : (config.placeholder ?? "0")
                      }
                      value={values[config.field]}
                      onChange={(event) => updateValue(config.field, event.target.value)}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={autoStatus ? `${feedbackId} ${statusBadgeId}` : feedbackId}
                    />

                    {fieldError ? (
                      <p
                        id={feedbackId}
                        className="text-xs font-medium text-destructive dark:text-red-400"
                        role="alert"
                      >
                        {fieldError}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div
                          className={cn(
                            autoStatus &&
                              previewValue &&
                              "flex items-baseline justify-between gap-2",
                          )}
                        >
                          <p
                            id={feedbackId}
                            className="text-xs leading-relaxed text-muted-foreground"
                          >
                            {config.hint}
                          </p>
                          {autoStatus && previewValue && (
                            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-foreground">
                              {previewValue}
                            </span>
                          )}
                        </div>
                        {config.field === "gross_margin" && gainExceedsSales && (
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            La ganancia diaria supera las ventas diarias; ajusta los valores para
                            calcular el margen.
                          </p>
                        )}
                        {config.field === "gross_margin" && canRecalculateMargin && (
                          <button
                            type="button"
                            onClick={recalculateGrossMargin}
                            className="cursor-pointer text-xs font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Usar margen calculado ({expectedComputedMargin} %)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!autoStatus && (
                    <div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor={statusId} className="text-xs text-muted-foreground">
                          Estado del dato
                        </Label>
                        <select
                          id={statusId}
                          value={fieldStatus}
                          onChange={(event) =>
                            updateStatus(config.field, event.target.value as EconomicDataStatus)
                          }
                          className="flex h-9 w-full cursor-pointer rounded-none border border-input bg-background px-2 py-1 text-base font-medium shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/90 md:text-sm"
                        >
                          {ECONOMIC_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {previewValue && (
                        <div className="shrink-0 text-right">
                          <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Valor
                          </span>
                          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                            {previewValue}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasLiveSummary && (
            <div className="space-y-3 rounded-none border border-primary/25 bg-primary/[0.03] p-3.5 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Calculator className="size-3.5" aria-hidden="true" />
                <span>Análisis calculado automáticamente</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-none border border-border/70 bg-background/80 p-2.5">
                  <span className="block text-[11px] text-muted-foreground">
                    Ventas mensuales est.
                  </span>
                  <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                    {monthlySales !== null ? formatCOP(monthlySales) : "—"}
                  </span>
                </div>
                <div className="rounded-none border border-border/70 bg-background/80 p-2.5">
                  <span className="block text-[11px] text-muted-foreground">
                    Ganancia mensual est.
                  </span>
                  <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                    {monthlyGain !== null ? formatCOP(monthlyGain) : "—"}
                  </span>
                </div>
                <div className="rounded-none border border-border/70 bg-background/80 p-2.5">
                  <span className="block text-[11px] text-muted-foreground">Ticket promedio</span>
                  <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                    {avgTicket !== null ? formatCOP(avgTicket) : "—"}
                  </span>
                </div>
                <div className="rounded-none border border-border/70 bg-background/80 p-2.5">
                  <span className="block text-[11px] text-muted-foreground">
                    Peso del presupuesto
                  </span>
                  <span className="mt-0.5 block font-mono text-xs font-bold tabular-nums">
                    {budgetSalesPct !== null
                      ? `${budgetSalesPct} % ventas${budgetGainPct !== null ? ` · ${budgetGainPct} % util.` : ""}`
                      : monthlySales !== null
                        ? `Sug. 1–3 %: ${formatCOP(Math.round(monthlySales * 0.01))}`
                        : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <div>{draft.hasDraft && <Badge variant="muted">Borrador guardado</Badge>}</div>
            <Button type="submit" loading={upsert.isPending}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
