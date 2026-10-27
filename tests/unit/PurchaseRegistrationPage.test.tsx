import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseRegistrationPage } from '@/features/admin/PurchaseRegistrationPage';
import type { Business, LoyaltyProgram, PurchaseQrCreateResult } from '@/types';

const createMutate = vi.hoisted(() => vi.fn());
const programState = vi.hoisted(() => ({ active: true }));

const business: Business = {
  id: 'biz-1',
  name: 'Taquería El Fogón',
  slug: 'taqueria-el-fogon',
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

const result: PurchaseQrCreateResult = {
  purchase_id: 'purchase-1',
  token: 'tok_123456789012345678901234567890',
  business_id: 'biz-1',
  business_name: 'Taquería El Fogón',
  amount_cop: 15500,
  points_preview: 15,
  expires_at: '2026-10-23T02:00:00.000Z',
  status: 'pending_claim',
};

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div data-testid="qr" data-value={value} />
  ),
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({
    data: [business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyProgram: () => ({
    data: { ...program, is_active: programState.active },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useProducts: () => ({
    data: [
      {
        id: 'prod-taco',
        business_id: 'biz-1',
        name: 'Taco de guisado',
        description: null,
        price_cop: 2500,
        cost_cop: 800,
        is_active: true,
        kind: 'simple',
        combo_items: [],
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: business,
    businesses: [business],
    selectedRole: 'admin',
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

vi.mock('@/features/purchases/hooks', () => ({
  useCreatePurchaseQr: () => ({
    mutate: createMutate,
    isPending: false,
  }),
  useBusinessPurchases: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PurchaseRegistrationPage />
    </MemoryRouter>,
  );
}

describe('PurchaseRegistrationPage (venta con QR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    programState.active = true;
  });

  it('valida el importe, previsualiza loopoints y genera el QR de la venta', async () => {
    createMutate.mockImplementation((_amount, options) => {
      options?.onSuccess?.(result);
    });
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('heading', { name: /Registrar compra/ })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: /importe de la compra/i });
    await user.type(input, '15500');
    expect(await screen.findByText(/\+15 loopoints/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar qr de la venta/i }));
    expect(createMutate).toHaveBeenCalledWith(
      { amountCop: 15500, items: [] },
      expect.any(Object),
    );

    expect(
      await screen.findByText(/escanéalo para sumar loopoints/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('qr')).toHaveAttribute(
      'data-value',
      'https://fidelizacion01.vercel.app/claim/tok_123456789012345678901234567890',
    );
    expect(screen.getByTestId('claim-url').textContent).toContain(
      '/claim/tok_123456789012345678901234567890',
    );
    expect(screen.getByText(/15 loopoints estimados/i)).toBeInTheDocument();
  });

  it('suma productos de la carta y envía las líneas', async () => {
    createMutate.mockImplementation((_input, options) => {
      options?.onSuccess?.(result);
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: /elegir de la carta/i }));
    await user.click(screen.getByRole('button', { name: /añadir taco de guisado/i }));
    await user.click(screen.getByRole('button', { name: /añadir taco de guisado/i }));
    expect(await screen.findByTestId('catalog-total')).toHaveTextContent('5.000');

    await user.click(screen.getByRole('button', { name: /generar qr de la venta/i }));
    expect(createMutate).toHaveBeenCalledWith(
      {
        amountCop: 5000,
        items: [{ product_id: 'prod-taco', quantity: 2 }],
      },
      expect.any(Object),
    );
  });

  it('no envía importes en cero', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /generar qr de la venta/i }));
    expect(createMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText(/introduce un importe mayor que cero/i),
    ).toBeInTheDocument();
  });

  it('bloquea la venta si el programa está inactivo', () => {
    programState.active = false;
    renderPage();

    expect(
      screen.getByRole('button', { name: /generar qr de la venta/i }),
    ).toBeDisabled();
    expect(screen.getByText(/programa de loopoints está inactivo/i)).toBeInTheDocument();
  });
});
