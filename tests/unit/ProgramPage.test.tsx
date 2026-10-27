import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProgramPage } from '@/features/admin/ProgramPage';
import type { Business, LoyaltyProgram } from '@/types';

const configure = vi.hoisted(() => vi.fn());
const expirePoints = vi.hoisted(() => vi.fn());
const programData = vi.hoisted(() => ({ current: null as LoyaltyProgram | null }));

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

const business: Business = fixture.business;

function unconfiguredProgram(): LoyaltyProgram {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    business_id: business.id,
    cop_per_point_unit: 1000,
    points_per_cop_unit: 100,
    points_expiry_days: 365,
    budget_rate: 0.01,
    first_purchase_bonus_points: 0,
    recurrence_bonus_points: 0,
    referral_bonus_points: 0,
    qr_expiry_hours: 24,
    frequent_min_purchases: 3,
    frequent_period_days: 90,
    frequent_min_spend_cop: 0,
    frequent_active_days: 30,
    recovery_inactive_days: 60,
    is_active: false,
    configured_by: null,
    configured_at: null,
    created_at: '',
    updated_at: '',
  };
}

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyProgram: () => ({
    data: programData.current,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useConfigureLoyaltyProgram: () => ({ mutateAsync: configure, isPending: false }),
  useExpirePointsDue: () => ({ mutateAsync: expirePoints, isPending: false }),
  useUpdateFrequentCriteria: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
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
      <ProgramPage />
    </MemoryRouter>,
  );
}

describe('ProgramPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    programData.current = unconfiguredProgram();
    configure.mockResolvedValue(unconfiguredProgram());
  });

  it('carga valores sugeridos cuando el programa no está configurado', () => {
    renderPage();

    expect(
      screen.getByText('El programa aún no está configurado'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('COP por loopoint ganado')).toHaveValue('1000');
    expect(screen.getByLabelText('Loopoints que equivalen a $1.000')).toHaveValue('100');
    expect(screen.getByLabelText('Vencimiento de loopoints (días)')).toHaveValue('365');
    expect(screen.getByLabelText('Vigencia del QR (horas)')).toHaveValue('24');
    expect(screen.getAllByText(/1 loopoint = \$/).length).toBeGreaterThan(0);
  });

  it('guarda el programa con la tasa convertida y activo', async () => {
    const user = userEvent.setup();
    renderPage();

    const copInput = screen.getByLabelText('COP por loopoint ganado');
    await user.clear(copInput);
    await user.type(copInput, '2000');

    const budget = screen.getByLabelText('Tasa de presupuesto (%)');
    await user.clear(budget);
    await user.type(budget, '2.5');

    await user.click(screen.getByLabelText(/programa activo/i));
    await user.click(screen.getByRole('button', { name: 'Guardar y activar' }));

    await waitFor(() => expect(configure).toHaveBeenCalledTimes(1));
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        copPerPointUnit: 2000,
        pointsPerCopUnit: 100,
        pointsExpiryDays: 365,
        budgetRate: 0.025,
        qrExpiryHours: 24,
        isActive: true,
      }),
    );
  });

  it('bloquea el guardado con un vencimiento inválido', async () => {
    const user = userEvent.setup();
    renderPage();

    const expiry = screen.getByLabelText('Vencimiento de loopoints (días)');
    await user.clear(expiry);
    await user.type(expiry, '0');
    await user.click(screen.getByRole('button', { name: 'Guardar programa' }));

    expect(
      await screen.findByText(/el mínimo es 1/i),
    ).toBeInTheDocument();
    expect(configure).not.toHaveBeenCalled();
  });
});
