import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Info,
  Package,
  Plus,
  Rocket,
  Save,
  Sparkles,
  Store,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useBusinessEconomicProfile,
  useConfigureLoyaltyProgram,
  useLoyaltyProgram,
  useLoyaltyRewards,
  useProducts,
  useUpdateBusiness,
  useUpsertLoyaltyReward,
  useUpsertProduct,
} from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatNumber, parseCopInput } from '@/lib/format';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState, LoadingScreen } from '@/components/shared/States';
import { BusinessGate } from '@/features/admin/BusinessGate';
import { EconomicDataForm } from '@/features/admin/EconomicDataForm';
import type {
  Business,
  BusinessEconomicProfile,
  LoyaltyProgram,
  LoyaltyReward,
  Product,
} from '@/types';

const STEPS = [
  'Datos del negocio',
  'Carta y costos',
  'Datos económicos',
  'Programa y activación',
] as const;

const DAY_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

const TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Panama',
  'America/Caracas',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
  'UTC',
];

interface WizardDraft {
  version: 2;
  step: number;
  name: string;
  timezone: string;
  operatingDays: number[];
  copPerPointUnit: string;
  budgetRatePercent: string;
  pointsExpiryDays: string;
  qrExpiryHours: string;
  rewardPoints: Record<string, string>;
  includedRewards: Record<string, boolean>;
  savedAt: string;
}

const ZERO_PROGRAM_ID = '00000000-0000-0000-0000-000000000000';

function draftKey(businessId: string): string {
  return `fidelizacion:onboarding:${businessId}`;
}

function loadDraft(businessId: string): WizardDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(businessId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    if (parsed.version !== 2) return null;
    if (!Array.isArray(parsed.operatingDays)) return null;
    return {
      version: 2,
      step: typeof parsed.step === 'number' ? parsed.step : 0,
      name: String(parsed.name ?? ''),
      timezone: String(parsed.timezone ?? ''),
      operatingDays: parsed.operatingDays.filter(
        (day): day is number => typeof day === 'number' && day >= 1 && day <= 7,
      ),
      copPerPointUnit: String(parsed.copPerPointUnit ?? '1000'),
      budgetRatePercent: String(parsed.budgetRatePercent ?? '1'),
      pointsExpiryDays: String(parsed.pointsExpiryDays ?? '365'),
      qrExpiryHours: String(parsed.qrExpiryHours ?? '24'),
      rewardPoints: parsed.rewardPoints ?? {},
      includedRewards: parsed.includedRewards ?? {},
      savedAt: String(parsed.savedAt ?? ''),
    };
  } catch {
    return null;
  }
}

function initialDraft(
  business: Business,
  program: LoyaltyProgram | null,
): WizardDraft {
  const configured =
    program && program.id !== ZERO_PROGRAM_ID && program.configured_at;
  return {
    version: 2,
    step: 0,
    name: business.name,
    timezone: business.timezone || 'America/Bogota',
    operatingDays:
      business.operating_days.length > 0
        ? [...business.operating_days]
        : [1, 2, 3, 4, 5, 6],
    copPerPointUnit: String(configured ? program.cop_per_point_unit : 1000),
    budgetRatePercent: String(
      configured ? Math.round(program.budget_rate * 10000) / 100 : 1,
    ),
    pointsExpiryDays: String(configured ? program.points_expiry_days : 365),
    qrExpiryHours: String(configured ? program.qr_expiry_hours : 24),
    rewardPoints: {},
    includedRewards: {},
    savedAt: '',
  };
}

