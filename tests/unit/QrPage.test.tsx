import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QrPage } from '@/features/admin/QrPage';
import type { CreatePurchaseResult } from '@/types';

const createMutate = vi.hoisted(() => vi.fn());

const result: CreatePurchaseResult = {
  purchase_id: 'purchase-1',
  token: 'tok_123456789012345678901234567890',
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

vi.mock('@/features/points/hooks', () => ({
  useProgramSettings: () => ({
    data: {
      cop_per_point_unit: 1000,
      min_purchase_amount: 0,
      max_points_per_purchase: 500,
      qr_expiry_hours: 24,
      points_expiry_days: null,
      history_page_size: 10,
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/admin/hooks', () => ({
  useCreatePurchase: () => ({
    mutate: createMutate,
    isPending: false,
  }),
  useAdminPurchases: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('QrPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valida el importe, previsualiza puntos y genera el QR', async () => {
    createMutate.mockImplementation((_amount, options) => {
      options?.onSuccess?.(result);
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <QrPage />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText(/importe en pesos colombianos/i);
    await user.type(input, '15500');
    expect(await screen.findByText('+15')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generar qr/i }));
    expect(createMutate).toHaveBeenCalledWith(15500, expect.any(Object));

    expect(await screen.findByText(/escanéalo para sumar puntos/i)).toBeInTheDocument();
    expect(screen.getByTestId('qr')).toHaveAttribute(
      'data-value',
      expect.stringContaining('/claim/tok_123456789012345678901234567890'),
    );
    expect(screen.getByTestId('claim-url').textContent).toContain(
      '/claim/tok_123456789012345678901234567890',
    );
    expect(screen.getByText(/\+15 puntos estimados/i)).toBeInTheDocument();
  });

  it('no envía importes en cero', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <QrPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /generar qr/i }));
    expect(createMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText(/introduce un importe mayor que cero/i),
    ).toBeInTheDocument();
  });
});
