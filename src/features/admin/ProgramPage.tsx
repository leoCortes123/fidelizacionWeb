import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Info,
  RotateCcw,
  Settings2,
  TimerReset,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useBusinesses,
  useConfigureLoyaltyProgram,
  useExpirePointsDue,
  useLoyaltyProgram,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from '@/components/shared/States';
import type { Business, LoyaltyProgram } from '@/types';

const UNCONFIGURED_ID = '00000000-0000-0000-0000-000000000000';

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
  z.coerce
    .number({ invalid_type_error: `${label}: introduce un número.` })
    .int(`${label}: debe ser un número entero.`)
    .min(min, `${label}: el mínimo es ${formatNumber(min)}.`)
    .max(max, `${label}: el máximo es ${formatNumber(max)}.`);

const programSchema = z
  .object({
    copPerPointUnit: requiredInteger('COP por punto', 100, 1_000_000),
    pointsPerCopUnit: requiredInteger('Puntos por $1.000', 1, 1_000_000),
    pointsExpiryDays: requiredInteger('Vencimiento de puntos', 1, 3650),
    budgetRatePercent: z.coerce
      .number({ invalid_type_error: 'Tasa de presupuesto: introduce un número.' })
      .min(0, 'Tasa de presupuesto: el mínimo es 0 %.')
      .max(100, 'Tasa de presupuesto: el máximo es 100 %.'),
    firstPurchaseBonusPoints: requiredInteger('Bono de primera compra', 0, 1_000_000),
    recurrenceBonusPoints: requiredInteger('Bono de recurrencia', 0, 1_000_000),
    referralBonusPoints: requiredInteger('Bono por referidos', 0, 1_000_000),
    qrExpiryHours: requiredInteger('Vigencia del QR', 1, 168),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.isActive && value.pointsExpiryDays < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pointsExpiryDays'],
        message: 'Un programa activo necesita una vigencia de puntos válida.',
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

export function ProgramPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio cuyo programa de puntos deseas configurar."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6 text-center">
                <Settings2 className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate('/admin/program');
                  }}
                >
                  Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  if (!current) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Registra un negocio para configurar su programa de puntos."
          icon={Building2}
        />
      </div>
    );
  }

  return <ProgramSection key={current.id} business={current} />;
}

function ProgramSection({ business }: { business: Business }) {
  const program = useLoyaltyProgram(business.id);

  if (program.isLoading) return <LoadingScreen label="Cargando programa de puntos…" />;
  if (program.isError) {
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />;
  }
  if (!program.data) return null;

  return <ProgramForm business={business} program={program.data} />;
}

