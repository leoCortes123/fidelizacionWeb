import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingWizardPage } from '@/features/loyalty/OnboardingWizardPage';
import type {
  Business,
  BusinessEconomicProfile,
  LoyaltyProgram,
  Product,
} from '@/types';

const saveBusiness = vi.hoisted(() => vi.fn());
const saveProduct = vi.hoisted(() => vi.fn());
const saveReward = vi.hoisted(() => vi.fn());
const configure = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({ profile: null as BusinessEconomicProfile | null }));

const fixture = vi.hoisted(() => ({
  business: {
    id: 'biz-1',
    name: 'Taquería El Fogón',
    slug: 'taqueria-el-fogon',
    timezone: 'America/Bogota',
    operating_days: [1, 2, 3, 4, 5, 6],
    is_active: true,
    created_by: 'user-admin',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    role: 'admin' as const,
    can_approve_redemptions: false,
  },
  program: {
    id: 'prog-1',
    business_id: 'biz-1',
    cop_per_point_unit: 1000,
    points_per_cop_unit: 100,
    points_expiry_days: 365,
    budget_rate: 0.01,
    first_purchase_bonus_points: 0,
    recurrence_bonus_points: 0,
    referral_bonus_points: 0,
    qr_expiry_hours: 24,
    is_active: false,
    configured_by: 'user-admin',
    configured_at: '2026-01-01T12:00:00.000Z',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
  } as LoyaltyProgram,
  products: [
    {
      id: 'prod-taco',
      business_id: 'biz-1',
      name: 'Taco de guisado',
      description: null,
      price_cop: 2500,
      cost_cop: 800,
      is_active: true,
      created_at: '2026-01-01T12:00:00.000Z',
      updated_at: '2026-01-01T12:00:00.000Z',
    },
    {
      id: 'prod-agua',
      business_id: 'biz-1',
      name: 'Agua fresca',
      description: null,
      price_cop: 1200,
      cost_cop: null,
      is_active: true,
      created_at: '2026-01-01T12:00:00.000Z',
      updated_at: '2026-01-01T12:00:00.000Z',
    },
  ] as Product[],
  profile: {
    id: 'profile-1',
    business_id: 'biz-1',
    daily_avg_sales: 200000,
    monthly_operation_days: 26,
    daily_gain: null,
    gross_margin: null,
    avg_customers_per_day: null,
    max_monthly_reward_budget: 100000,
    data_status: {
      daily_avg_sales: 'confirmed',
      monthly_operation_days: 'confirmed',
      daily_gain: 'unknown',
      gross_margin: 'unknown',
      avg_customers_per_day: 'unknown',
      max_monthly_reward_budget: 'confirmed',
    },
    updated_by: 'user-admin',
    updated_at: '2026-10-25T12:00:00.000Z',
  } as BusinessEconomicProfile,
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({
    data: [fixture.business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyProgram: () => ({
    data: fixture.program,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useProducts: () => ({
    data: fixture.products,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessEconomicProfile: () => ({
    data: state.profile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyRewards: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateBusiness: () => ({ mutateAsync: saveBusiness, isPending: false }),
  useUpsertProduct: () => ({ mutateAsync: saveProduct, isPending: false }),
  useUpsertLoyaltyReward: () => ({ mutateAsync: saveReward, isPending: false }),
  useConfigureLoyaltyProgram: () => ({ mutateAsync: configure, isPending: false }),
  useUpsertEconomicProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business as Business,
    businesses: [fixture.business],
    selectedRole: 'admin',
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <OnboardingWizardPage />
    </MemoryRouter>,
  );
}

function setDraft(partial: Record<string, unknown>) {
  window.localStorage.setItem(
    'fidelizacion:onboarding:biz-1',
    JSON.stringify({
      version: 2,
      step: 0,
      name: 'Taquería El Fogón',
      timezone: 'America/Bogota',
      operatingDays: [1, 2, 3, 4, 5, 6],
      copPerPointUnit: '1000',
      budgetRatePercent: '1',
      pointsExpiryDays: '365',
      qrExpiryHours: '24',
      rewardPoints: {},
      includedRewards: {},
      savedAt: '2026-10-25T12:00:00.000Z',
      ...partial,
    }),
  );
}

describe('OnboardingWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    state.profile = fixture.profile;
    saveBusiness.mockResolvedValue({});
    saveProduct.mockResolvedValue({});
    saveReward.mockResolvedValue({});
    configure.mockResolvedValue({});
  });

  it('guarda los datos del negocio y avanza al paso 2', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole('heading', { name: /Paso 1 · Datos del negocio/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Guardar y continuar/i }));

    await waitFor(() => expect(saveBusiness).toHaveBeenCalledTimes(1));
    expect(saveBusiness).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        name: 'Taquería El Fogón',
        timezone: 'America/Bogota',
        operatingDays: [1, 2, 3, 4, 5, 6],
      }),
    );
    expect(
      await screen.findByRole('heading', { name: /Paso 2 · Carta y costos/i }),
    ).toBeInTheDocument();
  });

  it('recupera el borrador guardado en localStorage', () => {
    setDraft({ step: 1, name: 'Nombre guardado' });
    renderPage();

    expect(screen.getByText(/Borrador recuperado/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Paso 2 · Carta y costos/i }),
    ).toBeInTheDocument();
  });

  it('añade un producto nuevo a la carta', async () => {
    const user = userEvent.setup();
    setDraft({ step: 1 });
    renderPage();

    await user.type(screen.getByLabelText('Nombre del producto'), 'Quesadilla');
    await user.type(screen.getByLabelText('Precio (COP)'), '3500');
    await user.type(screen.getByLabelText('Costo (COP, recomendado)'), '1200');
    await user.click(screen.getByRole('button', { name: /Añadir a la carta/i }));

    await waitFor(() => expect(saveProduct).toHaveBeenCalledTimes(1));
    expect(saveProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        name: 'Quesadilla',
        priceCop: 3500,
        costCop: 1200,
        isActive: true,
      }),
    );
  });

  it('calcula la propuesta y activa el programa con recompensas', async () => {
    const user = userEvent.setup();
    setDraft({ step: 3 });
    renderPage();

    expect(screen.getByLabelText('COP por punto ganado')).toHaveValue('1000');
    expect(screen.getByLabelText('Tasa de presupuesto (%)')).toHaveValue('1');
    expect(screen.getByLabelText('Puntos para Taco de guisado')).toHaveValue('80');
    expect(screen.getAllByText(/52\.000/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Activar programa/i }));

    await waitFor(() => expect(saveReward).toHaveBeenCalledTimes(1));
    expect(saveReward).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        type: 'free_product',
        productId: 'prod-taco',
        name: 'Taco de guisado gratis',
        pointsRequired: 80,
        isActive: true,
      }),
    );
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        copPerPointUnit: 1000,
        budgetRate: 0.01,
        isActive: true,
      }),
    );
    expect(window.localStorage.getItem('fidelizacion:onboarding:biz-1')).toBeNull();
  });

  it('explica qué indicadores faltan cuando no hay datos económicos', () => {
    state.profile = null;
    setDraft({ step: 3 });
    renderPage();

    expect(
      screen.getByText(/No se pueden calcular las ventas mensuales/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no se puede estimar cuánto absorbe el programa/i),
    ).toBeInTheDocument();
  });
});
