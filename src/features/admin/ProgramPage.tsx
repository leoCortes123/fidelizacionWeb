import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Info,
  RotateCcw,
  Settings2,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  useBusinessEconomicProfile,
  useConfigureLoyaltyProgram,
  useExpirePointsDue,
  useLoyaltyProgram,
} from "@/features/loyalty/hooks";
import {
  analyzeEconomicProfile,
  analyzeProgramEconomics,
  parseProgramDecimal,
  parseProgramInteger,
} from "@/features/loyalty/programEconomics";
import { errorMessage } from "@/lib/errors";
import { formatCompactNumber, formatCOP, formatNumber, formatPointValueCOP } from "@/lib/format";
import { useFormDraft } from "@/lib/useFormDraft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BusinessGate } from "./BusinessGate";
import { FrequentCriteriaCard } from "./FrequentCriteriaCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Field } from "@/components/shared/Field";
import { ErrorState, LoadingScreen } from "@/components/shared/States";
import type { Business, BusinessEconomicProfile, LoyaltyProgram } from "@/types";

const UNCONFIGURED_ID = "00000000-0000-0000-0000-000000000000";

const DEFAULTS = {
  copPerPointUnit: 1000,
  pointsPerCopUnit: 100,
  pointsExpiryDays: 365,
  budgetRatePercent: 1,
  firstPurchaseBonusPoints: 0,
  recurrenceBonusPoints: 0,
  referralBonusPoints: 0,
  qrExpiryHours: 24,
};

const requiredInteger = (label: string, min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => (typeof value === "number" ? value : parseProgramInteger(value)))
    .refine((value) => !Number.isNaN(value), `${label}: introduce un número.`)
    .refine((value) => Number.isInteger(value), `${label}: debe ser un número entero.`)
    .refine((value) => value >= min, `${label}: el mínimo es ${formatNumber(min)}.`)
    .refine((value) => value <= max, `${label}: el máximo es ${formatNumber(max)}.`);

const programSchema = z
  .object({
    copPerPointUnit: requiredInteger("COP por loopoint", 100, 1_000_000),
    pointsPerCopUnit: requiredInteger("Loopoints por $1.000", 1, 1_000_000),
    pointsExpiryDays: requiredInteger("Vencimiento de loopoints", 1, 3650),
    budgetRatePercent: z
      .union([z.string(), z.number()])
      .transform((value) => (typeof value === "number" ? value : parseProgramDecimal(value)))
      .refine((value) => !Number.isNaN(value), "Tasa de presupuesto: introduce un número.")
      .refine((value) => value >= 0, "Tasa de presupuesto: el mínimo es 0 %.")
      .refine((value) => value <= 100, "Tasa de presupuesto: el máximo es 100 %."),
    firstPurchaseBonusPoints: requiredInteger("Bono de primera compra", 0, 1_000_000),
    recurrenceBonusPoints: requiredInteger("Bono de recurrencia", 0, 1_000_000),
    referralBonusPoints: requiredInteger("Bono por referidos", 0, 1_000_000),
    qrExpiryHours: requiredInteger("Vigencia del QR", 1, 168),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.isActive && value.pointsExpiryDays < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pointsExpiryDays"],
        message: "Un programa activo necesita una vigencia de loopoints válida.",
      });
    }
  });

type ProgramField = keyof typeof DEFAULTS;
type FormState = Record<ProgramField, string> & { isActive: boolean };

function isUnconfigured(program: LoyaltyProgram): boolean {
  return program.id === UNCONFIGURED_ID || !program.configured_at;
}

function fromProgram(program: LoyaltyProgram): FormState {
  if (isUnconfigured(program)) {
    return {
      copPerPointUnit: String(DEFAULTS.copPerPointUnit),
      pointsPerCopUnit: String(DEFAULTS.pointsPerCopUnit),
      pointsExpiryDays: String(DEFAULTS.pointsExpiryDays),
      budgetRatePercent: String(DEFAULTS.budgetRatePercent),
      firstPurchaseBonusPoints: String(DEFAULTS.firstPurchaseBonusPoints),
      recurrenceBonusPoints: String(DEFAULTS.recurrenceBonusPoints),
      referralBonusPoints: String(DEFAULTS.referralBonusPoints),
      qrExpiryHours: String(DEFAULTS.qrExpiryHours),
      isActive: false,
    };
  }
  return {
    copPerPointUnit: String(program.cop_per_point_unit),
    pointsPerCopUnit: String(program.points_per_cop_unit),
    pointsExpiryDays: String(program.points_expiry_days),
    budgetRatePercent: String(Math.round(program.budget_rate * 10000) / 100),
    firstPurchaseBonusPoints: String(program.first_purchase_bonus_points),
    recurrenceBonusPoints: String(program.recurrence_bonus_points),
    referralBonusPoints: String(program.referral_bonus_points),
    qrExpiryHours: String(program.qr_expiry_hours),
    isActive: program.is_active,
  };
}

