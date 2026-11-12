import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Info,
  Link2,
  RotateCcw,
  Save,
  Sparkles,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { persistBusinessSelection, useBusinessContext } from "@/features/loyalty/businessContext";
import {
  useBusinesses,
  useBusinessEconomicProfile,
  useConfigureLoyaltyProgram,
  useLoyaltyProgram,
  useLoyaltyRewards,
  useProducts,
  useRegisterBusiness,
  useUpdateBusiness,
  useUpsertLoyaltyReward,
} from "@/features/loyalty/hooks";
import { publicAppUrl } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { formatCOP, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState, ListSkeleton, LoadingScreen } from "@/components/shared/States";
import { EconomicDataForm, isEconomicProfileEmpty } from "@/features/admin/EconomicDataForm";
import {
  analyzeEconomicProfile,
  analyzeProgramEconomics,
  COMMON_TIMEZONES,
  DAY_LABELS,
  DAY_PRESETS,
  estimateMonthlyOperationDays,
  parseProgramDecimal,
  parseProgramInteger,
  SLUG_REGEX,
  TIMEZONES,
} from "@/features/loyalty/programEconomics";
import type {
  Business,
  BusinessEconomicProfile,
  LoyaltyProgram,
  LoyaltyReward,
  Product,
} from "@/types";

const STEPS = [
  { label: "Datos del negocio", shortHint: "Nombre, enlace y horario" },
  { label: "Datos económicos", shortHint: "Análisis opcional" },
  { label: "Programa y activación", shortHint: "Reglas y puesta en marcha" },
] as const;

interface WizardDraft {
  version: 3;
  step: number;
  name: string;
  slug: string;
  slugEditedManually: boolean;
  timezone: string;
  operatingDays: number[];
  copPerPointUnit: string;
  budgetRatePercent: string;
  budgetRateEdited: boolean;
  pointsExpiryDays: string;
  qrExpiryHours: string;
  rewardPoints: Record<string, string>;
  includedRewards: Record<string, boolean>;
  savedAt: string;
}

function slugifyBusinessName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseWizardInteger(value: string): number {
  return parseProgramInteger(value);
}

function parseWizardDecimal(value: string): number {
  return parseProgramDecimal(value);
}

const ZERO_PROGRAM_ID = "00000000-0000-0000-0000-000000000000";

function draftKey(businessId: string | null): string {
  return `fidelizacion:onboarding:${businessId ?? "new"}`;
}

function loadDraft(businessId: string | null): WizardDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(businessId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<Partial<WizardDraft>, "version"> & { version?: number };
    if (parsed.version !== 2 && parsed.version !== 3) return null;
    if (!Array.isArray(parsed.operatingDays)) return null;
    const rawStep = typeof parsed.step === "number" ? parsed.step : 0;
    const mappedStep = parsed.version === 2 && rawStep > 0 ? rawStep - 1 : rawStep;
    return {
      version: 3,
      step: Math.min(Math.max(mappedStep, 0), STEPS.length - 1),
      name: String(parsed.name ?? ""),
      slug: String(parsed.slug ?? ""),
      slugEditedManually: Boolean(parsed.slugEditedManually),
      timezone: String(parsed.timezone ?? "America/Bogota"),
      operatingDays: parsed.operatingDays.filter(
        (day): day is number => typeof day === "number" && day >= 1 && day <= 7,
      ),
      copPerPointUnit: String(parsed.copPerPointUnit ?? "1000"),
      budgetRatePercent: String(parsed.budgetRatePercent ?? "1"),
      budgetRateEdited: Boolean(parsed.budgetRateEdited),
      pointsExpiryDays: String(parsed.pointsExpiryDays ?? "365"),
      qrExpiryHours: String(parsed.qrExpiryHours ?? "24"),
      rewardPoints: parsed.rewardPoints ?? {},
      includedRewards: parsed.includedRewards ?? {},
      savedAt: String(parsed.savedAt ?? ""),
    };
  } catch {
    return null;
  }
}

function initialDraft(
  business: Business | null,
  program: LoyaltyProgram | null,
  initialName = "",
  initialSlug = "",
): WizardDraft {
  const configured = Boolean(program && program.id !== ZERO_PROGRAM_ID && program.configured_at);
  return {
    version: 3,
    step: 0,
    name: business?.name ?? initialName,
    slug: business?.slug ?? (initialSlug || slugifyBusinessName(initialName)),
    slugEditedManually: Boolean(initialSlug),
    timezone: business?.timezone || "America/Bogota",
    operatingDays:
      business && business.operating_days.length > 0
        ? [...business.operating_days]
        : [1, 2, 3, 4, 5, 6],
    copPerPointUnit: String(configured && program ? program.cop_per_point_unit : 1000),
    budgetRatePercent: String(
      configured && program ? Math.round(program.budget_rate * 10000) / 100 : 1,
    ),
    budgetRateEdited: false,
    pointsExpiryDays: String(configured && program ? program.points_expiry_days : 365),
    qrExpiryHours: String(configured && program ? program.qr_expiry_hours : 24),
    rewardPoints: {},
    includedRewards: {},
    savedAt: "",
  };
}