export function OnboardingWizardPage() {
  return (
    <BusinessGate
      title="Configuración inicial"
      description="Elige el negocio que deseas configurar paso a paso."
      icon={Rocket}
      emptyDescription="Registra un negocio para configurar su programa de fidelización."
    >
      {(business) => <OnboardingSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function OnboardingSection({ business }: { business: Business }) {
  const program = useLoyaltyProgram(business.id);
  const products = useProducts(business.id, false);
  const economic = useBusinessEconomicProfile(business.id);
  const rewards = useLoyaltyRewards(business.id, false);

  const isLoading =
    program.isLoading ||
    products.isLoading ||
    economic.isLoading ||
    rewards.isLoading;
  const isError =
    program.isError || products.isError || economic.isError || rewards.isError;

  if (isLoading) return <LoadingScreen label="Preparando la configuración…" />;
  if (isError) {
    const error =
      program.error ?? products.error ?? economic.error ?? rewards.error;
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          void program.refetch();
          void products.refetch();
          void economic.refetch();
          void rewards.refetch();
        }}
      />
    );
  }

  return (
    <Wizard
      key={business.id}
      business={business}
      program={program.data ?? null}
      products={products.data ?? []}
      profile={economic.data ?? null}
      existingRewards={rewards.data ?? []}
    />
  );
}

