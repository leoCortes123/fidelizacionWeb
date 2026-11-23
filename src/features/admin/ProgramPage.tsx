import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
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
  computeCopPerPointFromBudgetRate,
  FIXED_POINTS_PER_THOUSAND,
  parseProgramDecimal,
  parseProgramInteger,
} from "@/features/loyalty/programEconomics";
import { PurchaseSimulatorCard } from "@/features/loyalty/PurchaseSimulatorCard";
import { errorMessage } from "@/lib/errors";
import { formatCompactNumber, formatCOP, formatNumber, formatPointValueCOP } from "@/lib/format";
import { useFormDraft } from "@/lib/useFormDraft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessGate } from "./BusinessGate";
import { FrequentCriteriaCard } from "./FrequentCriteriaCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState, LoadingScreen } from "@/components/shared/States";
import type { Business, BusinessEconomicProfile, LoyaltyProgram } from "@/types";

const UNCONFIGURED_ID = "00000000-0000-0000-0000-000000000000";

const DEFAULTS = {
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
    pointsExpiryDays: requiredInteger("Vencimiento de monedas", 1, 3650),
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
        message: "Un programa activo necesita una vigencia de monedas válida.",
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
    pointsExpiryDays: String(program.points_expiry_days),
    budgetRatePercent: String(Math.round(program.budget_rate * 10000) / 100),
    firstPurchaseBonusPoints: String(program.first_purchase_bonus_points),
    recurrenceBonusPoints: String(program.recurrence_bonus_points),
    referralBonusPoints: String(program.referral_bonus_points),
    qrExpiryHours: String(program.qr_expiry_hours),
    isActive: program.is_active,
  };
}

export function ProgramPage({
  headingAs = "h1",
  embedded = false,
}: {
  headingAs?: "h1" | "h2";
  embedded?: boolean;
}) {
  return (
    <BusinessGate
      headingAs={headingAs}
      title="Sin negocios"
      description="Elige el negocio cuyo programa de monedas deseas configurar."
      icon={Settings2}
      emptyDescription="Registra un negocio para configurar su programa de monedas."
    >
      {(business) => (
        <ProgramSection
          key={business.id}
          business={business}
          headingAs={headingAs}
          embedded={embedded}
        />
      )}
    </BusinessGate>
  );
}

