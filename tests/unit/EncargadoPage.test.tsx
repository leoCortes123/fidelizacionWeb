import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EncargadoPage } from '@/features/loyalty/EncargadoPage';
import type { LoyaltyRedemptionWithCustomer } from '@/types';

const validate = vi.hoisted(() => vi.fn());
const approve = vi.hoisted(() => vi.fn());
const deliver = vi.hoisted(() => vi.fn());
const ctx = vi.hoisted(() => ({
  role: 'admin' as 'admin' | 'encargado' | 'cliente',
  canApprove: false,
}));

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
}));

const pendingRow: LoyaltyRedemptionWithCustomer = {
  id: 'red-1',
  business_id: 'biz-1',
  account_id: 'acc-1',
  reward_id: 'rew-1',
  reward_name: 'Taco gratis',
  reward_type: 'free_product',
  points_spent: 40,
  code: 'TPAAAA1111',
  status: 'pending',
  idempotency_key: 'key-1',
  created_by: 'user-customer',
  created_at: '2026-10-20T12:00:00.000Z',
  approved_by: null,
  approved_at: null,
  delivered_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  origin: 'manual',
  customer_id: 'user-customer',
  customer_email: 'carla@example.test',
  customer_nickname: 'carla',
};

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyRedemptions: (_businessId: string, status: string) => ({
    data: status === 'pending' ? [pendingRow] : [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useValidateRedemptionToken: () => ({ mutateAsync: validate, isPending: false }),
  useApproveRedemption: () => ({ mutateAsync: approve, isPending: false }),
  useDeliverRedemption: () => ({ mutateAsync: deliver, isPending: false }),
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: ctx.role,
    canApproveRedemptions: ctx.canApprove,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EncargadoPage />
    </MemoryRouter>,
  );
}

describe('EncargadoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.role = 'admin';
    ctx.canApprove = false;
    validate.mockResolvedValue({
      redemption_id: 'red-1',
      reward_name: 'Taco gratis',
      reward_type: 'free_product',
      points_spent: 40,
      status: 'pending',
      customer_id: 'user-customer',
      expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      can_approve: true,
    });
    approve.mockResolvedValue({ status: 'approved' });
    deliver.mockResolvedValue({ status: 'delivered' });
  });

  it('valida, aprueba y confirma la entrega', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Código manual del QR'), 'tok_valido_1234567890');
    await user.click(screen.getByRole('button', { name: 'Validar token' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Taco gratis')).toBeInTheDocument();
    expect(dialog.getByText(/vence en/i)).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Aprobar' }));
    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      businessId: 'biz-1',
      redemptionId: 'red-1',
      approve: true,
    });

    expect(
      await screen.findByRole('heading', { name: 'Redención aprobada' }),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Confirmar entrega',
      }),
    );
    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
    expect(deliver).toHaveBeenCalledWith({
      businessId: 'biz-1',
      redemptionId: 'red-1',
    });
  });

  it('bloquea la aprobación cuando el QR venció', async () => {
    const user = userEvent.setup();
    validate.mockResolvedValue({
      redemption_id: 'red-1',
      reward_name: 'Taco gratis',
      reward_type: 'free_product',
      points_spent: 40,
      status: 'pending',
      customer_id: 'user-customer',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      can_approve: true,
    });
    renderPage();

    await user.type(screen.getByLabelText('Código manual del QR'), 'tok_vencido_1234567890');
    await user.click(screen.getByRole('button', { name: 'Validar token' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText(/el qr venció/i)).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Aprobar' })).toBeDisabled();
  });

  it('muestra un aviso si el encargado no tiene permiso', () => {
    ctx.role = 'encargado';
    ctx.canApprove = false;
    renderPage();

    expect(screen.getByText('Sin permiso de aprobación')).toBeInTheDocument();
    expect(screen.queryByLabelText('Código manual del QR')).not.toBeInTheDocument();
  });
});