function Wizard({
  business,
  program,
  products,
  profile,
  existingRewards,
}: {
  business: Business;
  program: LoyaltyProgram | null;
  products: Product[];
  profile: BusinessEconomicProfile | null;
  existingRewards: LoyaltyReward[];
}) {
  const navigate = useNavigate();
  const [restoredDraft] = useState(() => loadDraft(business.id));
  const [draft, setDraft] = useState<WizardDraft>(
    () => restoredDraft ?? initialDraft(business, program),
  );
  const [showRestored, setShowRestored] = useState(Boolean(restoredDraft));
  const [costEdits, setCostEdits] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    cost: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const updateBusiness = useUpdateBusiness();
  const upsertProduct = useUpsertProduct();
  const upsertReward = useUpsertLoyaltyReward();
  const configureProgram = useConfigureLoyaltyProgram();

  const step = Math.min(Math.max(draft.step, 0), STEPS.length - 1);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        draftKey(business.id),
        JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
      );
    } catch {
      // Sin almacenamiento: el wizard sigue funcionando en memoria.
    }
  }, [business.id, draft]);

  function patch(partial: Partial<WizardDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setError(null);
  }

  function go(nextStep: number) {
    patch({ step: Math.min(Math.max(nextStep, 0), STEPS.length - 1) });
  }

  function restart() {
    try {
      window.localStorage.removeItem(draftKey(business.id));
    } catch {
      // Ignorado.
    }
    setDraft(initialDraft(business, program));
    setCostEdits({});
    setNewProduct({ name: '', price: '', cost: '' });
    setShowRestored(false);
    setError(null);
  }

  function toggleDay(day: number) {
    const days = draft.operatingDays.includes(day)
      ? draft.operatingDays.filter((value) => value !== day)
      : [...draft.operatingDays, day].sort((a, b) => a - b);
    patch({ operatingDays: days });
  }

  async function saveBusinessStep() {
    if (draft.name.trim().length < 2) {
      setError('El nombre del negocio debe tener al menos 2 caracteres.');
      return;
    }
    if (!draft.timezone.trim()) {
      setError('Elige una zona horaria.');
      return;
    }
    if (draft.operatingDays.length === 0) {
      setError('Selecciona al menos un día de operación.');
      return;
    }

    try {
      await updateBusiness.mutateAsync({
        businessId: business.id,
        name: draft.name.trim(),
        timezone: draft.timezone,
        operatingDays: draft.operatingDays,
      });
      toast.success('Datos del negocio guardados');
      go(1);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function addProduct() {
    const priceCop = parseCopInput(newProduct.price);
    const costCop =
      newProduct.cost.trim() === '' ? null : parseCopInput(newProduct.cost);

    if (newProduct.name.trim().length < 2) {
      setError('El nombre del producto debe tener al menos 2 caracteres.');
      return;
    }
    if (priceCop === null || priceCop <= 0) {
      setError('El precio del producto debe ser mayor que cero.');
      return;
    }
    if (costCop !== null && costCop < 0) {
      setError('El costo no puede ser negativo.');
      return;
    }

    try {
      await upsertProduct.mutateAsync({
        businessId: business.id,
        name: newProduct.name.trim(),
        priceCop,
        costCop,
        isActive: true,
      });
      setNewProduct({ name: '', price: '', cost: '' });
      setError(null);
      toast.success('Producto añadido a la carta');
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function saveCost(product: Product) {
    const raw = costEdits[product.id] ?? '';
    const costCop = parseCopInput(raw);
    if (costCop === null) {
      setError(`Introduce un costo válido para ${product.name}.`);
      return;
    }

    try {
      await upsertProduct.mutateAsync({
        businessId: business.id,
        id: product.id,
        name: product.name,
        description: product.description,
        priceCop: product.price_cop,
        costCop,
        isActive: product.is_active,
      });
      setCostEdits((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      setError(null);
      toast.success(`Costo de ${product.name} guardado`);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  const activeProducts = products.filter((product) => product.is_active);
  const productsWithCost = activeProducts.filter(
    (product) => product.cost_cop !== null && product.cost_cop > 0,
  );
  const productsWithoutCost = activeProducts.filter(
    (product) => product.cost_cop === null || product.cost_cop <= 0,
  );

  const copPerPoint = Number(draft.copPerPointUnit);
  const budgetRate = Number(draft.budgetRatePercent) / 100;
  const monthlySales =
    profile?.daily_avg_sales != null && profile?.monthly_operation_days != null
      ? profile.daily_avg_sales * profile.monthly_operation_days
      : null;
  const referenceBudget =
    monthlySales !== null && Number.isFinite(budgetRate)
      ? Math.floor(monthlySales * budgetRate)
      : null;
  const maxBudget =
    profile?.max_monthly_reward_budget ?? referenceBudget ?? null;
  const costPerPoint =
    Number.isFinite(copPerPoint) &&
    copPerPoint > 0 &&
    Number.isFinite(budgetRate) &&
    budgetRate > 0
      ? budgetRate * copPerPoint
      : null;

  function suggestedPoints(product: Product): number | null {
    if (
      product.cost_cop === null ||
      product.cost_cop <= 0 ||
      costPerPoint === null ||
      costPerPoint <= 0
    ) {
      return null;
    }
    const raw = product.cost_cop / costPerPoint;
    return Math.max(5, Math.ceil(raw / 5) * 5);
  }

  function included(productId: string): boolean {
    return draft.includedRewards[productId] ?? true;
  }

  function pointsInput(productId: string, fallback: number): string {
    return draft.rewardPoints[productId] ?? String(fallback);
  }

  function validateProgram(): string | null {
    if (!Number.isInteger(copPerPoint) || copPerPoint < 100 || copPerPoint > 1_000_000) {
      return 'El valor por punto debe ser un entero entre 100 y 1.000.000 COP.';
    }
    if (!Number.isFinite(budgetRate) || budgetRate < 0 || budgetRate > 1) {
      return 'La tasa de presupuesto debe estar entre 0 % y 100 %.';
    }
    const expiry = Number(draft.pointsExpiryDays);
    if (!Number.isInteger(expiry) || expiry < 1 || expiry > 3650) {
      return 'El vencimiento de puntos debe estar entre 1 y 3.650 días.';
    }
    const qrHours = Number(draft.qrExpiryHours);
    if (!Number.isInteger(qrHours) || qrHours < 1 || qrHours > 168) {
      return 'La vigencia del QR debe estar entre 1 y 168 horas.';
    }

    for (const product of productsWithCost) {
      if (!included(product.id)) continue;
      const suggested = suggestedPoints(product);
      if (suggested === null) continue;
      const value = Number(pointsInput(product.id, suggested));
      if (!Number.isInteger(value) || value <= 0 || value > 10_000_000) {
        return `Los puntos de ${product.name} no son válidos.`;
      }
    }

    return null;
  }

  async function activateProgram() {
    const problem = validateProgram();
    if (problem) {
      setError(problem);
      return;
    }

    setActivating(true);
    setError(null);

    try {
      const existingNames = new Set(
        existingRewards.map((reward) => reward.name.toLowerCase()),
      );

      for (const product of productsWithCost) {
        if (!included(product.id)) continue;
        const suggested = suggestedPoints(product);
        if (suggested === null) continue;
        const points = Number(pointsInput(product.id, suggested));
        const name = `${product.name} gratis`;
        if (existingNames.has(name.toLowerCase())) continue;

        await upsertReward.mutateAsync({
          businessId: business.id,
          type: 'free_product',
          productId: product.id,
          name,
          description: 'Recompensa creada desde la configuración inicial.',
          pointsRequired: points,
          isActive: true,
        });
        existingNames.add(name.toLowerCase());
      }

      await configureProgram.mutateAsync({
        businessId: business.id,
        copPerPointUnit: copPerPoint,
        pointsPerCopUnit: 100,
        pointsExpiryDays: Number(draft.pointsExpiryDays),
        budgetRate,
        firstPurchaseBonusPoints: 0,
        recurrenceBonusPoints: 0,
        referralBonusPoints: 0,
        qrExpiryHours: Number(draft.qrExpiryHours),
        isActive: true,
      });

      try {
        window.localStorage.removeItem(draftKey(business.id));
      } catch {
        // Ignorado.
      }

      toast.success('Programa activado. ¡Ya puedes acreditar compras!');
      navigate('/admin/dashboard');
    } catch (caught) {
      setError(errorMessage(caught));
      toast.error(errorMessage(caught));
    } finally {
      setActivating(false);
    }
  }

  const timezoneOptions = TIMEZONES.includes(draft.timezone)
    ? TIMEZONES
    : [draft.timezone, ...TIMEZONES];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Configuración inicial — ${business.name}`}
        description="Cuatro pasos para dejar el programa de puntos operativo."
        actions={
          <Badge variant={program?.is_active ? 'success' : 'warning'}>
            {program?.is_active ? 'Programa activo' : 'Programa inactivo'}
          </Badge>
        }
      />

      {showRestored && (
        <Alert variant="info">
          <AlertTitle>Borrador recuperado</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            Continuamos donde lo dejaste.
            <Button type="button" variant="link" size="sm" onClick={restart}>
              Empezar de nuevo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ol className="grid gap-2 sm:grid-cols-4" aria-label="Pasos de configuración">
        {STEPS.map((label, index) => {
          const current = index === step;
          const done = index < step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => go(index)}
                aria-current={current ? 'step' : undefined}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  current
                    ? 'border-primary bg-primary/5 text-primary'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${
                    current
                      ? 'bg-primary text-primary-foreground'
                      : done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className="min-w-0">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Revisa la configuración</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4" aria-hidden="true" />
              Paso 1 · Datos del negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="onboarding-name">Nombre del negocio</Label>
                <Input
                  id="onboarding-name"
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-timezone">Zona horaria</Label>
                <select
                  id="onboarding-timezone"
                  value={draft.timezone}
                  onChange={(event) => patch({ timezone: event.target.value })}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:h-9"
                >
                  {timezoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Días de operación</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DAY_LABELS).map(([day, label]) => {
                  const value = Number(day);
                  const selected = draft.operatingDays.includes(value);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleDay(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Se usan para estimar las ventas mensuales; puedes cambiarlos después.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void saveBusinessStep()}
                loading={updateBusiness.isPending}
              >
                Guardar y continuar
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" aria-hidden="true" />
                Paso 2 · Carta y costos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Las recompensas sugeridas usan el <strong>costo</strong> de cada producto.
                Añade el costo de los que falten; no es obligatorio para continuar.
              </p>

              {products.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  La carta está vacía. Puedes añadir productos ahora o continuar y
                  hacerlo más tarde.
                </p>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => {
                    const edited = costEdits[product.id];
                    const value =
                      edited ?? (product.cost_cop === null ? '' : String(product.cost_cop));
                    return (
                      <div
                        key={product.id}
                        className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Precio {formatCOP(product.price_cop)}
                            {!product.is_active && ' · Inactivo'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`cost-${product.id}`}>
                            Costo de {product.name}
                          </Label>
                          <Input
                            id={`cost-${product.id}`}
                            inputMode="numeric"
                            placeholder="Sin costo"
                            value={value}
                            onChange={(event) =>
                              setCostEdits((current) => ({
                                ...current,
                                [product.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              value.trim() === '' ||
                              value === (product.cost_cop === null ? '' : String(product.cost_cop))
                            }
                            onClick={() => void saveCost(product)}
                          >
                            <Save aria-hidden="true" />
                            Guardar costo
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {productsWithoutCost.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle>
                    {productsWithoutCost.length} producto
                    {productsWithoutCost.length === 1 ? '' : 's'} sin costo
                  </AlertTitle>
                  <AlertDescription>
                    No generarán una recompensa sugerida hasta que añadas su costo.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="size-4" aria-hidden="true" />
                Añadir producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="new-product-name">Nombre del producto</Label>
                  <Input
                    id="new-product-name"
                    value={newProduct.name}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, name: event.target.value }))
                    }
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-product-price">Precio (COP)</Label>
                  <Input
                    id="new-product-price"
                    inputMode="numeric"
                    value={newProduct.price}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, price: event.target.value }))
                    }
                    placeholder="2.500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-product-cost">Costo (COP, recomendado)</Label>
                  <Input
                    id="new-product-cost"
                    inputMode="numeric"
                    value={newProduct.cost}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, cost: event.target.value }))
                    }
                    placeholder="800"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void addProduct()}
                loading={upsertProduct.isPending}
              >
                <Plus aria-hidden="true" />
                Añadir a la carta
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => go(0)}>
              <ArrowLeft aria-hidden="true" />
              Volver
            </Button>
            <Button type="button" onClick={() => go(2)}>
              Continuar
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <EconomicDataForm
            businessId={business.id}
            profile={profile}
            title="Paso 3 · Datos económicos"
            intro="Cada dato puede ser confirmado, estimado o desconocido. Los desconocidos no se usan en los cálculos y no bloquean la activación."
            submitLabel="Guardar y continuar"
            onSaved={() => go(3)}
          />

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => go(1)}>
              <ArrowLeft aria-hidden="true" />
              Volver
            </Button>
            <Button type="button" variant="ghost" onClick={() => go(3)}>
              Saltar por ahora
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="size-4" aria-hidden="true" />
                Paso 4 · Programa y activación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onboarding-cop-per-point">COP por punto ganado</Label>
                  <Input
                    id="onboarding-cop-per-point"
                    inputMode="numeric"
                    value={draft.copPerPointUnit}
                    onChange={(event) =>
                      patch({ copPerPointUnit: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    1 punto por cada {formatCOP(copPerPoint || 0)} de compra elegible.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboarding-budget-rate">Tasa de presupuesto (%)</Label>
                  <Input
                    id="onboarding-budget-rate"
                    inputMode="decimal"
                    value={draft.budgetRatePercent}
                    onChange={(event) =>
                      patch({ budgetRatePercent: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Parte de las ventas destinada a recompensas.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboarding-expiry">Vencimiento de puntos (días)</Label>
                  <Input
                    id="onboarding-expiry"
                    inputMode="numeric"
                    value={draft.pointsExpiryDays}
                    onChange={(event) =>
                      patch({ pointsExpiryDays: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboarding-qr">Vigencia del QR (horas)</Label>
                  <Input
                    id="onboarding-qr"
                    inputMode="numeric"
                    value={draft.qrExpiryHours}
                    onChange={(event) => patch({ qrExpiryHours: event.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" aria-hidden="true" />
                Recompensas sugeridas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {productsWithCost.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No hay productos con costo. Vuelve al paso 2 y añade el costo para
                  generar recompensas sugeridas. Puedes activar el programa sin
                  recompensas y crearlas después.
                </p>
              ) : (
                productsWithCost.map((product) => {
                  const suggested = suggestedPoints(product);
                  if (suggested === null) return null;
                  const isIncluded = included(product.id);
                  return (
                    <div
                      key={product.id}
                      className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_minmax(0,1fr)_130px]"
                    >
                      <label className="flex items-start gap-2 pt-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={(event) =>
                            patch({
                              includedRewards: {
                                ...draft.includedRewards,
                                [product.id]: event.target.checked,
                              },
                            })
                          }
                          aria-label={`Incluir ${product.name} en la propuesta`}
                          className="mt-0.5 size-4 rounded border-input"
                        />
                      </label>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name} gratis</p>
                        <p className="text-xs text-muted-foreground">
                          Costo {formatCOP(product.cost_cop ?? 0)} · Precio{' '}
                          {formatCOP(product.price_cop)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Puntos sugeridos: {formatNumber(suggested)} (editable)
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`reward-points-${product.id}`}>
                          Puntos para {product.name}
                        </Label>
                        <Input
                          id={`reward-points-${product.id}`}
                          inputMode="numeric"
                          value={pointsInput(product.id, suggested)}
                          disabled={!isIncluded}
                          onChange={(event) =>
                            patch({
                              rewardPoints: {
                                ...draft.rewardPoints,
                                [product.id]: event.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  );
                })
              )}

              {productsWithoutCost.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {productsWithoutCost.length} producto
                  {productsWithoutCost.length === 1 ? '' : 's'} sin costo no aparece
                  {productsWithoutCost.length === 1 ? '' : 'n'} en la propuesta.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="size-4" aria-hidden="true" />
                Supuestos del cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                1 punto por cada <strong>{formatCOP(copPerPoint || 0)}</strong> de compra
                elegible.
              </p>
              <p>
                Presupuesto objetivo: <strong>{draft.budgetRatePercent || '0'} %</strong>{' '}
                de las ventas mensuales
                {referenceBudget !== null ? ` (≈ ${formatCOP(referenceBudget)})` : ''}.
              </p>
              {monthlySales !== null ? (
                <p>
                  Ventas mensuales estimadas:{' '}
                  <strong>{formatCOP(monthlySales)}</strong>.
                </p>
              ) : (
                <p className="text-amber-700">
                  No se pueden calcular las ventas mensuales: faltan ventas diarias o
                  días de operación en el paso 3.
                </p>
              )}
              {costPerPoint !== null ? (
                <p>
                  Costo estimado por punto:{' '}
                  <strong>{formatCOP(costPerPoint)}</strong>. Los puntos sugeridos
                  igualan el costo del producto con ese presupuesto.
                </p>
              ) : (
                <p className="text-amber-700">
                  No se puede calcular el costo por punto (tasa de presupuesto en 0 % o
                  valor por punto inválido), así que no hay propuesta de puntos.
                </p>
              )}
              {profile?.daily_gain == null && (
                <p className="text-muted-foreground">
                  Sin ganancia diaria: no se puede estimar cuánto absorbe el programa de
                  la utilidad.
                </p>
              )}
              {profile?.gross_margin == null && (
                <p className="text-muted-foreground">
                  Sin margen bruto: no se puede estimar el impacto en el margen.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Es una estimación comercial para fijar el presupuesto, no un costo
                contable. Presupuesto máximo usado: {maxBudget !== null ? formatCOP(maxBudget) : 'sin dato'}.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => go(2)}>
              <ArrowLeft aria-hidden="true" />
              Volver
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toast.success('Borrador guardado en este navegador.')}
              >
                <Save aria-hidden="true" />
                Guardar borrador
              </Button>
              <Button
                type="button"
                onClick={() => void activateProgram()}
                loading={activating}
              >
                <CheckCircle2 aria-hidden="true" />
                Activar programa
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Trash2 className="size-3.5" aria-hidden="true" />
        El borrador se guarda automáticamente en este navegador. Puedes cerrar y
        continuar después.
      </div>
    </div>
  );
}