export function OnboardingWizardPage({ newBusinessMode = false }: { newBusinessMode?: boolean }) {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const [searchParams] = useSearchParams();
  const [createdBusiness, setCreatedBusiness] = useState<Business | null>(null);

  const isNewParam = searchParams.get("new") === "1";
  const isNewFlow = newBusinessMode || isNewParam;

  if (!isNewFlow && businesses.isLoading) {
    return <ListSkeleton rows={3} />;
  }
  if (!isNewFlow && businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];
  const adminBusinesses = list.filter((item) => item.role === "admin");

  if (!isNewFlow && adminBusinesses.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio que deseas configurar paso a paso."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminBusinesses.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4 text-center sm:p-6">
                <Store className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setSelectedBusiness(business)}
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

  const resolvedExisting =
    (selectedBusiness?.role === "admin" ? selectedBusiness : null) ?? adminBusinesses[0] ?? null;
  const activeBusiness = isNewFlow
    ? createdBusiness
      ? (list.find((item) => item.id === createdBusiness.id) ?? createdBusiness)
      : null
    : resolvedExisting;

  return (
    <OnboardingSection
      key={
        isNewFlow ? "new-business-onboarding" : (activeBusiness?.id ?? "new-business-onboarding")
      }
      business={activeBusiness}
      initialName={searchParams.get("name") ?? ""}
      initialSlug={searchParams.get("slug") ?? ""}
      onBusinessCreated={(business) => setCreatedBusiness(business)}
    />
  );
}

function OnboardingSection({
  business,
  initialName,
  initialSlug,
  onBusinessCreated,
}: {
  business: Business | null;
  initialName: string;
  initialSlug: string;
  onBusinessCreated: (business: Business) => void;
}) {
  const businessId = business?.id ?? "";
  const program = useLoyaltyProgram(businessId);
  const products = useProducts(businessId, false);
  const economic = useBusinessEconomicProfile(businessId);
  const rewards = useLoyaltyRewards(businessId, false);

  const isLoading =
    Boolean(businessId) &&
    (program.isLoading || products.isLoading || economic.isLoading || rewards.isLoading);
  const isError =
    Boolean(businessId) &&
    (program.isError || products.isError || economic.isError || rewards.isError);
  const [wizardReady, setWizardReady] = useState(() => !businessId);

  useEffect(() => {
    if (businessId && !isLoading && !isError && !wizardReady) {
      setWizardReady(true);
    }
  }, [businessId, isLoading, isError, wizardReady]);

  if (!wizardReady && isLoading) return <LoadingScreen label="Preparando la configuración…" />;
  if (!wizardReady && isError) {
    const error = program.error ?? products.error ?? economic.error ?? rewards.error;
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
      business={business}
      program={program.data ?? null}
      products={products.data ?? []}
      profile={economic.data ?? null}
      existingRewards={rewards.data ?? []}
      initialName={initialName}
      initialSlug={initialSlug}
      onBusinessCreated={onBusinessCreated}
    />
  );
}

