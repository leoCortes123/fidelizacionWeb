import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FrequentCriteriaCard } from '@/features/admin/FrequentCriteriaCard';
import type { Business, LoyaltyProgram } from '@/types';

const updateCriteria = vi.hoisted(() => vi.fn());

const business: Business = {
  id: 'biz-1',
  name: 'Café Loopoint',
  slug: 'cafe-loopoint',
  timezone: 'America/Bogota',
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  created_by: 'user-admin',
  created_at: '2026-01-01T12:00:00.000Z',
  updated_at: '2026-01-01T12:00:00.000Z',
  role: 'admin',
  can_approve_redemptions: false,
};

const program: LoyaltyProgram = {
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
  frequent_min_purchases: 3,
  frequent_period_days: 90,
  frequent_min_spend_cop: 0,
  frequent_active_days: 30,
  recovery_inactive_days: 60,
  is_active: true,
  configured_by: 'user-admin',
  configured_at: '2026-01-01T12:00:00.000Z',
  created_at: '2026-01-01T12:00:00.000Z',
  updated_at: '2026-01-01T12:00:00.000Z',
};

vi.mock('@/features/loyalty/hooks', () => ({
  useUpdateFrequentCriteria: () => ({
    mutateAsync: updateCriteria,
    isPending: false,
  }),
}));

describe('FrequentCriteriaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateCriteria.mockResolvedValue({
      business_id: 'biz-1',
      frequent_min_purchases: 4,
      frequent_period_days: 90,
      frequent_min_spend_cop: 0,
      frequent_active_days: 30,
      recovery_inactive_days: 60,
    });
  });

  it('explica las reglas actuales', () => {
    render(<FrequentCriteriaCard business={business} program={program} />);

    expect(
      screen.getByText(/Será/i).closest('p'),
    ).toHaveTextContent('3 compra(s)');
    expect(screen.getByLabelText('Compras para ser frecuente')).toHaveValue('3');
    expect(screen.getByLabelText('Ventana móvil (días)')).toHaveValue('90');
  });

  it('guarda los criterios modificados', async () => {
    const user = userEvent.setup();
    render(<FrequentCriteriaCard business={business} program={program} />);

    const minPurchases = screen.getByLabelText('Compras para ser frecuente');
    await user.clear(minPurchases);
    await user.type(minPurchases, '4');
    await user.click(screen.getByRole('button', { name: /Guardar criterios/i }));

    await waitFor(() => {
      expect(updateCriteria).toHaveBeenCalledWith({
        businessId: 'biz-1',
        minPurchases: 4,
        periodDays: 90,
        minSpendCop: 0,
        activeDays: 30,
        recoveryDays: 60,
      });
    });
  });

  it('rechaza recuperación menor o igual que los días activo', async () => {
    const user = userEvent.setup();
    render(<FrequentCriteriaCard business={business} program={program} />);

    const recovery = screen.getByLabelText('Días para recuperación');
    await user.clear(recovery);
    await user.type(recovery, '20');
    await user.click(screen.getByRole('button', { name: /Guardar criterios/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/deben ser mayores que los días/i),
      ).toBeInTheDocument();
    });
    expect(updateCriteria).not.toHaveBeenCalled();
  });
});
