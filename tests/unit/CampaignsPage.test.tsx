import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CampaignsPage } from '@/features/admin/CampaignsPage';
import type { Business, LoyaltyCampaign } from '@/types';

const upsert = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());

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
  campaigns: [
    {
      id: 'camp-1',
      business_id: 'biz-1',
      name: 'Doble puntos',
      description: 'De lunes a jueves',
      multiplier: 2,
      bonus_points: 0,
      min_purchase_amount: 0,
      valid_from: '2026-10-01T12:00:00.000Z',
      valid_until: '2026-11-01T12:00:00.000Z',
      is_active: true,
      is_current: true,
      created_at: '2026-10-01T12:00:00.000Z',
      updated_at: '2026-10-01T12:00:00.000Z',
    },
    {
      id: 'camp-2',
      business_id: 'biz-1',
      name: 'Bono de bienvenida',
      description: '',
      multiplier: 1.5,
      bonus_points: 10,
      min_purchase_amount: 5000,
      valid_from: '2026-08-01T12:00:00.000Z',
      valid_until: null,
      is_active: false,
      is_current: false,
      created_at: '2026-08-01T12:00:00.000Z',
      updated_at: '2026-08-01T12:00:00.000Z',
    },
  ] as LoyaltyCampaign[],
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({
    data: [fixture.business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyCampaigns: () => ({
    data: fixture.campaigns,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpsertLoyaltyCampaign: () => ({ mutateAsync: upsert, isPending: false }),
  useDeleteLoyaltyCampaign: () => ({ mutateAsync: remove, isPending: false }),
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
      <CampaignsPage />
    </MemoryRouter>,
  );
}

describe('CampaignsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockResolvedValue({});
    remove.mockResolvedValue({});
  });

  it('lista las campañas con beneficio y estado', () => {
    renderPage();

    expect(screen.getByText('Doble puntos')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    expect(screen.getByText('En vigencia')).toBeInTheDocument();
    expect(screen.getByText('Bono de bienvenida')).toBeInTheDocument();
    expect(screen.getByText('+10 puntos')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('crea una campaña con los valores por defecto', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Nueva campaña/i }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Nombre'), 'Semana doble');
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        id: null,
        name: 'Semana doble',
        multiplier: 2,
        bonusPoints: 0,
        minPurchaseAmount: 0,
        isActive: true,
        validFrom: expect.any(String),
        validUntil: null,
      }),
    );
  });

  it('rechaza una fecha de fin anterior al inicio', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Nueva campaña/i }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Nombre'), 'Campaña inválida');
    await user.type(dialog.getByLabelText('Fin (opcional)'), '2020-01-01T00:00');
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText(/debe ser posterior al inicio/i),
    ).toBeInTheDocument();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('desactiva una campaña reenviando todos sus campos', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Desactivar Doble puntos' }),
    );

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'camp-1',
        name: 'Doble puntos',
        multiplier: 2,
        isActive: false,
      }),
    );
  });

  it('elimina una campaña con confirmación', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Eliminar Doble puntos' }),
    );
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(remove).toHaveBeenCalledWith({
      businessId: 'biz-1',
      campaignId: 'camp-1',
    });
  });
});
