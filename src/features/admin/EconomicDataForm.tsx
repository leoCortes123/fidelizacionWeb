import { useState } from 'react';
import { toast } from 'sonner';
import { useUpsertEconomicProfile } from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  BusinessEconomicProfile,
  EconomicDataStatus,
  EconomicField,
} from '@/types';

export interface EconomicFieldConfig {
  field: EconomicField;
  label: string;
  hint: string;
  kind: 'cop' | 'integer' | 'percent';
  min: number;
  max: number;
}

export const ECONOMIC_FIELDS: EconomicFieldConfig[] = [
  {
    field: 'daily_avg_sales',
    label: 'Ventas diarias promedio',
    hint: 'Total vendido en un día típico.',
    kind: 'cop',
    min: 0,
    max: 1_000_000_000,
  },
  {
    field: 'monthly_operation_days',
    label: 'Días de operación al mes',
    hint: 'Entre 1 y 31 días.',
    kind: 'integer',
    min: 1,
    max: 31,
  },
  {
    field: 'daily_gain',
    label: 'Ganancia diaria',
    hint: 'Utilidad aproximada de un día típico.',
    kind: 'cop',
    min: 0,
    max: 1_000_000_000,
  },
  {
    field: 'gross_margin',
    label: 'Margen bruto',
    hint: 'Porcentaje entre 0 y 100.',
    kind: 'percent',
    min: 0,
    max: 100,
  },
  {
    field: 'avg_customers_per_day',
    label: 'Clientes por día',
    hint: 'Número aproximado de clientes atendidos.',
    kind: 'integer',
    min: 0,
    max: 1_000_000,
  },
  {
    field: 'max_monthly_reward_budget',
    label: 'Presupuesto mensual de recompensas',
    hint: 'Máximo en COP que estás dispuesto a entregar al mes.',
    kind: 'cop',
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
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'estimated', label: 'Estimado' },
  { value: 'unknown', label: 'Desconocido' },
];

export const ECONOMIC_STATUS_LABEL: Record<EconomicDataStatus, string> = {
  confirmed: 'Confirmado',
  estimated: 'Estimado',
  unknown: 'Desconocido',
};

export const ECONOMIC_STATUS_VARIANT: Record<
  EconomicDataStatus,
  'success' | 'warning' | 'muted'
> = {
  confirmed: 'success',
  estimated: 'warning',
  unknown: 'muted',
};

export function buildEconomicInitial(profile: BusinessEconomicProfile | null): {
  values: EconomicFormValues;
  status: EconomicStatusMap;
} {
  const values = {} as EconomicFormValues;
  const status = {} as EconomicStatusMap;

  for (const { field } of ECONOMIC_FIELDS) {
    const raw = profile?.[field] ?? null;
    values[field] = raw === null ? '' : String(raw);
    const stored = profile?.data_status?.[field];
    status[field] =
      stored === 'confirmed' || stored === 'estimated' || stored === 'unknown'
        ? stored
        : raw === null
          ? 'unknown'
          : 'estimated';
  }

  return { values, status };
}

export function parseEconomicNumber(value: string): number | null {
  const normalised = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalised) return null;
  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? parsed : null;
}

export function EconomicDataForm({
  businessId,
  profile,
  title = 'Datos del negocio',
  intro = 'Marca cada dato como confirmado, estimado o desconocido. Los desconocidos no se usan en el cálculo.',
  submitLabel = 'Guardar datos económicos',
  onSaved,
}: {
  businessId: string;
  profile: BusinessEconomicProfile | null;
  title?: string;
  intro?: string;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const initial = buildEconomicInitial(profile);
  const [values, setValues] = useState<EconomicFormValues>(initial.values);
  const [status, setStatus] = useState<EconomicStatusMap>(initial.status);
  const [errors, setErrors] = useState<ErrorMap>({});
  const upsert = useUpsertEconomicProfile();

  function updateValue(field: EconomicField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status[field] === 'unknown' && value.trim() !== '') {
      setStatus((current) => ({ ...current, [field]: 'estimated' }));
    }
  }

  function updateStatus(field: EconomicField, next: EconomicDataStatus) {
    setStatus((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (next === 'unknown') {
      setValues((current) => ({ ...current, [field]: '' }));
    }
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
      const currentStatus = status[config.field];
      if (currentStatus === 'unknown') {
        continue;
      }

      const parsed = parseEconomicNumber(values[config.field]);
      if (parsed === null) {
        nextErrors[config.field] = 'Introduce un valor o marca «Desconocido».';
        continue;
      }

      const integerRequired = config.kind !== 'percent';
      if (integerRequired && !Number.isInteger(parsed)) {
        nextErrors[config.field] = 'Debe ser un número entero.';
        continue;
      }
      if (parsed < config.min || parsed > config.max) {
        nextErrors[config.field] =
          config.kind === 'percent'
            ? `Debe estar entre ${config.min} y ${config.max}.`
            : `Debe estar entre ${formatNumber(config.min)} y ${formatNumber(config.max)}.`;
        continue;
      }

      switch (config.field) {
        case 'daily_avg_sales':
          payload.dailyAvgSales = parsed;
          break;
        case 'monthly_operation_days':
          payload.monthlyOperationDays = parsed;
          break;
        case 'daily_gain':
          payload.dailyGain = parsed;
          break;
        case 'gross_margin':
          payload.grossMargin = parsed;
          break;
        case 'avg_customers_per_day':
          payload.avgCustomersPerDay = parsed;
          break;
        case 'max_monthly_reward_budget':
          payload.maxMonthlyRewardBudget = parsed;
          break;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Revisa los datos marcados.');
      return;
    }

    try {
      await upsert.mutateAsync(payload);
      toast.success('Datos económicos guardados');
      onSaved?.();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">{intro}</p>

          <div className="space-y-4">
            {ECONOMIC_FIELDS.map((config) => {
              const id = `economic-${config.field}`;
              const statusId = `${id}-status`;
              return (
                <div
                  key={config.field}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_170px]"
                >
                  <div className="space-y-2">
                    <Label htmlFor={id}>{config.label}</Label>
                    <Input
                      id={id}
                      inputMode={config.kind === 'percent' ? 'decimal' : 'numeric'}
                      placeholder={status[config.field] === 'unknown' ? 'Sin dato' : '0'}
                      value={values[config.field]}
                      onChange={(event) => updateValue(config.field, event.target.value)}
                      aria-invalid={Boolean(errors[config.field])}
                    />
                    {errors[config.field] ? (
                      <p className="text-xs font-medium text-destructive" role="alert">
                        {errors[config.field]}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{config.hint}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={statusId}>Estado del dato</Label>
                    <select
                      id={statusId}
                      value={status[config.field]}
                      onChange={(event) =>
                        updateStatus(config.field, event.target.value as EconomicDataStatus)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {ECONOMIC_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {values[config.field] !== '' && (
                      <p className="text-xs text-muted-foreground">
                        {config.kind === 'percent'
                          ? `${values[config.field]} %`
                          : config.kind === 'cop'
                            ? formatCOP(parseEconomicNumber(values[config.field]) ?? 0)
                            : `${formatNumber(parseEconomicNumber(values[config.field]) ?? 0)}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="submit" loading={upsert.isPending}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