function Wizard({
  business,
  program,
  products,
  profile,
  existingRewards,
  initialName,
  initialSlug,
  onBusinessCreated,
}: {
  business: Business | null;
  program: LoyaltyProgram | null;
  products: Product[];
  profile: BusinessEconomicProfile | null;
  existingRewards: LoyaltyReward[];
  initialName: string;
  initialSlug: string;
  onBusinessCreated: (business: Business) => void;
}) {
  const navigate = useNavigate();
  const { user, refreshRoles } = useAuth();
  const { setSelectedBusiness } = useBusinessContext();
  const currentKeyId = business?.id ?? null;

  const [restoredDraft] = useState(() => loadDraft(currentKeyId));
  const [draft, setDraft] = useState<WizardDraft>(
    () => restoredDraft ?? initialDraft(business, program, initialName, initialSlug),
  );
  const [draftDirty, setDraftDirty] = useState(Boolean(restoredDraft));
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const registerBusiness = useRegisterBusiness();
  const updateBusiness = useUpdateBusiness();
  const upsertReward = useUpsertLoyaltyReward();
  const configureProgram = useConfigureLoyaltyProgram();

  const step = Math.min(Math.max(draft.step, 0), STEPS.length - 1);
  const programConfigured = Boolean(
    program && program.id !== ZERO_PROGRAM_ID && program.configured_at,
  );

  const economic = analyzeEconomicProfile(profile);

  // Sincroniza la tasa de presupuesto sugerida cuando se guardan datos económicos y el programa aún es nuevo.
  useEffect(() => {
    if (programConfigured || draft.budgetRateEdited) return;
    if (economic.monthlySales && economic.monthlySales > 0 && economic.configuredMaxBudget) {
      const computedRate = Math.min(
        100,
        Math.max(
          0.1,
          Math.round((economic.configuredMaxBudget / economic.monthlySales) * 10000) / 100,
        ),
      );
      setDraft((current) => ({ ...current, budgetRatePercent: String(computedRate) }));
    }
  }, [
    draft.budgetRateEdited,
    economic.configuredMaxBudget,
    economic.monthlySales,
    programConfigured,
  ]);

  useEffect(() => {
    if (!draftDirty) return;
    try {
      window.localStorage.setItem(
        draftKey(currentKeyId),
        JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
      );
    } catch {
      // Sin almacenamiento: el wizard sigue funcionando en memoria.
    }
  }, [currentKeyId, draft, draftDirty]);

  function patch(partial: Partial<WizardDraft>) {
    setDraftDirty(true);
    setDraft((current) => ({ ...current, ...partial }));
    setError(null);
  }

  function go(nextStep: number) {
    const clamped = Math.min(Math.max(nextStep, 0), STEPS.length - 1);
    if (!business && clamped > 0) {
      setError("Primero guarda los datos del negocio en el paso 1 para continuar.");
      return;
    }
    patch({ step: clamped });
  }

  function restart() {
    setDraftDirty(false);
    try {
      window.localStorage.removeItem(draftKey(currentKeyId));
    } catch {
      // Ignorado.
    }
    setDraft(initialDraft(business, program, initialName, initialSlug));
    setError(null);
  }

  function handleNameChange(value: string) {
    if (!business && !draft.slugEditedManually) {
      patch({ name: value, slug: slugifyBusinessName(value) });
    } else {
      patch({ name: value });
    }
  }

  function handleSlugChange(value: string) {
    patch({
      slug: value.toLowerCase().replace(/\s+/g, "-"),
      slugEditedManually: value.trim().length > 0,
    });
  }

  function toggleDay(day: number) {
    const days = draft.operatingDays.includes(day)
      ? draft.operatingDays.filter((value) => value !== day)
      : [...draft.operatingDays, day].sort((a, b) => a - b);
    patch({ operatingDays: days });
  }

  async function saveBusinessStep() {
    const cleanName = draft.name.trim();
    const cleanSlug = draft.slug.trim();

    if (cleanName.length < 2) {
      setError("El nombre del negocio debe tener al menos 2 caracteres.");
      return;
    }
    if (!business && !SLUG_REGEX.test(cleanSlug)) {
      setError(
        "El slug del enlace solo puede contener letras minúsculas, números y guiones (ej. cafe-aurora).",
      );
      return;
    }
    if (!draft.timezone.trim()) {
      setError("Elige una zona horaria.");
      return;
    }
    if (draft.operatingDays.length === 0) {
      setError("Selecciona al menos un día de operación.");
      return;
    }

    try {
      if (!business) {
        const created = await registerBusiness.mutateAsync({
          name: cleanName,
          slug: cleanSlug,
          timezone: draft.timezone,
        });
        const isDefaultDays =
          draft.operatingDays.length === 6 &&
          [1, 2, 3, 4, 5, 6].every((day, idx) => draft.operatingDays[idx] === day);
        if (!isDefaultDays) {
          await updateBusiness.mutateAsync({
            businessId: created.business_id,
            name: cleanName,
            timezone: draft.timezone,
            operatingDays: draft.operatingDays,
          });
        }
        const createdBiz: Business = {
          id: created.business_id,
          name: cleanName,
          slug: cleanSlug,
          timezone: draft.timezone,
          operating_days: [...draft.operatingDays],
          is_active: true,
          created_by: user?.id ?? "",
          created_at: created.created_at,
          updated_at: created.created_at,
          role: "admin",
          can_approve_redemptions: false,
        };
        persistBusinessSelection(user?.id, createdBiz.id);
        setSelectedBusiness(createdBiz);
        await refreshRoles?.();
        try {
          window.localStorage.removeItem(draftKey(null));
        } catch {
          // Ignorado.
        }
        onBusinessCreated(createdBiz);
        toast.success("Negocio registrado. Continuemos con los datos económicos.");
        patch({ step: 1 });
        return;
      }

      await updateBusiness.mutateAsync({
        businessId: business.id,
        name: cleanName,
        timezone: draft.timezone,
        operatingDays: draft.operatingDays,
      });
      toast.success("Datos del negocio guardados");
      go(1);
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

  const copPerPoint = parseWizardInteger(draft.copPerPointUnit);
  const parsedBudgetRatePercent = parseWizardDecimal(draft.budgetRatePercent);
  const estimatedMonthlyDays = estimateMonthlyOperationDays(draft.operatingDays);
  const { effectiveGrossMargin, monthlySales, monthlyGain, avgTicket, configuredMaxBudget } =
    economic;
  const {
    budgetRate,
    referenceBudget,
    maxBudget,
    effectiveProgramBudget,
    costPerPoint,
    pointsPerThousand,
    examplePurchasePoints,
    exampleAvgTicketPoints,
    suggestedRateFromCap,
    utilityAbsorptionPct,
    netMarginAfterRewards,
  } = analyzeProgramEconomics({
    economic,
    copPerPoint,
    budgetRatePercent: parsedBudgetRatePercent,
  });

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
      return "El valor por loopoint debe ser un entero entre 100 y 1.000.000 COP.";
    }
    if (
      !Number.isFinite(parsedBudgetRatePercent) ||
      parsedBudgetRatePercent < 0 ||
      parsedBudgetRatePercent > 100
    ) {
      return "La tasa de presupuesto debe ser un número entre 0 % y 100 %.";
    }
    const expiry = parseWizardInteger(draft.pointsExpiryDays);
    if (!Number.isInteger(expiry) || expiry < 1 || expiry > 3650) {
      return "El vencimiento de loopoints debe estar entre 1 y 3.650 días.";
    }
    const qrHours = parseWizardInteger(draft.qrExpiryHours);
    if (!Number.isInteger(qrHours) || qrHours < 1 || qrHours > 168) {
      return "La vigencia del QR debe estar entre 1 y 168 horas.";
    }

    for (const product of productsWithCost) {
      if (!included(product.id)) continue;
      const suggested = suggestedPoints(product);
      if (suggested === null) continue;
      const value = parseWizardInteger(pointsInput(product.id, suggested));
      if (!Number.isInteger(value) || value <= 0 || value > 10_000_000) {
        return `Los loopoints de ${product.name} no son válidos.`;
      }
    }

    return null;
  }

  async function activateProgram() {
    if (!business) {
      setError("Guarda primero los datos del negocio en el paso 1.");
      return;
    }
    const problem = validateProgram();
    if (problem) {
      setError(problem);
      return;
    }

    const expiryDays = parseWizardInteger(draft.pointsExpiryDays);
    const qrExpiryHours = parseWizardInteger(draft.qrExpiryHours);

    setActivating(true);
    setError(null);

    try {
      const existingNames = new Set(existingRewards.map((reward) => reward.name.toLowerCase()));

      for (const product of productsWithCost) {
        if (!included(product.id)) continue;
        const suggested = suggestedPoints(product);
        if (suggested === null) continue;
        const points = parseWizardInteger(pointsInput(product.id, suggested));
        const name = `${product.name} gratis`;
        if (existingNames.has(name.toLowerCase())) continue;

        await upsertReward.mutateAsync({
          businessId: business.id,
          type: "free_product",
          productId: product.id,
          name,
          description: "Recompensa creada desde la configuración inicial.",
          pointsRequired: points,
          isActive: true,
        });
        existingNames.add(name.toLowerCase());
      }

      await configureProgram.mutateAsync({
        businessId: business.id,
        copPerPointUnit: copPerPoint,
        pointsPerCopUnit: pointsPerThousand,
        pointsExpiryDays: expiryDays,
        budgetRate,
        firstPurchaseBonusPoints: 0,
        recurrenceBonusPoints: 0,
        referralBonusPoints: 0,
        qrExpiryHours,
        isActive: true,
      });

      setDraftDirty(false);
      try {
        window.localStorage.removeItem(draftKey(currentKeyId));
      } catch {
        // Ignorado.
      }

      setSelectedBusiness(business);
      toast.success("Programa activado. ¡Ya puedes acreditar compras!");
      navigate("/admin/dashboard");
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

  const selectedRewardsCount = productsWithCost.filter(
    (product) => suggestedPoints(product) !== null && included(product.id),
  ).length;

  const previewSlug = (business?.slug ?? draft.slug.trim()) || "mi-negocio";
  const slugValid = draft.slug.trim().length === 0 || SLUG_REGEX.test(draft.slug.trim());
  const joinPreviewUrl = `${publicAppUrl().replace(/^https?:\/\//, "")}/join/${previewSlug}`;
  const isSavingBusiness = registerBusiness.isPending || updateBusiness.isPending;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        kicker="CONFIGURACIÓN INICIAL"
        title="Configuración inicial"
        description="Activa tu programa de fidelización en 3 pasos: registra los datos básicos de tu negocio, añade información económica opcional para orientar el presupuesto y define las reglas para acumular loopoints."
      />

      {/* Progreso y navegación entre pasos */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
              Paso {step + 1} de {STEPS.length}
            </span>
            <span className="text-sm font-semibold text-foreground">{STEPS[step]?.label}</span>
          </div>

          <ol className="grid gap-0 sm:grid-cols-3" aria-label="Pasos de configuración">
            {STEPS.map((item, index) => {
              const current = index === step;
              const done = index < step;
              const locked = !business && index > 0;
              return (
                <li key={item.label} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => go(index)}
                    aria-current={current ? "step" : undefined}
                    aria-disabled={locked || undefined}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-none border px-3 py-2 text-left transition-all duration-150 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                      current
                        ? "relative z-10 border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : done
                          ? "border-emerald-200 bg-emerald-50/70 text-emerald-950 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-slate-300 hover:bg-muted/60 hover:text-foreground dark:hover:border-slate-700",
                    )}
                  >
                    {done && <span className="sr-only">Paso {index + 1} completado: </span>}
                    <span
                      aria-hidden={done || undefined}
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-none font-mono text-xs font-bold",
                        current
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : done
                            ? "bg-emerald-600 text-white"
                            : "bg-background text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[11px]",
                          current ? "text-primary-foreground/95" : "text-muted-foreground",
                        )}
                      >
                        {item.shortHint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Revisa la configuración</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        {/* Columna principal del paso activo */}
        <div className="min-w-0 space-y-4 sm:space-y-5">
          {step === 0 && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-none bg-primary/10 text-primary">
                    <Store className="size-4" aria-hidden="true" />
                  </span>
                  <span>Paso 1 · Datos del negocio</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Define el nombre público de tu negocio, el enlace único con el que se registrarán
                  tus clientes y los días en los que atiendes.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-name">Nombre del negocio</Label>
                    <Input
                      id="onboarding-name"
                      value={draft.name}
                      onChange={(event) => handleNameChange(event.target.value)}
                      placeholder="Ej. Café Aurora"
                      maxLength={120}
                    />
                    <p className="text-xs text-muted-foreground">
                      Es el nombre visible para tus clientes en su billetera de puntos y códigos QR.
                    </p>
                  </div>

                  {!business ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-slug">Slug (identificador en URL)</Label>
                      <Input
                        id="onboarding-slug"
                        value={draft.slug}
                        onChange={(event) => handleSlugChange(event.target.value)}
                        placeholder="mi-negocio"
                        aria-invalid={!slugValid}
                        maxLength={80}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span
                          className={cn(
                            !slugValid
                              ? "font-medium text-destructive dark:text-red-400"
                              : "text-muted-foreground",
                          )}
                        >
                          Solo minúsculas, números y guiones. Único por negocio.
                        </span>
                        <span className="inline-flex max-w-full items-center gap-1 break-all rounded-none bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                          <Link2 className="size-3 shrink-0 text-primary" aria-hidden="true" />
                          /join/{previewSlug}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Enlace de invitación</Label>
                      <div className="flex min-h-9 items-center gap-2 rounded-none border border-border/80 bg-muted/40 px-3 py-1.5 font-mono text-xs text-foreground">
                        <Link2 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span className="truncate">{joinPreviewUrl}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Identificador único asignado al crear el negocio.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboarding-timezone">Zona horaria</Label>
                  <select
                    id="onboarding-timezone"
                    value={draft.timezone}
                    onChange={(event) => patch({ timezone: event.target.value })}
                    className="flex h-9 w-full cursor-pointer rounded-none border border-input bg-background px-2 py-1 text-base font-medium shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/90 md:text-sm"
                  >
                    {timezoneOptions.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Zonas horarias frecuentes"
                  >
                    {COMMON_TIMEZONES.map((zone) => {
                      const active = draft.timezone === zone.value;
                      return (
                        <button
                          key={zone.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => patch({ timezone: zone.value })}
                          className={cn(
                            "min-h-8 cursor-pointer rounded-none border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {zone.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se usa para mostrar las fechas en tu hora local y calcular vencimientos.
                  </p>
                </div>

                <div className="space-y-3 rounded-none border border-border/80 bg-muted/20 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                      Días de operación
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => patch({ operatingDays: [...preset.days] })}
                          className="cursor-pointer rounded-none border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {Object.entries(DAY_LABELS).map(([day, label]) => {
                      const value = Number(day);
                      const selected = draft.operatingDays.includes(value);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleDay(value)}
                          className={cn(
                            "min-h-10 cursor-pointer rounded-none border px-2.5 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-11 sm:px-3 sm:py-2",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Con base en estos días estimamos automáticamente ~{estimatedMonthlyDays} días de
                    operación al mes para proyectar tus ventas. Puedes ajustarlos después.
                  </p>
                </div>

                <div className="flex justify-end border-t border-border/70 pt-4">
                  <Button
                    type="button"
                    onClick={() => void saveBusinessStep()}
                    loading={isSavingBusiness}
                  >
                    Guardar y continuar
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && business && (
            <div className="space-y-4 sm:space-y-5">
              <EconomicDataForm
                key={`${business.id}:${profile && !isEconomicProfileEmpty(profile) ? profile.updated_at : "empty"}:${estimatedMonthlyDays}`}
                businessId={business.id}
                profile={profile}
                title="Paso 2 · Datos económicos"
                intro="Todos estos datos son opcionales: si no los tienes a la mano, puedes dejarlos vacíos o saltar este paso sin problema. Sin embargo, proporcionarlos nos ayuda a realizar el análisis financiero de tu negocio para calcular el presupuesto ideal y las recompensas más rentables sin afectar tu utilidad."
                submitLabel="Guardar y continuar"
                autoStatus
                suggestedOperationDays={estimatedMonthlyDays}
                onSaved={() => go(2)}
              />

              <div className="flex flex-wrap justify-between gap-2 px-4 sm:px-0">
                <Button type="button" variant="outline" onClick={() => go(0)}>
                  <ArrowLeft aria-hidden="true" />
                  Volver
                </Button>
                <Button type="button" variant="ghost" onClick={() => go(2)}>
                  Saltar por ahora
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && business && (
            <div className="space-y-4 sm:space-y-5">
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-none bg-primary/10 text-primary">
                      <CircleDollarSign className="size-4" aria-hidden="true" />
                    </span>
                    <span>Paso 3 · Programa y activación</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Configura cuántos loopoints acumulan tus clientes por cada compra y qué parte de
                    tus ventas destinas a premios. Con estas reglas se calcula el valor de cada
                    loopoint y podrás activar tu programa al instante.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-cop-per-point">COP por loopoint ganado</Label>
                      <Input
                        id="onboarding-cop-per-point"
                        inputMode="numeric"
                        value={draft.copPerPointUnit}
                        onChange={(event) => patch({ copPerPointUnit: event.target.value })}
                      />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        ¿Cuánto debe comprar un cliente para sumar 1 loopoint? Ahora mismo gana{" "}
                        <strong>1 loopoint por cada {formatCOP(copPerPoint || 0)}</strong>{" "}
                        elegibles.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-budget-rate">Tasa de presupuesto (%)</Label>
                      <Input
                        id="onboarding-budget-rate"
                        inputMode="decimal"
                        value={draft.budgetRatePercent}
                        onChange={(event) =>
                          patch({
                            budgetRatePercent: event.target.value,
                            budgetRateEdited: true,
                          })
                        }
                      />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Porcentaje de tus ventas mensuales destinado a recompensas (recomendado: 1 %
                        a 5 %).{" "}
                        {referenceBudget !== null &&
                          `Equivale a ≈ ${formatCOP(referenceBudget)}/mes sobre tus ventas estimadas.`}
                      </p>
                      {suggestedRateFromCap !== null &&
                        parsedBudgetRatePercent !== suggestedRateFromCap && (
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                budgetRatePercent: String(suggestedRateFromCap),
                                budgetRateEdited: true,
                              })
                            }
                            className="cursor-pointer text-xs font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Ajustar al tope mensual ({suggestedRateFromCap} %)
                          </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-expiry">Vencimiento de loopoints (días)</Label>
                      <Input
                        id="onboarding-expiry"
                        inputMode="numeric"
                        value={draft.pointsExpiryDays}
                        onChange={(event) => patch({ pointsExpiryDays: event.target.value })}
                      />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Plazo en días antes de que caduquen los loopoints desde la compra que los
                        generó (ej. 365 días = 1 año). Incentiva visitas frecuentes.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-qr">Vigencia del QR (horas)</Label>
                      <Input
                        id="onboarding-qr"
                        inputMode="numeric"
                        value={draft.qrExpiryHours}
                        onChange={(event) => patch({ qrExpiryHours: event.target.value })}
                      />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Tiempo máximo durante el cual el QR de una venta sigue siendo válido para
                        que el cliente lo escanee y sume sus loopoints (ej. 24 horas).
                      </p>
                    </div>
                  </div>

                  {examplePurchasePoints !== null && (
                    <div className="space-y-1.5 rounded-none border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm sm:px-4 sm:py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <Calculator className="size-4 text-primary" aria-hidden="true" />
                          Simulación rápida en caja
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">
                          Compra de {formatCOP(50000)} = {formatNumber(examplePurchasePoints)}{" "}
                          loopoints
                          {costPerPoint !== null &&
                            ` (costo est. ${formatCOP(Math.round(examplePurchasePoints * costPerPoint))})`}
                        </span>
                      </div>
                      {exampleAvgTicketPoints !== null && avgTicket !== null && (
                        <p className="text-xs text-muted-foreground">
                          En tu ticket promedio ({formatCOP(avgTicket)}), el cliente sumaría{" "}
                          <strong>{formatNumber(exampleAvgTicketPoints)} loopoint(s)</strong> por
                          visita.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="size-4 text-amber-500" aria-hidden="true" />
                      Recompensas sugeridas
                    </CardTitle>
                    {productsWithCost.length > 0 && (
                      <Badge variant="default">
                        {selectedRewardsCount} seleccionada{selectedRewardsCount === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productsWithCost.length === 0 ? (
                    <p className="rounded-none border border-dashed p-4 text-sm leading-relaxed text-muted-foreground">
                      Puedes activar el programa ahora mismo sin premios iniciales y luego añadir
                      tus productos en <strong>Carta</strong> y tus recompensas personalizadas en{" "}
                      <strong>Recompensas</strong> desde el panel de administración.
                    </p>
                  ) : (
                    productsWithCost.map((product) => {
                      const suggested = suggestedPoints(product);
                      if (suggested === null) return null;
                      const isIncluded = included(product.id);
                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "grid gap-3 rounded-none border p-3.5 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_145px] sm:items-center sm:p-4",
                            isIncluded
                              ? "border-primary/40 bg-primary/[0.03]"
                              : "border-border bg-muted/20 opacity-75",
                          )}
                        >
                          <label className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-none hover:bg-muted/60">
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
                              className="size-4 cursor-pointer rounded-none border-input accent-primary"
                            />
                          </label>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold">{product.name} gratis</p>
                            <p className="text-xs text-muted-foreground">
                              Costo {formatCOP(product.cost_cop ?? 0)} · Precio{" "}
                              {formatCOP(product.price_cop)}
                            </p>
                            <p className="text-xs font-medium text-primary">
                              Loopoints sugeridos: {formatNumber(suggested)} (editable)
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`reward-points-${product.id}`} className="text-xs">
                              Loopoints para {product.name}
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
                      {productsWithoutCost.length === 1 ? "" : "s"} sin costo no aparece
                      {productsWithoutCost.length === 1 ? "" : "n"} en la propuesta.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="size-4 text-primary" aria-hidden="true" />
                    Análisis financiero y supuestos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-none border border-border/80 bg-muted/25 p-3">
                      <span className="block text-[11px] font-medium text-muted-foreground">
                        Ventas mensuales est.
                      </span>
                      <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                        {monthlySales !== null ? formatCOP(monthlySales) : "Sin estimación"}
                      </span>
                    </div>
                    <div className="rounded-none border border-border/80 bg-muted/25 p-3">
                      <span className="block text-[11px] font-medium text-muted-foreground">
                        Presupuesto máximo usado
                      </span>
                      <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                        {maxBudget !== null ? formatCOP(maxBudget) : "Sin dato"}
                      </span>
                    </div>
                    <div className="rounded-none border border-border/80 bg-muted/25 p-3">
                      <span className="block text-[11px] font-medium text-muted-foreground">
                        Valor por loopoint
                      </span>
                      <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                        {costPerPoint !== null ? formatCOP(costPerPoint) : "Sin definir"}
                      </span>
                    </div>
                    <div className="rounded-none border border-border/80 bg-muted/25 p-3">
                      <span className="block text-[11px] font-medium text-muted-foreground">
                        Impacto en utilidad
                      </span>
                      <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums">
                        {utilityAbsorptionPct !== null ? `${utilityAbsorptionPct} %` : "Sin dato"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 leading-relaxed">
                    <p>
                      Los clientes ganan 1 loopoint por cada{" "}
                      <strong>{formatCOP(copPerPoint || 0)}</strong> de compra elegible.
                    </p>
                    <p>
                      Presupuesto objetivo:{" "}
                      <strong>
                        {Number.isFinite(parsedBudgetRatePercent)
                          ? draft.budgetRatePercent.trim()
                          : "—"}{" "}
                        %
                      </strong>{" "}
                      de las ventas mensuales
                      {referenceBudget !== null ? ` (≈ ${formatCOP(referenceBudget)} al mes)` : ""}.
                    </p>
                    {monthlySales !== null ? (
                      <p>
                        Ventas mensuales estimadas: <strong>{formatCOP(monthlySales)}</strong>.
                      </p>
                    ) : (
                      <p className="text-amber-700 dark:text-amber-400">
                        No se pueden calcular las ventas mensuales: faltan ventas diarias o días de
                        operación en el paso 2 (Datos económicos).
                      </p>
                    )}
                    {configuredMaxBudget !== null &&
                      referenceBudget !== null &&
                      referenceBudget > configuredMaxBudget && (
                        <p className="text-amber-700 dark:text-amber-400">
                          Con esta tasa ({draft.budgetRatePercent} %), el presupuesto estimado (
                          {formatCOP(referenceBudget)}) supera el tope mensual que definiste (
                          {formatCOP(configuredMaxBudget)}).
                        </p>
                      )}
                    {costPerPoint !== null ? (
                      <p>
                        Costo estimado por loopoint: <strong>{formatCOP(costPerPoint)}</strong> (
                        {formatNumber(pointsPerThousand)} loopoints equivalen a $1.000 en premios).
                      </p>
                    ) : (
                      <p className="text-amber-700 dark:text-amber-400">
                        No se puede calcular el costo por loopoint (tasa de presupuesto en 0 % o
                        valor por loopoint inválido), así que no hay propuesta de loopoints.
                      </p>
                    )}
                    {monthlyGain !== null &&
                    effectiveProgramBudget !== null &&
                    utilityAbsorptionPct !== null ? (
                      <p>
                        Sobre una ganancia mensual estimada de{" "}
                        <strong>{formatCOP(monthlyGain)}</strong>, el programa representa
                        aproximadamente el <strong>{utilityAbsorptionPct} %</strong> de tu utilidad.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Sin ganancia diaria ni margen bruto: no se puede estimar cuánto absorbe el
                        programa de la utilidad.
                      </p>
                    )}
                    {effectiveGrossMargin !== null && netMarginAfterRewards !== null ? (
                      <p>
                        Con un margen bruto del <strong>{effectiveGrossMargin} %</strong>, tras
                        recompensas conservarías un margen aproximado del{" "}
                        <strong>{netMarginAfterRewards} %</strong>.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Sin margen bruto: no se puede estimar el impacto en el margen.
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Es una estimación comercial para orientar el presupuesto, no un costo
                      contable. Presupuesto máximo usado:{" "}
                      {maxBudget !== null ? formatCOP(maxBudget) : "sin dato"}.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-0">
                <Button type="button" variant="outline" onClick={() => go(1)}>
                  <ArrowLeft aria-hidden="true" />
                  Volver
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraftDirty(true);
                      toast.success("Borrador guardado en este navegador.");
                    }}
                  >
                    <Save aria-hidden="true" />
                    Guardar borrador
                  </Button>
                  <Button type="button" onClick={() => void activateProgram()} loading={activating}>
                    <CheckCircle2 aria-hidden="true" />
                    Activar programa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra lateral de resumen en vivo (desktop) */}
        <aside className="space-y-4 xl:sticky xl:top-6" aria-label="Resumen en vivo">
          <Card className="overflow-hidden">
            <div className="border-b border-border/80 bg-muted/40 px-5 py-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Resumen del programa
              </p>
            </div>
            <CardContent className="space-y-4 p-4 text-sm sm:p-5">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Negocio</p>
                <p className="truncate font-semibold">
                  {draft.name || business?.name || "Sin nombre aún"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  /join/{previewSlug}
                </p>
                <p className="text-xs text-muted-foreground">
                  {draft.operatingDays.length} día{draft.operatingDays.length === 1 ? "" : "s"} de
                  operación · {draft.timezone}
                </p>
              </div>

              <div className="h-px bg-border/70" />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Datos económicos (opcional)</p>
                <p className="font-semibold tabular-nums">
                  {monthlySales !== null
                    ? `${formatCOP(monthlySales)} / mes`
                    : "Pendiente de estimar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {effectiveGrossMargin !== null
                    ? `Margen bruto: ${effectiveGrossMargin} %`
                    : "Sin margen registrado"}
                  {configuredMaxBudget !== null ? ` · Tope ${formatCOP(configuredMaxBudget)}` : ""}
                </p>
              </div>

              <div className="h-px bg-border/70" />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Regla de acumulación</p>
                <p className="font-mono text-sm font-bold tabular-nums text-primary">
                  1 PTO /{" "}
                  {formatCOP(Number.isInteger(copPerPoint) && copPerPoint > 0 ? copPerPoint : 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Presupuesto objetivo:{" "}
                  {Number.isFinite(parsedBudgetRatePercent) ? draft.budgetRatePercent.trim() : "—"}{" "}
                  %
                  {productsWithCost.length > 0
                    ? ` · ${selectedRewardsCount} recompensa${selectedRewardsCount === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>

              <div className="h-px bg-border/70" />

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="leading-relaxed">
                  Tu avance se guarda automáticamente en este navegador por si necesitas continuar
                  después.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start px-2 text-xs text-muted-foreground"
                  onClick={restart}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reiniciar borrador
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
