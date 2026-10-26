import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Pencil, Trash2, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useLoyaltyRewards,
  useUpsertLoyaltyReward,
  useBusinesses,
  useProducts,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatPoints, formatDateBogota, parseCopInput } from '@/lib/format';
import { useFormDraft } from '@/lib/useFormDraft';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from '@/components/shared/States';
import type { Business, LoyaltyReward, LoyaltyRewardType, Product } from '@/types';

const rewardTypeLabels: Record<LoyaltyRewardType, string> = {
  free_product: 'Producto gratuito',
  fixed_discount: 'Descuento fijo',
  percentage_discount: 'Descuento porcentual',
  configurable_benefit: 'Beneficio configurable',
};

interface RewardFormState {
  name: string;
  description: string;
  type: LoyaltyRewardType;
  productId: string;
  pointsRequired: string;
  minPurchaseAmount: string;
  maxDiscountAmount: string;
  discountPercentage: string;
  validFrom: string;
  validUntil: string;
  maxRedemptionsPerCustomer: string;
  maxRedemptionsPerPeriod: string;
  redemptionPeriodDays: string;
  totalRedemptionLimit: string;
  isActive: boolean;
}

const EMPTY_FORM: RewardFormState = {
  name: '',
  description: '',
  type: 'free_product',
  productId: '',
  pointsRequired: '',
  minPurchaseAmount: '',
  maxDiscountAmount: '',
  discountPercentage: '',
  validFrom: '',
  validUntil: '',
  maxRedemptionsPerCustomer: '',
  maxRedemptionsPerPeriod: '',
  redemptionPeriodDays: '',
  totalRedemptionLimit: '',
  isActive: true,
};