function ProgramSection({
  business,
  headingAs,
  embedded,
}: {
  business: Business;
  headingAs: "h1" | "h2";
  embedded: boolean;
}) {
  const program = useLoyaltyProgram(business.id);
  const economic = useBusinessEconomicProfile(business.id);

  if (program.isLoading) return <LoadingScreen label="Cargando programa de monedas…" />;
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
      embedded={embedded}
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
  embedded,
}: {
  business: Business;
  program: LoyaltyProgram;
  economicProfile: BusinessEconomicProfile | null;
  economicError: unknown;
  onRetryEconomic: () => void;
  headingAs: "h1" | "h2";
  embedded: boolean;
}) {
  const configureProgram = useConfigureLoyaltyProgram();
  const expirePoints = useExpirePointsDue();
  const draft = useFormDraft<FormState>({
    key: `admin:program:${business.id}`,
  });
  const [restoredDraft] = useState(() => draft.read());
  const [form, setForm] = useState<FormState>(() =>
    restoredDraft ? { ...fromProgram(program), ...restoredDraft } : fromProgram(program),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [dirty, setDirty] = useState(false);
  const [budgetRateEdited, setBudgetRateEdited] = useState(false);
  const unconfigured = isUnconfigured(program);
  const configured = !unconfigured;

  const economic = analyzeEconomicProfile(economicProfile);
  const parsedBudgetRatePercent = parseProgramDecimal(form.budgetRatePercent);
  const pointsPerThousand = FIXED_POINTS_PER_THOUSAND;
  const copPerPoint = computeCopPerPointFromBudgetRate(parsedBudgetRatePercent);
  const firstBonus = Math.max(0, parseProgramInteger(form.firstPurchaseBonusPoints) || 0);
  const recurrenceBonus = Math.max(0, parseProgramInteger(form.recurrenceBonusPoints) || 0);

  const analysis = analyzeProgramEconomics({
    economic,
    copPerPoint,
    budgetRatePercent: parsedBudgetRatePercent,
    explicitPointsPerThousand: pointsPerThousand,
  });

  const {
    budgetRate,
    referenceBudget,
    maxBudget,
    effectiveProgramBudget,
    pointValueCop: rawPointValueCop,
    pointsPer1000Spent: rawPointsPer1000Spent,
    estimatedCostRate: rawEstimatedCostRate,
    suggestedRateFromCap,
    utilityAbsorptionPct,
    netMarginAfterRewards,
  } = analysis;
  const pointValueCop = rawPointValueCop ?? 10;
  const pointsPer1000Spent = rawPointsPer1000Spent ?? 0;
  const estimatedCostRate = rawEstimatedCostRate ?? 0;

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
    const calculatedCopPerPoint = computeCopPerPointFromBudgetRate(values.budgetRatePercent);
    try {
      await configureProgram.mutateAsync({
        businessId: business.id,
        copPerPointUnit: calculatedCopPerPoint,
        pointsPerCopUnit: FIXED_POINTS_PER_THOUSAND,
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
          `Se vencieron ${formatNumber(result.points_expired)} monedas de ${formatNumber(
            result.lots_expired,
          )} lote(s) en ${formatNumber(result.accounts_affected)} cuenta(s).`,
        );
      } else {
        toast.info("No había monedas vencidas por procesar.");
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-0">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Programa de monedas
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {draft.hasDraft && <Badge variant="muted">Borrador guardado</Badge>}
            <Badge variant={form.isActive ? "success" : "muted"}>
              {form.isActive ? "Programa activo" : "Programa inactivo"}
            </Badge>
          </div>
        </div>
      ) : (
        <PageHeader
          as={headingAs}
          title="Programa de monedas"
          description="Configura qué parte de tus ventas destinas a premios, la vigencia de las monedas y los bonos especiales."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {draft.hasDraft && <Badge variant="muted">Borrador guardado</Badge>}
              <Badge variant={form.isActive ? "success" : "muted"}>
                {form.isActive ? "Programa activo" : "Programa inactivo"}
              </Badge>
            </div>
          }
        />
      )}

      {unconfigured && (
        <div className="lp-tip-box flex items-start gap-2.5 rounded-none p-3 text-sm">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-[var(--lp-tip-strong)]"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-[var(--lp-tip-strong)]">
              El programa aún no está configurado
            </p>
            <p className="text-xs text-[var(--lp-ink-soft)]">
              Hemos cargado valores sugeridos. Revísalos, guárdalos y activa el programa para que
              tus clientes puedan acumular y canjear monedas.
            </p>
          </div>
        </div>
      )}

      {configured && !program.is_active && (
        <div className="lp-subpanel flex items-start gap-2.5 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            El programa está configurado pero <strong>inactivo</strong>. Los clientes no podrán
            acumular ni solicitar recompensas hasta que lo actives.
          </p>
        </div>
      )}

      {economicError != null && (
        <div className="lp-tip-box flex flex-wrap items-center justify-between gap-2.5 rounded-none p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[var(--lp-tip-strong)]"
              aria-hidden="true"
            />
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
                Reglas de acumulación y canje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                <div className="space-y-2.5">
                  {/* 1. Tasa de presupuesto */}
                  <StackedFieldRow
                    id="budget-rate"
                    label="Tasa de presupuesto (%)"
                    error={errors.budgetRatePercent}
                    description="Porcentaje de tus ventas que destinas a premios (recomendado entre 1 % y 5 %). Al cambiar este porcentaje se recalcula automáticamente cuánto debe comprar un cliente para ganar 1 moneda."
                    extraHint={
                      referenceBudget !== null
                        ? `≈ ${formatCOP(referenceBudget)}/mes sobre tus ventas estimadas.`
                        : undefined
                    }
                    action={
                      suggestedRateFromCap !== null &&
                      parsedBudgetRatePercent !== suggestedRateFromCap ? (
                        <button
                          type="button"
                          onClick={() => update("budgetRatePercent", String(suggestedRateFromCap))}
                          className="cursor-pointer text-left text-xs font-semibold text-[var(--lp-accent-link)] underline-offset-2 hover:underline"
                        >
                          Ajustar al tope mensual ({suggestedRateFromCap} %)
                        </button>
                      ) : undefined
                    }
                  >
                    <Input
                      id="budget-rate"
                      inputMode="decimal"
                      value={form.budgetRatePercent}
                      onChange={(event) => update("budgetRatePercent", event.target.value)}
                      aria-invalid={Boolean(errors.budgetRatePercent)}
                    />
                  </StackedFieldRow>

                  {/* 2. Monedas que equivalen a $1.000 (BLOQUEADO = 100) */}
                  <StackedFieldRow
                    id="points-per-cop"
                    label="Monedas que equivalen a $1.000"
                    badge="Fijo"
                    locked
                    description={`Equivalencia fija inicial de Fideliapp: ${formatNumber(FIXED_POINTS_PER_THOUSAND)} monedas equivalen siempre a $1.000 COP al canjear (1 moneda = ${formatPointValueCOP(pointValueCop)}).`}
                  >
                    <Input
                      id="points-per-cop"
                      inputMode="numeric"
                      value={String(FIXED_POINTS_PER_THOUSAND)}
                      readOnly
                      disabled
                      className="font-mono font-bold"
                    />
                  </StackedFieldRow>

                  {/* 3. COP por moneda ganada (BLOQUEADO y CALCULADO) */}
                  <StackedFieldRow
                    id="cop-per-point"
                    label="COP por moneda ganada"
                    badge="Calculado"
                    locked
                    description={`Se calcula automáticamente con tu tasa de presupuesto y la equivalencia de ${formatNumber(FIXED_POINTS_PER_THOUSAND)} monedas por $1.000. Tus clientes ganarán 1 moneda por cada ${formatCOP(copPerPoint)} en compras.`}
                  >
                    <Input
                      id="cop-per-point"
                      inputMode="numeric"
                      value={String(copPerPoint)}
                      readOnly
                      disabled
                      className="font-mono font-bold"
                    />
                  </StackedFieldRow>

                  {/* 4. Vencimiento de monedas */}
                  <StackedFieldRow
                    id="points-expiry-days"
                    label="Vencimiento de monedas (días)"
                    error={errors.pointsExpiryDays}
                    description="Plazo en días antes de que caduquen las monedas acumuladas desde cada compra (ej. 365 días = 1 año). Al vencer se descuentan primero las más antiguas."
                  >
                    <Input
                      id="points-expiry-days"
                      inputMode="numeric"
                      value={form.pointsExpiryDays}
                      onChange={(event) => update("pointsExpiryDays", event.target.value)}
                      aria-invalid={Boolean(errors.pointsExpiryDays)}
                    />
                  </StackedFieldRow>

                  {/* 5. Vigencia del QR */}
                  <StackedFieldRow
                    id="qr-expiry-hours"
                    label="Vigencia del QR (horas)"
                    error={errors.qrExpiryHours}
                    description="Tiempo máximo durante el cual el código QR de una venta sigue activo para que el cliente reclame sus monedas. Pasado este tiempo los puntos expiran."
                  >
                    <Input
                      id="qr-expiry-hours"
                      inputMode="numeric"
                      value={form.qrExpiryHours}
                      onChange={(event) => update("qrExpiryHours", event.target.value)}
                      aria-invalid={Boolean(errors.qrExpiryHours)}
                    />
                  </StackedFieldRow>
                </div>

                {/* Bonos en monedas apilados con descripción */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <h3 className="text-sm font-semibold">Bonos en monedas (opcionales)</h3>
                    <p className="text-xs text-muted-foreground">
                      Monedas extra que se suman en momentos especiales. Déjalos en 0 si no deseas
                      activarlos.
                    </p>
                  </div>

                  <StackedFieldRow
                    id="first-purchase-bonus"
                    label="Primera compra"
                    error={errors.firstPurchaseBonusPoints}
                    description="Monedas de bienvenida que recibe un cliente nuevo al reclamar su primera compra en el negocio."
                  >
                    <Input
                      id="first-purchase-bonus"
                      inputMode="numeric"
                      value={form.firstPurchaseBonusPoints}
                      onChange={(event) => update("firstPurchaseBonusPoints", event.target.value)}
                      aria-invalid={Boolean(errors.firstPurchaseBonusPoints)}
                    />
                  </StackedFieldRow>

                  <StackedFieldRow
                    id="recurrence-bonus"
                    label="Recurrencia"
                    error={errors.recurrenceBonusPoints}
                    description="Monedas extra para premiar a clientes que compran con frecuencia en tu negocio."
                  >
                    <Input
                      id="recurrence-bonus"
                      inputMode="numeric"
                      value={form.recurrenceBonusPoints}
                      onChange={(event) => update("recurrenceBonusPoints", event.target.value)}
                      aria-invalid={Boolean(errors.recurrenceBonusPoints)}
                    />
                  </StackedFieldRow>

                  <StackedFieldRow
                    id="referral-bonus"
                    label="Referidos"
                    error={errors.referralBonusPoints}
                    description="Monedas extra cuando un cliente refiere a un amigo y este realiza su primera compra."
                  >
                    <Input
                      id="referral-bonus"
                      inputMode="numeric"
                      value={form.referralBonusPoints}
                      onChange={(event) => update("referralBonusPoints", event.target.value)}
                      aria-invalid={Boolean(errors.referralBonusPoints)}
                    />
                  </StackedFieldRow>
                </div>

                <label className="lp-subpanel flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => update("isActive", event.target.checked)}
                    className="mt-0.5 size-4 cursor-pointer rounded-none border-input accent-[var(--lp-accent-control)]"
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-semibold">Programa activo</span>
                    <span className="block text-xs text-muted-foreground">
                      Al activarlo, tus clientes afiliados podrán acumular monedas en cada compra y
                      solicitar recompensas.
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap justify-between gap-3 border-t-2 border-[var(--lp-ink)] pt-3">
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

          {/* Simulador interactivo debajo del formulario */}
          <PurchaseSimulatorCard
            copPerPoint={copPerPoint}
            pointsPerThousand={pointsPerThousand}
            avgTicket={economic.avgTicket}
            firstPurchaseBonusPoints={firstBonus}
            recurrenceBonusPoints={recurrenceBonus}
          />
        </div>

        <div className="space-y-3.5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equivalencia y análisis financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <SummaryRow
                label="Acumulación"
                value={`1 moneda por cada ${formatCOP(copPerPoint)}`}
              />
              <SummaryRow
                label="Valor al canjear"
                value={`1 moneda = ${formatPointValueCOP(pointValueCop)}`}
              />
              <SummaryRow label="Cien monedas" value={formatCOP(pointValueCop * 100)} />
              <SummaryRow
                label="Costo estimado"
                value={`${(estimatedCostRate * 100).toFixed(1)} % de las ventas`}
              />
              <SummaryRow
                label="Presupuesto declarado"
                value={
                  Number.isFinite(budgetRate)
                    ? `${(budgetRate * 100).toFixed(1)} % de las ventas${referenceBudget !== null ? ` (≈ ${formatCOP(referenceBudget)}/mes)` : ""}`
                    : "—"
                }
              />
              <div className="h-[2px] bg-[var(--lp-paper-deep)]" />
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

              <div className="space-y-1.5 border-t-2 border-[var(--lp-paper-deep)] pt-2 text-xs leading-relaxed text-muted-foreground">
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
              <div className="lp-tip-box flex items-start gap-2 rounded-none p-3 text-xs">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-[var(--lp-tip-strong)]"
                  aria-hidden="true"
                />
                <p>
                  Con esta tasa ({form.budgetRatePercent.trim()} %), el presupuesto estimado (
                  {formatCOP(referenceBudget)}) supera el tope mensual que definiste en Económico (
                  {formatCOP(economic.configuredMaxBudget)}).
                </p>
              </div>
            )}

          {Number.isFinite(budgetRate) &&
            budgetRate >= 0 &&
            (estimatedCostRate > budgetRate + 0.0005 ? (
              <div className="lp-tip-box flex items-start gap-2 rounded-none p-3 text-xs">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-[var(--lp-tip-strong)]"
                  aria-hidden="true"
                />
                <p>
                  El costo estimado de canje ({(estimatedCostRate * 100).toFixed(1)} %) supera el
                  presupuesto declarado ({(budgetRate * 100).toFixed(1)} %). Sube la tasa de
                  presupuesto si deseas alinear el cálculo.
                </p>
              </div>
            ) : (
              <p className="px-4 text-xs text-muted-foreground sm:px-0">
                Con {formatCompactNumber(pointsPer1000Spent)} moneda(s) por cada $1.000 gastados y
                una moneda de {formatPointValueCOP(pointValueCop)}, el costo de canje estimado es{" "}
                {(estimatedCostRate * 100).toFixed(1)} % de las ventas. Es una estimación comercial,
                no un costo contable.
              </p>
            ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cómo funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Las monedas se acumulan al registrar una compra del cliente.</p>
              <p>• Al solicitar una recompensa se reservan las monedas y se emite un QR.</p>
              <p>• El encargado valida el QR, aprueba y confirma la entrega.</p>
              <p>• Cada cambio en esta configuración queda auditado.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TimerReset className="size-4 text-muted-foreground" aria-hidden="true" />
                Vencimiento de monedas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                Las monedas vencen por lote desde su emisión, del más antiguo al más nuevo y sin
                dejar saldo negativo. Un job diario las procesa automáticamente; aquí puedes
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

function StackedFieldRow({
  id,
  label,
  description,
  extraHint,
  error,
  badge,
  locked = false,
  action,
  children,
}: {
  id: string;
  label: string;
  description: string;
  extraHint?: string;
  error?: string;
  badge?: string;
  locked?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        locked
          ? "grid gap-2.5 border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] p-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-center"
          : "grid gap-2.5 border-2 border-[var(--lp-ink)] bg-card p-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-center"
      }
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Label htmlFor={id} className="text-sm font-semibold leading-tight">
            {label}
          </Label>
          {badge && (
            <Badge variant="outline" className="gap-1 font-mono text-[10px]">
              {locked && <Lock className="size-2.5" aria-hidden="true" />}
              {badge}
            </Badge>
          )}
        </div>
        {children}
        {error && (
          <p className="text-xs font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}
        {action}
      </div>
      <div className="space-y-1 text-xs leading-relaxed text-muted-foreground md:border-l-2 md:border-[var(--lp-paper-deep)] md:pl-3.5">
        <p>{description}</p>
        {extraHint && <p className="font-mono font-semibold text-foreground">{extraHint}</p>}
      </div>
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