export function ProgramPage({ headingAs = "h1" }: { headingAs?: "h1" | "h2" }) {
  return (
    <BusinessGate
      headingAs={headingAs}
      title="Sin negocios"
      description="Elige el negocio cuyo programa de loopoints deseas configurar."
      icon={Settings2}
      emptyDescription="Registra un negocio para configurar su programa de loopoints."
    >
      {(business) => <ProgramSection key={business.id} business={business} headingAs={headingAs} />}
    </BusinessGate>
  );
}

function ProgramSection({ business, headingAs }: { business: Business; headingAs: "h1" | "h2" }) {
  const program = useLoyaltyProgram(business.id);
  const economic = useBusinessEconomicProfile(business.id);

  if (program.isLoading) return <LoadingScreen label="Cargando programa de loopoints…" />;
  if (program.isError) {
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />;
  }
  if (!program.data) return null;

  return (
    <ProgramForm
      business={business}
      program={program.data}
      economicProfile={economic.data ?? null}
      economicError={economic.isError ? economic.error : null}
      onRetryEconomic={() => void economic.refetch()}
      headingAs={headingAs}
    />
  );
}

function ProgramForm({
  business,
  program,
  economicProfile,
  economicError,
  onRetryEconomic,
  headingAs,
}: {
  business: Business;
  program: LoyaltyProgram;
  economicProfile: BusinessEconomicProfile | null;
  economicError: unknown;
  onRetryEconomic: () => void;
  headingAs: "h1" | "h2";
}) {
  const configureProgram = useConfigureLoyaltyProgram();
  const expirePoints = useExpirePointsDue();
  const draft = useFormDraft<FormState>({
    key: `admin:program:${business.id}`,
  });
  const [restoredDraft] = useState(() => draft.read());
  const [form, setForm] = useState<FormState>(() => restoredDraft ?? fromProgram(program));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [dirty, setDirty] = useState(false);
  const [budgetRateEdited, setBudgetRateEdited] = useState(false);
  const unconfigured = isUnconfigured(program);
  const configured = !unconfigured;

  const economic = analyzeEconomicProfile(economicProfile);
  const copPerPoint = parseProgramInteger(form.copPerPointUnit);
  const pointsPerThousand = parseProgramInteger(form.pointsPerCopUnit);
  const parsedBudgetRatePercent = parseProgramDecimal(form.budgetRatePercent);
  const validNumbers =
    Number.isInteger(copPerPoint) &&
    Number.isInteger(pointsPerThousand) &&
    copPerPoint > 0 &&
    pointsPerThousand > 0;
  const analysis = analyzeProgramEconomics({
    economic,
    copPerPoint,
    budgetRatePercent: parsedBudgetRatePercent,
    explicitPointsPerThousand:
      Number.isInteger(pointsPerThousand) && pointsPerThousand > 0 ? pointsPerThousand : undefined,
  });

  const {
    budgetRate,
    referenceBudget,
    maxBudget,
    effectiveProgramBudget,
    costPerPoint: recommendedCostPerPoint,
    pointsPerThousand: recommendedPointsPerThousand,
    pointValueCop: rawPointValueCop,
    pointsPer1000Spent: rawPointsPer1000Spent,
    estimatedCostRate: rawEstimatedCostRate,
    examplePurchasePoints,
    exampleAvgTicketPoints,
    examplePurchaseCostCop,
    suggestedRateFromCap,
    utilityAbsorptionPct,
    netMarginAfterRewards,
  } = analysis;
  const pointValueCop = validNumbers ? (rawPointValueCop ?? 0) : 0;
  const pointsPer1000Spent = validNumbers ? (rawPointsPer1000Spent ?? 0) : 0;
  const estimatedCostRate = validNumbers ? (rawEstimatedCostRate ?? 0) : 0;
  const estimatedCostRateRounded = Math.round(estimatedCostRate * 10000) / 100;

  // Si el programa aún no está configurado y existe tope económico mensual, sugiere la tasa inicial.
  useEffect(() => {
    if (
      !unconfigured ||
      restoredDraft ||
      budgetRateEdited ||
      form.budgetRatePercent !== String(DEFAULTS.budgetRatePercent)
    ) {
      return;
    }
    if (suggestedRateFromCap !== null) {
      setForm((previous) => ({
        ...previous,
        budgetRatePercent: String(suggestedRateFromCap),
      }));
    }
  }, [budgetRateEdited, form.budgetRatePercent, restoredDraft, suggestedRateFromCap, unconfigured]);

  useEffect(() => {
    if (dirty) draft.save(form);
  }, [dirty, draft.save, form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setDirty(true);
    if (key === "budgetRatePercent") setBudgetRateEdited(true);
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function resetToDefaults() {
    setDirty(true);
    setBudgetRateEdited(true);
    setForm({
      copPerPointUnit: String(DEFAULTS.copPerPointUnit),
      pointsPerCopUnit: String(DEFAULTS.pointsPerCopUnit),
      pointsExpiryDays: String(DEFAULTS.pointsExpiryDays),
      budgetRatePercent: String(DEFAULTS.budgetRatePercent),
      firstPurchaseBonusPoints: String(DEFAULTS.firstPurchaseBonusPoints),
      recurrenceBonusPoints: String(DEFAULTS.recurrenceBonusPoints),
      referralBonusPoints: String(DEFAULTS.referralBonusPoints),
      qrExpiryHours: String(DEFAULTS.qrExpiryHours),
      isActive: false,
    });
    setErrors({});
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = programSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos del programa.");
      return;
    }

    const values = parsed.data;
    try {
      await configureProgram.mutateAsync({
        businessId: business.id,
        copPerPointUnit: values.copPerPointUnit,
        pointsPerCopUnit: values.pointsPerCopUnit,
        pointsExpiryDays: values.pointsExpiryDays,
        budgetRate: Math.round(values.budgetRatePercent * 100) / 10000,
        firstPurchaseBonusPoints: values.firstPurchaseBonusPoints,
        recurrenceBonusPoints: values.recurrenceBonusPoints,
        referralBonusPoints: values.referralBonusPoints,
        qrExpiryHours: values.qrExpiryHours,
        isActive: values.isActive,
      });
      setDirty(false);
      draft.clear();
      toast.success(
        values.isActive
          ? "Programa guardado y activo."
          : "Programa guardado. Actívalo cuando estés listo.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleExpirePoints() {
    try {
      const result = await expirePoints.mutateAsync({ businessId: business.id });
      if (result.points_expired > 0) {
        toast.success(
          `Se vencieron ${formatNumber(result.points_expired)} loopoints de ${formatNumber(
            result.lots_expired,
          )} lote(s) en ${formatNumber(result.accounts_affected)} cuenta(s).`,
        );
      } else {
        toast.info("No había loopoints vencidos por procesar.");
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        as={headingAs}
        title={`Programa de loopoints — ${business.name}`}
        description="Configura cuántos loopoints acumulan tus clientes por cada compra, cuánto valen al canjearlos y qué parte de tus ventas destinas a premios."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {draft.hasDraft && <Badge variant="muted">Borrador guardado</Badge>}
            <Badge variant={form.isActive ? "success" : "muted"}>
              {form.isActive ? "Programa activo" : "Programa inactivo"}
            </Badge>
          </div>
        }
      />

      {unconfigured && (
        <div className="flex items-start gap-3 rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">El programa aún no está configurado</p>
            <p className="text-amber-800">
              Hemos cargado valores sugeridos. Revísalos, guárdalos y activa el programa para que
              tus clientes puedan acumular y canjear loopoints.
            </p>
          </div>
        </div>
      )}

      {configured && !program.is_active && (
        <div className="flex items-start gap-3 rounded-none border bg-muted/40 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            El programa está configurado pero <strong>inactivo</strong>. Los clientes no podrán
            acumular ni solicitar recompensas hasta que lo actives.
          </p>
        </div>
      )}

      {economicError != null && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              No pudimos cargar tus datos económicos ({errorMessage(economicError)}). Aún puedes
              configurar el programa o reintentar.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRetryEconomic}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
              Reglas de acumulación y canje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="cop-per-point"
                  label="COP por loopoint ganado"
                  hint={
                    Number.isInteger(copPerPoint) && copPerPoint > 0
                      ? `¿Cuánto debe comprar un cliente para sumar 1 loopoint? Ahora mismo gana 1 loopoint por cada ${formatCOP(copPerPoint)} elegibles.`
                      : "¿Cuánto debe comprar un cliente para sumar 1 loopoint? Ejemplo: con 1.000, una compra de $50.000 genera 50 loopoints."
                  }
                  help="Mientras más bajo sea este valor, más rápido acumulan loopoints tus clientes en caja."
                  error={errors.copPerPointUnit}
                >
                  <Input
                    id="cop-per-point"
                    inputMode="numeric"
                    value={form.copPerPointUnit}
                    onChange={(event) => update("copPerPointUnit", event.target.value)}
                    aria-invalid={Boolean(errors.copPerPointUnit)}
                  />
                </Field>
                <div className="space-y-1.5">
                  <Field
                    id="points-per-cop"
                    label="Loopoints que equivalen a $1.000"
                    hint={
                      validNumbers
                        ? `Con ${formatNumber(pointsPerThousand)} loopoints para $1.000, cada loopoint equivale a ${formatPointValueCOP(pointValueCop)} al canjear.`
                        : "Cantidad de loopoints necesarios para cubrir $1.000 en premios."
                    }
                    help="Define cuánto vale cada loopoint al canjear. Puedes ajustarlo manualmente o calcularlo según tu tasa de presupuesto."
                    error={errors.pointsPerCopUnit}
                  >
                    <Input
                      id="points-per-cop"
                      inputMode="numeric"
                      value={form.pointsPerCopUnit}
                      onChange={(event) => update("pointsPerCopUnit", event.target.value)}
                      aria-invalid={Boolean(errors.pointsPerCopUnit)}
                    />
                  </Field>
                  {recommendedCostPerPoint !== null &&
                    pointsPerThousand !== recommendedPointsPerThousand && (
                      <button
                        type="button"
                        onClick={() =>
                          update("pointsPerCopUnit", String(recommendedPointsPerThousand))
                        }
                        className="cursor-pointer text-left text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        Calcular según tasa de presupuesto (
                        {formatNumber(recommendedPointsPerThousand)} loopoints)
                      </button>
                    )}
                </div>
                <Field
                  id="points-expiry-days"
                  label="Vencimiento de loopoints (días)"
                  hint="Plazo en días antes de que caduquen los loopoints desde la compra que los generó (ej. 365 días = 1 año)."
                  help="Incentiva visitas frecuentes. Cada compra crea un lote con su fecha; al vencer se descuentan primero los más antiguos."
                  error={errors.pointsExpiryDays}
                >
                  <Input
                    id="points-expiry-days"
                    inputMode="numeric"
                    value={form.pointsExpiryDays}
                    onChange={(event) => update("pointsExpiryDays", event.target.value)}
                    aria-invalid={Boolean(errors.pointsExpiryDays)}
                  />
                </Field>
                <div className="space-y-1.5">
                  <Field
                    id="budget-rate"
                    label="Tasa de presupuesto (%)"
                    hint={
                      referenceBudget !== null
                        ? `Porcentaje de tus ventas mensuales destinado a recompensas (recomendado: 1 % a 5 %). Equivale a ≈ ${formatCOP(referenceBudget)}/mes sobre tus ventas estimadas.`
                        : "Porcentaje de tus ventas mensuales destinado a recompensas (recomendado: 1 % a 5 %)."
                    }
                    help="Es una referencia financiera para alertarte si el costo de tus premios supera lo planeado."
                    error={errors.budgetRatePercent}
                  >
                    <Input
                      id="budget-rate"
                      inputMode="decimal"
                      value={form.budgetRatePercent}
                      onChange={(event) => update("budgetRatePercent", event.target.value)}
                      aria-invalid={Boolean(errors.budgetRatePercent)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {suggestedRateFromCap !== null &&
                      parsedBudgetRatePercent !== suggestedRateFromCap && (
                        <button
                          type="button"
                          onClick={() => update("budgetRatePercent", String(suggestedRateFromCap))}
                          className="cursor-pointer text-left text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          Ajustar al tope mensual ({suggestedRateFromCap} %)
                        </button>
                      )}
                    {validNumbers &&
                      estimatedCostRateRounded > 0 &&
                      estimatedCostRateRounded <= 100 &&
                      Math.abs(
                        estimatedCostRateRounded -
                          (Number.isFinite(parsedBudgetRatePercent) ? parsedBudgetRatePercent : 0),
                      ) >= 0.05 && (
                        <button
                          type="button"
                          onClick={() =>
                            update("budgetRatePercent", String(estimatedCostRateRounded))
                          }
                          className="cursor-pointer text-left text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          Igualar al costo de canje ({estimatedCostRateRounded} %)
                        </button>
                      )}
                  </div>
                </div>
                <Field
                  id="qr-expiry-hours"
                  label="Vigencia del QR (horas)"
                  hint="Tiempo máximo durante el cual el código QR de un canje o validación sigue vigente (ej. 24 horas)."
                  help="Si el QR vence antes de validarse, el cliente puede reemitirlo desde Mis canjes mientras la solicitud siga pendiente."
                  error={errors.qrExpiryHours}
                >
                  <Input
                    id="qr-expiry-hours"
                    inputMode="numeric"
                    value={form.qrExpiryHours}
                    onChange={(event) => update("qrExpiryHours", event.target.value)}
                    aria-invalid={Boolean(errors.qrExpiryHours)}
                  />
                </Field>
              </div>

              {examplePurchasePoints !== null && (
                <div className="space-y-1.5 rounded-none border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm sm:px-4 sm:py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <Calculator className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      Simulación rápida en caja
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      Compra de {formatCOP(50000)} = {formatNumber(examplePurchasePoints)} loopoints
                      {validNumbers &&
                        examplePurchaseCostCop !== null &&
                        ` (costo est. ${formatCOP(examplePurchaseCostCop)})`}
                    </span>
                  </div>
                  {exampleAvgTicketPoints !== null && economic.avgTicket !== null && (
                    <p className="text-xs text-muted-foreground">
                      En tu ticket promedio ({formatCOP(economic.avgTicket)}), el cliente sumaría{" "}
                      <strong>{formatNumber(exampleAvgTicketPoints)} loopoint(s)</strong> por
                      visita.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Bonos en loopoints</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    id="first-purchase-bonus"
                    label="Primera compra"
                    error={errors.firstPurchaseBonusPoints}
                  >
                    <Input
                      id="first-purchase-bonus"
                      inputMode="numeric"
                      value={form.firstPurchaseBonusPoints}
                      onChange={(event) => update("firstPurchaseBonusPoints", event.target.value)}
                      aria-invalid={Boolean(errors.firstPurchaseBonusPoints)}
                    />
                  </Field>
                  <Field
                    id="recurrence-bonus"
                    label="Recurrencia"
                    error={errors.recurrenceBonusPoints}
                  >
                    <Input
                      id="recurrence-bonus"
                      inputMode="numeric"
                      value={form.recurrenceBonusPoints}
                      onChange={(event) => update("recurrenceBonusPoints", event.target.value)}
                      aria-invalid={Boolean(errors.recurrenceBonusPoints)}
                    />
                  </Field>
                  <Field id="referral-bonus" label="Referidos" error={errors.referralBonusPoints}>
                    <Input
                      id="referral-bonus"
                      inputMode="numeric"
                      value={form.referralBonusPoints}
                      onChange={(event) => update("referralBonusPoints", event.target.value)}
                      aria-invalid={Boolean(errors.referralBonusPoints)}
                    />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los bonos suman loopoints extra en hitos clave (primera compra, recurrencia o
                  referidos), además de los ganados por compra. Usa 0 para desactivarlos.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-none border p-3.5 sm:p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => update("isActive", event.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer rounded-none border-input accent-primary"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold">Programa activo</span>
                  <span className="block text-xs text-muted-foreground">
                    Al activarlo, tus clientes afiliados podrán acumular loopoints en cada compra y
                    solicitar recompensas.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap justify-between gap-3">
                <Button type="button" variant="outline" onClick={resetToDefaults}>
                  <RotateCcw aria-hidden="true" />
                  Valores sugeridos
                </Button>
                <Button type="submit" loading={configureProgram.isPending}>
                  <CheckCircle2 aria-hidden="true" />
                  {form.isActive ? "Guardar y activar" : "Guardar programa"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equivalencia y análisis financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                label="Acumulación"
                value={validNumbers ? `1 loopoint por cada ${formatCOP(copPerPoint)}` : "—"}
              />
              <SummaryRow
                label="Valor al canjear"
                value={validNumbers ? `1 loopoint = ${formatPointValueCOP(pointValueCop)}` : "—"}
              />
              <SummaryRow
                label="Cien loopoints"
                value={validNumbers ? formatCOP(pointValueCop * 100) : "—"}
              />
              <SummaryRow
                label="Costo estimado"
                value={
                  validNumbers ? `${(estimatedCostRate * 100).toFixed(1)} % de las ventas` : "—"
                }
              />
              <SummaryRow
                label="Presupuesto declarado"
                value={
                  Number.isFinite(budgetRate)
                    ? `${(budgetRate * 100).toFixed(1)} % de las ventas${referenceBudget !== null ? ` (≈ ${formatCOP(referenceBudget)}/mes)` : ""}`
                    : "—"
                }
              />
              <div className="h-px bg-border/70" />
              <SummaryRow
                label="Ventas mensuales est."
                value={
                  economic.monthlySales !== null ? formatCOP(economic.monthlySales) : "Sin dato"
                }
              />
              <SummaryRow
                label="Presupuesto máximo usado"
                value={maxBudget !== null ? formatCOP(maxBudget) : "Sin dato"}
              />
              <SummaryRow
                label="Impacto en utilidad"
                value={utilityAbsorptionPct !== null ? `${utilityAbsorptionPct} %` : "Sin dato"}
              />
              <SummaryRow
                label="Margen tras recompensas"
                value={netMarginAfterRewards !== null ? `${netMarginAfterRewards} %` : "Sin dato"}
              />

              <div className="space-y-1.5 border-t border-border/70 pt-2 text-xs leading-relaxed text-muted-foreground">
                {economic.monthlyGain !== null &&
                effectiveProgramBudget !== null &&
                utilityAbsorptionPct !== null ? (
                  <p>
                    Sobre una ganancia mensual estimada de{" "}
                    <strong className="text-foreground">{formatCOP(economic.monthlyGain)}</strong>,
                    el programa representa aproximadamente el{" "}
                    <strong className="text-foreground">{utilityAbsorptionPct} %</strong> de tu
                    utilidad.
                  </p>
                ) : (
                  <p>
                    Completa la pestaña Económico (opcional) para estimar ventas mensuales y cuánto
                    absorbe el programa de tu utilidad.
                  </p>
                )}
                {economic.effectiveGrossMargin !== null && netMarginAfterRewards !== null && (
                  <p>
                    Con un margen bruto del{" "}
                    <strong className="text-foreground">{economic.effectiveGrossMargin} %</strong>,
                    tras recompensas conservarías un margen aproximado del{" "}
                    <strong className="text-foreground">{netMarginAfterRewards} %</strong>.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {economic.configuredMaxBudget !== null &&
            referenceBudget !== null &&
            referenceBudget > economic.configuredMaxBudget && (
              <div className="flex items-start gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  Con esta tasa ({form.budgetRatePercent.trim()} %), el presupuesto estimado (
                  {formatCOP(referenceBudget)}) supera el tope mensual que definiste en Económico (
                  {formatCOP(economic.configuredMaxBudget)}).
                </p>
              </div>
            )}

          {validNumbers &&
            Number.isFinite(budgetRate) &&
            budgetRate >= 0 &&
            (estimatedCostRate > budgetRate + 0.0005 ? (
              <div className="flex items-start gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  El costo estimado de canje ({(estimatedCostRate * 100).toFixed(1)} %) supera el
                  presupuesto declarado ({(budgetRate * 100).toFixed(1)} %). Ajusta la acumulación,
                  el valor del loopoint o usa el cálculo automático según tu tasa.
                </p>
              </div>
            ) : (
              <p className="px-4 text-xs text-muted-foreground sm:px-0">
                Con {formatCompactNumber(pointsPer1000Spent)} loopoint(s) por cada $1.000 gastados y
                un loopoint de {formatPointValueCOP(pointValueCop)}, el costo de canje estimado es{" "}
                {(estimatedCostRate * 100).toFixed(1)} % de las ventas. Es una estimación comercial,
                no un costo contable.
              </p>
            ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cómo funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Los loopoints se acumulan al registrar una compra del cliente.</p>
              <p>• Al solicitar una recompensa se reservan los loopoints y se emite un QR.</p>
              <p>• El encargado valida el QR, aprueba y confirma la entrega.</p>
              <p>• Cada cambio en esta configuración queda auditado.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TimerReset className="size-4 text-muted-foreground" aria-hidden="true" />
                Vencimiento de loopoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                Los loopoints vencen por lote desde su emisión, del más antiguo al más nuevo y sin
                dejar saldo negativo. Un job diario los procesa automáticamente; aquí puedes
                ejecutarlo ahora.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => void handleExpirePoints()}
                loading={expirePoints.isPending}
              >
                <TimerReset aria-hidden="true" />
                Ejecutar vencimiento ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <FrequentCriteriaCard business={business} program={program} />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
