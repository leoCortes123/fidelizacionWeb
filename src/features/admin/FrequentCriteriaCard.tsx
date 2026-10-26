import { useEffect, useState } from 'react';
import { CheckCircle2, HeartHandshake, Sparkles, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useUpdateFrequentCriteria } from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatNumber } from '@/lib/format';
import { useFormDraft } from '@/lib/useFormDraft';
import type { Business, LoyaltyProgram } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/shared/Field';

const integer = (label: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `${label}: introduce un número.` })
    .int(`${label}: debe ser un número entero.`)
    .min(min, `${label}: el mínimo es ${formatNumber(min)}.`)
    .max(max, `${label}: el máximo es ${formatNumber(max)}.`);

export const frequentSchema = z
  .object({
    minPurchases: integer('Compras para ser frecuente', 1, 100),
    periodDays: integer('Ventana de frecuencia', 7, 3650),
    minSpendCop: integer('Gasto mínimo', 0, 50_000_000),
    activeDays: integer('Días para seguir activo', 1, 365),
    recoveryDays: integer('Días para recuperación', 7, 3650),
  })
  .superRefine((value, ctx) => {
    if (value.recoveryDays <= value.activeDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recoveryDays'],
        message:
          'Los días para recuperación deben ser mayores que los días para seguir activo.',
      });
    }
  });

interface FrequentFields {
  minPurchases: string;
  periodDays: string;
  minSpendCop: string;
  activeDays: string;
  recoveryDays: string;
}

function fromProgram(program: LoyaltyProgram): FrequentFields {
  return {
    minPurchases: String(program.frequent_min_purchases ?? 3),
    periodDays: String(program.frequent_period_days ?? 90),
    minSpendCop: String(program.frequent_min_spend_cop ?? 0),
    activeDays: String(program.frequent_active_days ?? 30),
    recoveryDays: String(program.recovery_inactive_days ?? 60),
  };
}

/**
 * Criterios de cliente frecuente configurables por el administrador.
 * El cálculo se hace en el servidor al leer cada cliente; aquí solo se
 * explican las reglas y se guardan los valores.
 */
export function FrequentCriteriaCard({
  business,
  program,
}: {
  business: Business;
  program: LoyaltyProgram;
}) {
  const updateCriteria = useUpdateFrequentCriteria();
  const draft = useFormDraft<FrequentFields>({
    key: `admin:frequent:${business.id}`,
  });
  const [form, setForm] = useState<FrequentFields>(
    () => draft.read() ?? fromProgram(program),
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FrequentFields, string>>>({});

  useEffect(() => {
    if (dirty) draft.save(form);
  }, [dirty, draft.save, form]);

  function update<K extends keyof FrequentFields>(key: K, value: string) {
    setDirty(true);
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = frequentSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof FrequentFields, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FrequentFields | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los criterios.');
      return;
    }

    try {
      await updateCriteria.mutateAsync({
        businessId: business.id,
        minPurchases: parsed.data.minPurchases,
        periodDays: parsed.data.periodDays,
        minSpendCop: parsed.data.minSpendCop,
        activeDays: parsed.data.activeDays,
        recoveryDays: parsed.data.recoveryDays,
      });
      setDirty(false);
      draft.clear();
      toast.success('Criterios de cliente frecuente guardados.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const minPurchases = Number(form.minPurchases);
  const periodDays = Number(form.periodDays);
  const minSpend = Number(form.minSpendCop);
  const activeDays = Number(form.activeDays);
  const recoveryDays = Number(form.recoveryDays);
  const explanationValid = [minPurchases, periodDays, minSpend, activeDays, recoveryDays]
    .every((value) => Number.isFinite(value));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartHandshake className="size-4 text-muted-foreground" aria-hidden="true" />
          Cliente frecuente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <p className="text-sm text-muted-foreground">
            Define cuándo un cliente es frecuente y cuándo sigue activo. Los
            distintivos se recalculan cada vez que se abre la lista de clientes.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="frequent-min-purchases"
              label="Compras para ser frecuente"
              hint="Entre 1 y 100 compras."
              help="Cuenta las compras registradas dentro de la ventana móvil."
              error={errors.minPurchases}
            >
              <Input
                id="frequent-min-purchases"
                inputMode="numeric"
                value={form.minPurchases}
                onChange={(event) => update('minPurchases', event.target.value)}
                aria-invalid={Boolean(errors.minPurchases)}
              />
            </Field>
            <Field
              id="frequent-period-days"
              label="Ventana móvil (días)"
              hint="7 a 3.650 días."
              help="Periodo hacia atrás en el que se cuentan compras y gasto."
              error={errors.periodDays}
            >
              <Input
                id="frequent-period-days"
                inputMode="numeric"
                value={form.periodDays}
                onChange={(event) => update('periodDays', event.target.value)}
                aria-invalid={Boolean(errors.periodDays)}
              />
            </Field>
            <Field
              id="frequent-min-spend"
              label="Gasto mínimo (COP)"
              hint="0 = sin gasto mínimo."
              help="Suma de compras dentro de la ventana. En pesos colombianos."
              error={errors.minSpendCop}
            >
              <Input
                id="frequent-min-spend"
                inputMode="numeric"
                value={form.minSpendCop}
                onChange={(event) => update('minSpendCop', event.target.value)}
                aria-invalid={Boolean(errors.minSpendCop)}
              />
            </Field>
            <Field
              id="frequent-active-days"
              label="Días para seguir activo"
              hint="1 a 365 días."
              help="Un cliente frecuente sigue activo si compró dentro de estos días."
              error={errors.activeDays}
            >
              <Input
                id="frequent-active-days"
                inputMode="numeric"
                value={form.activeDays}
                onChange={(event) => update('activeDays', event.target.value)}
                aria-invalid={Boolean(errors.activeDays)}
              />
            </Field>
            <Field
              id="frequent-recovery-days"
              label="Días para recuperación"
              hint="Debe ser mayor que los días activo."
              help="Sin compras durante estos días, el cliente pasa a “en recuperación”."
              error={errors.recoveryDays}
            >
              <Input
                id="frequent-recovery-days"
                inputMode="numeric"
                value={form.recoveryDays}
                onChange={(event) => update('recoveryDays', event.target.value)}
                aria-invalid={Boolean(errors.recoveryDays)}
              />
            </Field>
          </div>

          {explanationValid && (
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
              <p className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Será <strong>frecuente</strong> con{' '}
                  <strong>{formatNumber(minPurchases)} compra(s)</strong> en los
                  últimos <strong>{formatNumber(periodDays)} días</strong> y un
                  gasto mínimo de <strong>{formatCOP(minSpend)}</strong>.
                </span>
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <TimerReset className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Se mantiene <strong>activo</strong> si compró en los últimos{' '}
                  {formatNumber(activeDays)} días; pasa a{' '}
                  <strong>recuperación</strong> tras {formatNumber(recoveryDays)}{' '}
                  días sin comprar.
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={updateCriteria.isPending} disabled={!dirty}>
              <CheckCircle2 aria-hidden="true" />
              Guardar criterios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