function ProgramForm({ business, program }: { business: Business; program: LoyaltyProgram }) {
  const configureProgram = useConfigureLoyaltyProgram();
  const expirePoints = useExpirePointsDue();
  const [form, setForm] = useState<FormState>(() => fromProgram(program));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const unconfigured = isUnconfigured(program);
  const configured = !unconfigured;

  const copPerPoint = Number(form.copPerPointUnit);
  const pointsPerThousand = Number(form.pointsPerCopUnit);
  const validNumbers = Number.isFinite(copPerPoint) && Number.isFinite(pointsPerThousand)
    && copPerPoint > 0 && pointsPerThousand > 0;
  const pointValueCop = validNumbers ? 1000 / pointsPerThousand : 0;
  const pointsPer1000Spent = validNumbers ? 1000 / copPerPoint : 0;
  const estimatedCostRate = validNumbers ? 1000 / (copPerPoint * pointsPerThousand) : 0;
  const budgetRate = Number(form.budgetRatePercent) / 100;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function resetToDefaults() {
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
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos del programa.');
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
      toast.success(
        values.isActive
          ? 'Programa guardado y activo.'
          : 'Programa guardado. Actívalo cuando estés listo.',
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
          `Se vencieron ${formatNumber(result.points_expired)} puntos de ${formatNumber(
            result.lots_expired,
          )} lote(s) en ${formatNumber(result.accounts_affected)} cuenta(s).`,
        );
      } else {
        toast.info('No había puntos vencidos por procesar.');
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Programa de puntos — ${business.name}`}
        description="Define cómo se acumulan, vencen y canjean los puntos de tus clientes."
        actions={
          <Badge variant={form.isActive ? 'success' : 'muted'}>
            {form.isActive ? 'Programa activo' : 'Programa inactivo'}
          </Badge>
        }
      />

      {unconfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">El programa aún no está configurado</p>
            <p className="text-amber-800">
              Hemos cargado valores sugeridos. Revísalos, guárdalos y activa el
              programa para que tus clientes puedan acumular y canjear puntos.
            </p>
          </div>
        </div>
      )}

      {configured && !program.is_active && (
        <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            El programa está configurado pero <strong>inactivo</strong>. Los
            clientes no podrán acumular ni solicitar recompensas hasta que lo actives.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
              Reglas de acumulación y canje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="cop-per-point"
                  label="COP por punto ganado"
                  hint="Cada cuántos pesos de compra se acumula 1 punto."
                  error={errors.copPerPointUnit}
                >
                  <Input
                    id="cop-per-point"
                    inputMode="numeric"
                    value={form.copPerPointUnit}
                    onChange={(event) => update('copPerPointUnit', event.target.value)}
                    aria-invalid={Boolean(errors.copPerPointUnit)}
                  />
                </Field>
                <Field
                  id="points-per-cop"
                  label="Puntos que equivalen a $1.000"
                  hint="Con 100, un cliente necesita 100 puntos para $1.000 (1 punto = $10)."
                  error={errors.pointsPerCopUnit}
                >
                  <Input
                    id="points-per-cop"
                    inputMode="numeric"
                    value={form.pointsPerCopUnit}
                    onChange={(event) => update('pointsPerCopUnit', event.target.value)}
                    aria-invalid={Boolean(errors.pointsPerCopUnit)}
                  />
                </Field>
                <Field
                  id="points-expiry-days"
                  label="Vencimiento de puntos (días)"
                  hint="1 a 3.650 días. Los puntos vencen por lote desde su emisión."
                  error={errors.pointsExpiryDays}
                >
                  <Input
                    id="points-expiry-days"
                    inputMode="numeric"
                    value={form.pointsExpiryDays}
                    onChange={(event) => update('pointsExpiryDays', event.target.value)}
                    aria-invalid={Boolean(errors.pointsExpiryDays)}
                  />
                </Field>
                <Field
                  id="budget-rate"
                  label="Tasa de presupuesto (%)"
                  hint="Porcentaje de las ventas que planeas destinar a recompensas."
                  error={errors.budgetRatePercent}
                >
                  <Input
                    id="budget-rate"
                    inputMode="decimal"
                    value={form.budgetRatePercent}
                    onChange={(event) => update('budgetRatePercent', event.target.value)}
                    aria-invalid={Boolean(errors.budgetRatePercent)}
                  />
                </Field>
                <Field
                  id="qr-expiry-hours"
                  label="Vigencia del QR (horas)"
                  hint="Tiempo que tiene el encargado para validar el canje."
                  error={errors.qrExpiryHours}
                >
                  <Input
                    id="qr-expiry-hours"
                    inputMode="numeric"
                    value={form.qrExpiryHours}
                    onChange={(event) => update('qrExpiryHours', event.target.value)}
                    aria-invalid={Boolean(errors.qrExpiryHours)}
                  />
                </Field>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Bonos en puntos</h3>
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
                      onChange={(event) => update('firstPurchaseBonusPoints', event.target.value)}
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
                      onChange={(event) => update('recurrenceBonusPoints', event.target.value)}
                      aria-invalid={Boolean(errors.recurrenceBonusPoints)}
                    />
                  </Field>
                  <Field
                    id="referral-bonus"
                    label="Referidos"
                    error={errors.referralBonusPoints}
                  >
                    <Input
                      id="referral-bonus"
                      inputMode="numeric"
                      value={form.referralBonusPoints}
                      onChange={(event) => update('referralBonusPoints', event.target.value)}
                      aria-invalid={Boolean(errors.referralBonusPoints)}
                    />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los bonos son adicionales a los puntos por compra. Usa 0 para
                  desactivarlos.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => update('isActive', event.target.checked)}
                  className="mt-0.5 size-4 rounded border-input"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold">Programa activo</span>
                  <span className="block text-xs text-muted-foreground">
                    Al activarlo, los clientes afiliados podrán acumular puntos y
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
                  {form.isActive ? 'Guardar y activar' : 'Guardar programa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equivalencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                label="Acumulación"
                value={
                  validNumbers
                    ? `1 punto por cada ${formatCOP(copPerPoint)}`
                    : '—'
                }
              />
              <SummaryRow
                label="Valor al canjear"
                value={
                  validNumbers
                    ? `1 punto = ${formatCOP(pointValueCop)}`
                    : '—'
                }
              />
              <SummaryRow
                label="Cien puntos"
                value={validNumbers ? formatCOP(pointValueCop * 100) : '—'}
              />
              <SummaryRow
                label="Costo estimado"
                value={
                  validNumbers
                    ? `${(estimatedCostRate * 100).toFixed(1)} % de las ventas`
                    : '—'
                }
              />
              <SummaryRow
                label="Presupuesto declarado"
                value={
                  Number.isFinite(budgetRate)
                    ? `${(budgetRate * 100).toFixed(1)} % de las ventas`
                    : '—'
                }
              />
            </CardContent>
          </Card>

          {validNumbers && Number.isFinite(budgetRate) && budgetRate > 0 && (
            estimatedCostRate > budgetRate + 0.0005 ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  El costo estimado de canje ({formatNumber(estimatedCostRate * 100)} %)
                  supera el presupuesto declarado ({formatNumber(budgetRate * 100)} %).
                  Ajusta la acumulación, el valor del punto o el presupuesto.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Con {formatNumber(pointsPer1000Spent)} punto(s) por cada $1.000
                gastados y un punto de {formatCOP(pointValueCop)}, el costo de
                canje estimado es {(estimatedCostRate * 100).toFixed(1)} % de las
                ventas. Es una estimación comercial, no un costo contable.
              </p>
            )
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cómo funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Los puntos se acumulan al registrar una compra del cliente.</p>
              <p>• Al solicitar una recompensa se reservan los puntos y se emite un QR.</p>
              <p>• El encargado valida el QR, aprueba y confirma la entrega.</p>
              <p>• Cada cambio en esta configuración queda auditado.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TimerReset className="size-4 text-muted-foreground" aria-hidden="true" />
                Vencimiento de puntos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                Los puntos vencen por lote desde su emisión, del más antiguo al más
                nuevo y sin dejar saldo negativo. Un job diario los procesa
                automáticamente; aquí puedes ejecutarlo ahora.
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
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
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
