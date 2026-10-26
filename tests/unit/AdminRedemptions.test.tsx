import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RedemptionsPage } from '@/features/admin/RedemptionsPage';
import type { LoyaltyRedemptionWithCustomer } from '@/types';

const approve = vi.hoisted(() => vi.fn());
const deliver = vi.hoisted(() => vi.fn());
const cancel = vi.hoisted(() => vi.fn());
const rows = vi.hoisted(() => ({ current: [] as LoyaltyRedemptionWithCustomer[] }));
const listArgs = vi.hoisted(() => ({ origin: '' }));
const ctx = vi.hoisted(() => ({ role: 'admin' as 'admin' | 'encargado' | 'cliente', canApprove: false }));

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

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyRedemptions: (_businessId: string, _status: string, origin = '') => {
    listArgs.origin = origin;
    return {
      data: rows.current,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useApproveRedemption: () => ({ mutateAsync: approve, isPending: false }),
  useDeliverRedemption: () => ({ mutateAsync: deliver, isPending: false }),
  useCancelRedemption: () => ({ mutateAsync: cancel, isPending: false }),
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

function redemption(
  overrides: Partial<LoyaltyRedemptionWithCustomer> = {},
): LoyaltyRedemptionWithCustomer {
  return {
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
    created_by: 'user-1',
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
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <RedemptionsPage />
    </MemoryRouter>,
  );
}

describe('RedemptionsPage del administrador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.role = 'admin';
    ctx.canApprove = false;
    rows.current = [
      redemption(),
      redemption({
        id: 'red-2',
        code: 'TPBBBB2222',
        status: 'approved',
        approved_at: '2026-10-21T12:00:00.000Z',
        customer_id: 'user-customer2',
        customer_email: 'diego@example.test',
        points_spent: 30,
        origin: 'qr_scan',
      }),
    ];
    approve.mockResolvedValue({ status: 'approved' });
    deliver.mockResolvedValue({ status: 'delivered' });
    cancel.mockResolvedValue({ status: 'cancelled', points_refunded: 40 });
  });

  it('muestra las solicitudes con cliente, estado y acciones por rol', () => {
    renderPage();

    expect(screen.getByText('carla@example.test')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de validar')).toBeInTheDocument();
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument();
  });

  it('muestra el origen y filtra por QR escaneado', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('QR escaneado', { exact: true })).toBeInTheDocument();
    expect(screen.getAllByText('Solicitud', { exact: true }).length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('combobox', { name: 'Filtrar por origen' }),
    );
    await user.click(await screen.findByRole('option', { name: 'QR escaneado' }));

    await waitFor(() => expect(listArgs.origin).toBe('qr_scan'));
  });

  it('aprueba una solicitud pendiente', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Aprobar' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Aprobar solicitud')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Aprobar' }));

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      businessId: 'biz-1',
      redemptionId: 'red-1',
      approve: true,
    });
  });

  it('rechaza una solicitud y devuelve los loopoints', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Rechazar' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(
      dialog.getByRole('button', { name: 'Rechazar y devolver loopoints' }),
    );

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith(
      expect.objectContaining({ redemptionId: 'red-1', approve: false }),
    );
  });

  it('confirma la entrega de una solicitud aprobada', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Confirmar entrega' }));

    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
    expect(deliver).toHaveBeenCalledWith({
      businessId: 'biz-1',
      redemptionId: 'red-2',
    });
  });

  it('exige motivo para cancelar una solicitud pendiente', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(
      dialog.getByRole('button', { name: 'Cancelar y devolver loopoints' }),
    );

    expect(cancel).not.toHaveBeenCalled();
    expect(dialog.getByText('Cancelar solicitud')).toBeInTheDocument();

    await user.type(
      dialog.getByLabelText('Motivo de la cancelación'),
      'El cliente no se presentó',
    );
    await user.click(
      dialog.getByRole('button', { name: 'Cancelar y devolver loopoints' }),
    );

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(cancel).toHaveBeenCalledWith({
      businessId: 'biz-1',
      redemptionId: 'red-1',
      reason: 'El cliente no se presentó',
    });
  });

  it('oculta las acciones cuando el rol no puede aprobar', () => {
    ctx.role = 'encargado';
    ctx.canApprove = false;
    renderPage();

    expect(screen.getByText(/no tienes permiso de aprobación/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar entrega' })).not.toBeInTheDocument();
  });
});