const optionalInteger = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label}: introduce un número.` })
    .int(`${label}: debe ser un número entero.`)
    .min(min, `${label}: el mínimo es ${min}.`)
    .max(max, `${label}: el máximo es ${max}.`)
    .nullable();

const rewardSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(120, 'El nombre no puede superar 120 caracteres.'),
    description: z.string().max(500, 'La descripción no puede superar 500 caracteres.'),
    type: z.enum(['free_product', 'fixed_discount', 'percentage_discount', 'configurable_benefit']),
    productId: z.string().nullable(),
    pointsRequired: z
      .number({ invalid_type_error: 'Introduce los loopoints requeridos.' })
      .int('Los loopoints requeridos deben ser un entero.')
      .min(1, 'Los loopoints requeridos deben ser mayores que cero.')
      .max(10_000_000, 'Los loopoints requeridos son demasiado altos.'),
    minPurchaseAmount: z
      .number({ invalid_type_error: 'Introduce un importe válido.' })
      .int('El importe mínimo debe ser un entero de pesos.')
      .min(0, 'El importe mínimo no puede ser negativo.')
      .max(100_000_000, 'El importe mínimo es demasiado alto.'),
    maxDiscountAmount: optionalInteger('Descuento máximo', 0, 100_000_000),
    discountPercentage: z
      .number({ invalid_type_error: 'Porcentaje de descuento: introduce un número.' })
      .min(1, 'El porcentaje debe estar entre 1 y 100.')
      .max(100, 'El porcentaje debe estar entre 1 y 100.')
      .nullable(),
    validFrom: z.string().nullable(),
    validUntil: z.string().nullable(),
    maxRedemptionsPerCustomer: optionalInteger('Límite por cliente', 1, 10_000),
    maxRedemptionsPerPeriod: optionalInteger('Límite por periodo', 1, 10_000),
    redemptionPeriodDays: optionalInteger('Días del periodo', 1, 3650),
    totalRedemptionLimit: optionalInteger('Límite total', 1, 1_000_000),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'free_product' && !value.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productId'],
        message: 'Elige el producto que se entrega con esta recompensa.',
      });
    }
    if (value.type === 'percentage_discount' && value.discountPercentage === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountPercentage'],
        message: 'Indica el porcentaje de descuento (1 a 100).',
      });
    }
    if (value.type === 'fixed_discount' && (value.maxDiscountAmount === null || value.maxDiscountAmount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxDiscountAmount'],
        message: 'Indica el importe del descuento fijo.',
      });
    }
    if (
      value.minPurchaseAmount > 0 &&
      value.maxDiscountAmount !== null &&
      value.maxDiscountAmount > value.minPurchaseAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxDiscountAmount'],
        message: 'El descuento máximo no puede superar la compra mínima.',
      });
    }
    if (value.validFrom && value.validUntil && value.validUntil < value.validFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntil'],
        message: 'La fecha final no puede ser anterior a la inicial.',
      });
    }
    if (value.maxRedemptionsPerPeriod !== null && value.redemptionPeriodDays === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['redemptionPeriodDays'],
        message: 'Indica cuántos días dura el periodo del límite.',
      });
    }
  });

function toIsoStart(value: string): string | null {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

function toIsoEnd(value: string): string | null {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : null;
}

function fromIso(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function fromReward(reward: LoyaltyReward): RewardFormState {
  return {
    name: reward.name,
    description: reward.description ?? '',
    type: reward.type,
    productId: reward.product_id ?? '',
    pointsRequired: String(reward.points_required),
    minPurchaseAmount: reward.min_purchase_amount ? String(reward.min_purchase_amount) : '',
    maxDiscountAmount:
      reward.max_discount_amount === null ? '' : String(reward.max_discount_amount),
    discountPercentage:
      reward.discount_percentage === null ? '' : String(reward.discount_percentage),
    validFrom: fromIso(reward.valid_from),
    validUntil: fromIso(reward.valid_until),
    maxRedemptionsPerCustomer:
      reward.max_redemptions_per_customer === null
        ? ''
        : String(reward.max_redemptions_per_customer),
    maxRedemptionsPerPeriod:
      reward.max_redemptions_per_period === null
        ? ''
        : String(reward.max_redemptions_per_period),
    redemptionPeriodDays:
      reward.redemption_period_days === null
        ? ''
        : String(reward.redemption_period_days),
    totalRedemptionLimit:
      reward.total_redemption_limit === null
        ? ''
        : String(reward.total_redemption_limit),
    isActive: reward.is_active,
  };
}

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : Number.NaN;
}

export function RewardsPage() {
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
          description="Elige el negocio para gestionar recompensas."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6 text-center">
                <Gift className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate('/admin/rewards');
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
        <EmptyState title="Sin negocios" description="Registra un negocio para continuar." icon={Gift} />
      </div>
    );
  }

  return <RewardsSection key={current.id} business={current} />;
}

function RewardsSection({ business }: { business: Business }) {
  // El panel administrativo muestra activas e inactivas.
  const rewards = useLoyaltyRewards(business.id, false);
  const products = useProducts(business.id, false);
  const upsertReward = useUpsertLoyaltyReward();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyReward | null>(null);
  const [form, setForm] = useState<RewardFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RewardFormState, string>>>({});
  const newRewardDraft = useFormDraft<RewardFormState>({
    key: `admin:new-reward:${business.id}`,
  });

  useEffect(() => {
    if (dialogOpen && !editing) newRewardDraft.save(form);
  }, [dialogOpen, editing, form, newRewardDraft.save]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products.data ?? []) map.set(product.id, product);
    return map;
  }, [products.data]);

  if (rewards.isLoading) return <LoadingScreen label="Cargando recompensas…" />;
  if (rewards.isError) {
    return <ErrorState error={rewards.error} onRetry={() => void rewards.refetch()} />;
  }

  const rewardsData = rewards.data ?? [];

  function openCreate() {
    setEditing(null);
    setForm(
      newRewardDraft.read() ?? {
        ...EMPTY_FORM,
        productId: products.data?.[0]?.id ?? '',
      },
    );
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(reward: LoyaltyReward) {
    setEditing(reward);
    setForm(fromReward(reward));
    setErrors({});
    setDialogOpen(true);
  }

  function update<K extends keyof RewardFormState>(key: K, value: RewardFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  async function saveReward(event: React.FormEvent) {
    event.preventDefault();
    const parsed = rewardSchema.safeParse({
      name: form.name,
      description: form.description,
      type: form.type,
      productId: form.productId || null,
      pointsRequired: Number(form.pointsRequired || Number.NaN),
      minPurchaseAmount: parseCopInput(form.minPurchaseAmount) ?? 0,
      maxDiscountAmount:
        form.maxDiscountAmount.trim() === ''
          ? null
          : parseCopInput(form.maxDiscountAmount),
      discountPercentage: parseOptionalInteger(form.discountPercentage),
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      maxRedemptionsPerCustomer: parseOptionalInteger(form.maxRedemptionsPerCustomer),
      maxRedemptionsPerPeriod: parseOptionalInteger(form.maxRedemptionsPerPeriod),
      redemptionPeriodDays: parseOptionalInteger(form.redemptionPeriodDays),
      totalRedemptionLimit: parseOptionalInteger(form.totalRedemptionLimit),
      isActive: form.isActive,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof RewardFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RewardFormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos de la recompensa.');
      return;
    }

    const values = parsed.data;
    try {
      await upsertReward.mutateAsync({
        businessId: business.id,
        id: editing?.id ?? null,
        type: values.type,
        productId: values.type === 'free_product' ? values.productId : null,
        name: values.name,
        description: values.description.trim(),
        pointsRequired: values.pointsRequired,
        minPurchaseAmount: values.minPurchaseAmount,
        maxDiscountAmount:
          values.type === 'free_product' ? null : values.maxDiscountAmount,
        discountPercentage:
          values.type === 'percentage_discount' ? values.discountPercentage : null,
        validFrom: toIsoStart(values.validFrom ?? ''),
        validUntil: toIsoEnd(values.validUntil ?? ''),
        maxRedemptionsPerCustomer: values.maxRedemptionsPerCustomer,
        maxRedemptionsPerPeriod: values.maxRedemptionsPerPeriod,
        redemptionPeriodDays:
          values.maxRedemptionsPerPeriod === null ? null : values.redemptionPeriodDays,
        totalRedemptionLimit: values.totalRedemptionLimit,
        isActive: values.isActive,
      });
      if (!editing) newRewardDraft.clear();
      toast.success(editing ? 'Recompensa actualizada' : 'Recompensa creada');
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function toggleReward(reward: LoyaltyReward) {
    // Se envían todos los campos para no borrar la configuración existente.
    void upsertReward
      .mutateAsync({
        businessId: business.id,
        id: reward.id,
        type: reward.type,
        productId: reward.product_id,
        name: reward.name,
        description: reward.description,
        pointsRequired: reward.points_required,
        minPurchaseAmount: reward.min_purchase_amount,
        maxDiscountAmount: reward.max_discount_amount,
        discountPercentage: reward.discount_percentage,
        validFrom: reward.valid_from,
        validUntil: reward.valid_until,
        maxRedemptionsPerCustomer: reward.max_redemptions_per_customer,
        maxRedemptionsPerPeriod: reward.max_redemptions_per_period,
        redemptionPeriodDays: reward.redemption_period_days,
        totalRedemptionLimit: reward.total_redemption_limit,
        isActive: !reward.is_active,
      })
      .then(() =>
        toast.success(reward.is_active ? 'Recompensa desactivada' : 'Recompensa activada'),
      )
      .catch((error) => toast.error(errorMessage(error)));
  }

  const showProduct = form.type === 'free_product';
  const showPercentage = form.type === 'percentage_discount';
  const showAmount =
    form.type === 'fixed_discount' ||
    form.type === 'percentage_discount' ||
    form.type === 'configurable_benefit';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Recompensas — ${business.name}`}
        description="Catálogo de recompensas del programa de fidelización."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nueva recompensa
          </Button>
        }
      />

      {rewardsData.length === 0 ? (
        <EmptyState
          title="Sin recompensas"
          description="Crea la primera recompensa del catálogo."
          icon={Gift}
          action={<Button variant="outline" onClick={openCreate}>Crear recompensa</Button>}
        />
      ) : (
        <ul className="divide-y rounded-xl border px-4">
          {rewardsData.map((reward) => (
            <li key={reward.id} className="py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{reward.name}</p>
                  <Badge variant={reward.is_active ? 'success' : 'muted'}>
                    {reward.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {rewardTypeLabels[reward.type]}
                  </Badge>
                </div>
                {reward.description && (
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {formatPoints(reward.points_required)}
                  </span>
                  {reward.type === 'free_product' && reward.product_id && (
                    <span>
                      Producto: {productById.get(reward.product_id)?.name ?? 'No encontrado'}
                    </span>
                  )}
                  {reward.min_purchase_amount > 0 && (
                    <span>Compra mínima: {formatCOP(reward.min_purchase_amount)}</span>
                  )}
                  {reward.max_discount_amount !== null && reward.max_discount_amount > 0 && (
                    <span>Tope: {formatCOP(reward.max_discount_amount)}</span>
                  )}
                  {reward.discount_percentage !== null && (
                    <span>{reward.discount_percentage} % de descuento</span>
                  )}
                  {(reward.valid_from || reward.valid_until) && (
                    <span>
                      Vigencia: {formatDateBogota(reward.valid_from)} —{' '}
                      {formatDateBogota(reward.valid_until)}
                    </span>
                  )}
                  {reward.max_redemptions_per_customer !== null && (
                    <span>Máx. {reward.max_redemptions_per_customer} por cliente</span>
                  )}
                  {reward.max_redemptions_per_period !== null && (
                    <span>
                      Máx. {reward.max_redemptions_per_period} cada{' '}
                      {reward.redemption_period_days ?? '—'} días
                    </span>
                  )}
                  {reward.total_redemption_limit !== null && (
                    <span>Límite total: {reward.total_redemption_limit}</span>
                  )}
                  {reward.times_redeemed > 0 && (
                    <span>Canjeadas: {reward.times_redeemed}</span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-2 sm:mt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(reward)}
                  aria-label={`Editar ${reward.name}`}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleReward(reward)}
                  aria-label={
                    reward.is_active ? `Desactivar ${reward.name}` : `Activar ${reward.name}`
                  }
                >
                  {reward.is_active ? (
                    <Trash2 aria-hidden="true" />
                  ) : (
                    <BadgeCheck aria-hidden="true" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar recompensa' : 'Nueva recompensa'}</DialogTitle>
            <DialogDescription>
              Configura el beneficio, los loopoints requeridos y sus límites de uso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveReward} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="reward-name">Nombre</Label>
              <Input
                id="reward-name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                required
                maxLength={120}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive" role="alert">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-description">Descripción</Label>
              <Textarea
                id="reward-description"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                maxLength={500}
              />
              {errors.description && (
                <p className="text-xs font-medium text-destructive" role="alert">{errors.description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-type">Tipo de recompensa</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => update('type', value as LoyaltyRewardType)}
                >
                  <SelectTrigger id="reward-type">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(rewardTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-points">Loopoints requeridos</Label>
                <Input
                  id="reward-points"
                  inputMode="numeric"
                  value={form.pointsRequired}
                  onChange={(event) => update('pointsRequired', event.target.value)}
                  required
                  aria-invalid={Boolean(errors.pointsRequired)}
                />
                {errors.pointsRequired && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.pointsRequired}
                  </p>
                )}
              </div>
            </div>

            {showProduct && (
              <div className="space-y-2">
                <Label htmlFor="reward-product">Producto que se entrega</Label>
                {(products.data ?? []).length === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    La carta está vacía. Crea un producto en <strong>Carta</strong> antes
                    de usar una recompensa de producto gratis.
                  </p>
                ) : (
                  <Select
                    value={form.productId}
                    onValueChange={(value) => update('productId', value)}
                  >
                    <SelectTrigger id="reward-product" aria-invalid={Boolean(errors.productId)}>
                      <SelectValue placeholder="Elige un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products.data ?? []).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} · {formatCOP(product.price_cop)}
                          {product.is_active ? '' : ' (inactivo)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.productId && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.productId}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-min-purchase">Compra mínima (COP)</Label>
                <Input
                  id="reward-min-purchase"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.minPurchaseAmount}
                  onChange={(event) => update('minPurchaseAmount', event.target.value)}
                  aria-invalid={Boolean(errors.minPurchaseAmount)}
                />
                {errors.minPurchaseAmount ? (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.minPurchaseAmount}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">0 = sin mínimo.</p>
                )}
              </div>
              {showAmount && (
                <div className="space-y-2">
                  <Label htmlFor="reward-max-discount">
                    {form.type === 'fixed_discount' ? 'Importe del descuento (COP)' : 'Descuento máximo (COP)'}
                  </Label>
                  <Input
                    id="reward-max-discount"
                    inputMode="numeric"
                    value={form.maxDiscountAmount}
                    onChange={(event) => update('maxDiscountAmount', event.target.value)}
                    aria-invalid={Boolean(errors.maxDiscountAmount)}
                  />
                  {errors.maxDiscountAmount ? (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.maxDiscountAmount}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tope del beneficio.</p>
                  )}
                </div>
              )}
              {showPercentage && (
                <div className="space-y-2">
                  <Label htmlFor="reward-percentage">Porcentaje de descuento (%)</Label>
                  <Input
                    id="reward-percentage"
                    inputMode="numeric"
                    placeholder="10"
                    value={form.discountPercentage}
                    onChange={(event) => update('discountPercentage', event.target.value)}
                    aria-invalid={Boolean(errors.discountPercentage)}
                  />
                  {errors.discountPercentage && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.discountPercentage}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-valid-from">Vigente desde (opcional)</Label>
                <Input
                  id="reward-valid-from"
                  type="date"
                  value={form.validFrom}
                  onChange={(event) => update('validFrom', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-valid-until">Vigente hasta (opcional)</Label>
                <Input
                  id="reward-valid-until"
                  type="date"
                  value={form.validUntil}
                  onChange={(event) => update('validUntil', event.target.value)}
                  aria-invalid={Boolean(errors.validUntil)}
                />
                {errors.validUntil && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.validUntil}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Límites de uso (opcional)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reward-max-customer">Máximo por cliente</Label>
                  <Input
                    id="reward-max-customer"
                    inputMode="numeric"
                    value={form.maxRedemptionsPerCustomer}
                    onChange={(event) => update('maxRedemptionsPerCustomer', event.target.value)}
                    aria-invalid={Boolean(errors.maxRedemptionsPerCustomer)}
                  />
                  {errors.maxRedemptionsPerCustomer && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.maxRedemptionsPerCustomer}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward-total-limit">Límite total</Label>
                  <Input
                    id="reward-total-limit"
                    inputMode="numeric"
                    value={form.totalRedemptionLimit}
                    onChange={(event) => update('totalRedemptionLimit', event.target.value)}
                    aria-invalid={Boolean(errors.totalRedemptionLimit)}
                  />
                  {errors.totalRedemptionLimit && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.totalRedemptionLimit}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward-max-period">Máximo por periodo</Label>
                  <Input
                    id="reward-max-period"
                    inputMode="numeric"
                    value={form.maxRedemptionsPerPeriod}
                    onChange={(event) => update('maxRedemptionsPerPeriod', event.target.value)}
                    aria-invalid={Boolean(errors.maxRedemptionsPerPeriod)}
                  />
                  {errors.maxRedemptionsPerPeriod && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.maxRedemptionsPerPeriod}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward-period-days">Días del periodo</Label>
                  <Input
                    id="reward-period-days"
                    inputMode="numeric"
                    value={form.redemptionPeriodDays}
                    onChange={(event) => update('redemptionPeriodDays', event.target.value)}
                    aria-invalid={Boolean(errors.redemptionPeriodDays)}
                  />
                  {errors.redemptionPeriodDays && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.redemptionPeriodDays}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Deja vacío para no limitar. El periodo se cuenta desde cada canje.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => update('isActive', event.target.checked)}
                className="size-4 rounded border-input"
              />
              Disponible en el catálogo
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={upsertReward.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={upsertReward.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
