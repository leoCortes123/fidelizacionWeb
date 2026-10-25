import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RewardsPage } from '@/features/admin/RewardsPage';
import type { LoyaltyReward, Product } from '@/types';

const upsert = vi.hoisted(() => vi.fn());

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
  ] as Product[],
  rewards: [
    {
      id: 'rew-taco',
      business_id: 'biz-1',
      product_id: 'prod-taco',
      type: 'free_product',
      name: 'Taco gratis',
      description: 'Un taco de guisado.',
      points_required: 40,
      min_purchase_amount: 5000,
      max_discount_amount: null,
      discount_percentage: null,
      product_price_cop: 2500,
      product_cost_cop: 800,
      is_active: true,
      valid_from: '2026-10-01T00:00:00.000Z',
      valid_until: '2026-12-31T23:59:59.999Z',
      max_redemptions_per_customer: 2,
      max_redemptions_per_period: 1,
      redemption_period_days: 30,
      total_redemption_limit: 100,
      created_by: 'user-admin',
      created_at: '2026-10-01T00:00:00.000Z',
      updated_at: '2026-10-01T00:00:00.000Z',
      times_redeemed: 1,
    },
  ] as LoyaltyReward[],
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyRewards: () => ({
    data: fixture.rewards,
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
  useUpsertLoyaltyReward: () => ({ mutateAsync: upsert, isPending: false }),
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: 'admin',
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <RewardsPage />
    </MemoryRouter>,
  );
}

async function openCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Nueva recompensa/i }));
  return within(screen.getByRole('dialog'));
}

describe('RewardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockResolvedValue({});
  });

  it('muestra los detalles completos de una recompensa', () => {
    renderPage();

    expect(screen.getByText('Taco gratis')).toBeInTheDocument();
    expect(screen.getByText('Producto gratuito', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/producto: taco de guisado/i)).toBeInTheDocument();
    expect(screen.getByText(/compra mínima/i)).toBeInTheDocument();
    expect(screen.getByText(/máx\. 2 por cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/canjeadas: 1/i)).toBeInTheDocument();
  });

  it('crea una recompensa de producto gratis vinculada a la carta', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openCreate(user);

    await user.type(dialog.getByLabelText('Nombre'), 'Taco del mes');
    await user.type(dialog.getByLabelText('Puntos requeridos'), '25');
    await user.type(dialog.getByLabelText('Compra mínima (COP)'), '4.000');
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        id: null,
        type: 'free_product',
        productId: 'prod-taco',
        name: 'Taco del mes',
        pointsRequired: 25,
        minPurchaseAmount: 4000,
        maxDiscountAmount: null,
        discountPercentage: null,
        isActive: true,
      }),
    );
  });

  it('exige porcentaje cuando la recompensa es porcentual', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openCreate(user);

    await user.type(dialog.getByLabelText('Nombre'), 'Descuento del 10 %');
    await user.type(dialog.getByLabelText('Puntos requeridos'), '20');
    await user.click(dialog.getByRole('combobox', { name: /tipo de recompensa/i }));
    await user.click(
      await screen.findByRole('option', { name: 'Descuento porcentual' }),
    );

    // El campo de producto desaparece y aparece el porcentaje.
    expect(dialog.queryByLabelText('Producto que se entrega')).not.toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText(/indica el porcentaje de descuento/i),
    ).toBeInTheDocument();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rechaza un descuento mayor que la compra mínima', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openCreate(user);

    await user.type(dialog.getByLabelText('Nombre'), 'Descuento fijo');
    await user.type(dialog.getByLabelText('Puntos requeridos'), '20');
    await user.click(dialog.getByRole('combobox', { name: /tipo de recompensa/i }));
    await user.click(await screen.findByRole('option', { name: 'Descuento fijo' }));

    await user.type(dialog.getByLabelText('Compra mínima (COP)'), '5.000');
    await user.type(dialog.getByLabelText('Importe del descuento (COP)'), '6.000');
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText(/no puede superar la compra mínima/i),
    ).toBeInTheDocument();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('al desactivar conserva todos los campos configurados', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Desactivar Taco gratis' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rew-taco',
        type: 'free_product',
        productId: 'prod-taco',
        minPurchaseAmount: 5000,
        validFrom: '2026-10-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.999Z',
        maxRedemptionsPerCustomer: 2,
        maxRedemptionsPerPeriod: 1,
        redemptionPeriodDays: 30,
        totalRedemptionLimit: 100,
        isActive: false,
      }),
    );
  });
});
