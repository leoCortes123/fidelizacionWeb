import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseRegistrationPage } from '@/features/admin/PurchaseRegistrationPage';
import type { Business, LoyaltyProgram, ProfileLookup } from '@/types';

const register = vi.hoisted(() => vi.fn());
const revert = vi.hoisted(() => vi.fn());
const programState = vi.hoisted(() => ({ active: true }));

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
    is_active: true,
    configured_by: 'user-admin',
    configured_at: '2026-01-01T12:00:00.000Z',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
  } as LoyaltyProgram,
  customer: {
    user_id: 'user-customer',
    full_name: 'Carla Cliente',
    email: 'carla@example.test',
    already_member: true,
  } as ProfileLookup,
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
    data: { ...fixture.program, is_active: programState.active },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useSearchProfiles: (_businessId: string, query: string) => ({
    data: query.trim().length >= 2 ? [fixture.customer] : [],
    isFetching: false,
    isError: false,
    error: null,
  }),
  useRegisterPurchase: () => ({ mutateAsync: register, isPending: false }),
  useRevertPurchase: () => ({ mutateAsync: revert, isPending: false }),
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
      <PurchaseRegistrationPage />
    </MemoryRouter>,
  );
}

async function selectCustomerAndAmount(amount = '15500') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Cliente'), 'carla');
  await user.click(await screen.findByRole('button', { name: /Carla Cliente/ }));
  await user.type(screen.getByLabelText('Importe de la compra (COP)'), amount);
  return user;
}

describe('PurchaseRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    programState.active = true;
  });

  it('calcula la vista previa de puntos con el valor por punto', async () => {
    renderPage();
    await selectCustomerAndAmount();

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(
      screen.getByText(/1 punto por cada \$ 1\.000 elegibles/i),
    ).toBeInTheDocument();
  });

  it('registra la compra con importe elegible e idempotencia', async () => {
    register.mockResolvedValue({
      points_earned: 15,
      balance: 15,
      duplicate: false,
      account_id: 'acc-1',
      purchase_event_id: 'event-1',
    });

    renderPage();
    const user = await selectCustomerAndAmount();
    await user.click(screen.getByRole('button', { name: /Acreditar puntos/i }));

    await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        customerId: 'user-customer',
        amountCop: 15500,
        eligibleAmountCop: 15500,
        idempotencyKey: expect.stringMatching(/^[A-Za-z0-9_-]{8,64}$/),
      }),
    );

    expect(await screen.findByText('Compra registrada')).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('reversa una compra registrada con motivo', async () => {
    register.mockResolvedValue({
      points_earned: 15,
      balance: 15,
      duplicate: false,
      account_id: 'acc-1',
      purchase_event_id: 'event-1',
    });
    revert.mockResolvedValue({ points_reversed: 15, balance: 0, duplicate: false });

    renderPage();
    const user = await selectCustomerAndAmount();
    await user.click(screen.getByRole('button', { name: /Acreditar puntos/i }));
    await user.click(
      await screen.findByRole('button', { name: /Reversar esta compra/i }),
    );

    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Motivo'), 'Cobro duplicado');
    await user.click(dialog.getByRole('button', { name: 'Reversar' }));

    await waitFor(() => expect(revert).toHaveBeenCalledTimes(1));
    expect(revert).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        customerId: 'user-customer',
        eventId: 'event-1',
        reason: 'Cobro duplicado',
      }),
    );
  });

  it('bloquea el registro cuando el programa está inactivo', () => {
    programState.active = false;
    renderPage();

    expect(
      screen.getByText(/el programa de puntos está inactivo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Acreditar puntos/i }),
    ).toBeDisabled();

    programState.active = true;
  });
});
