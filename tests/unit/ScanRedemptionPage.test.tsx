import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ScanRedemptionPage } from '@/features/loyalty/ScanRedemptionPage';
import type { RedemptionScanContext } from '@/types';

const redeem = vi.hoisted(() => vi.fn());
const ctx = vi.hoisted(() => ({
  state: 'ready' as 'ready' | 'loading' | 'error',
  data: null as RedemptionScanContext | null,
  error: null as Error | null,
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useRedemptionScanContext: () => ({
    data: ctx.state === 'ready' ? ctx.data : undefined,
    isLoading: ctx.state === 'loading',
    isError: ctx.state === 'error',
    error: ctx.error,
    refetch: vi.fn(),
  }),
  useRedeemRedemptionByToken: () => ({ mutateAsync: redeem, isPending: false }),
}));

function context(
  overrides: Partial<RedemptionScanContext> = {},
): RedemptionScanContext {
  return {
    business_id: 'biz-1',
    business_name: 'Taquería El Fogón',
    business_slug: 'taqueria-el-fogon',
    business_logo_url: null,
    redemption_id: 'red-1',
    code: 'TPAAAA1111',
    reward_name: 'Taco gratis',
    reward_type: 'free_product',
    points_spent: 40,
    customer_id: 'user-customer',
    customer_nickname: 'carla',
    status: 'pending',
    origin: 'qr_scan',
    created_at: '2026-10-20T12:00:00.000Z',
    expires_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    consumed_at: null,
    approved_at: null,
    delivered_at: null,
    can_redeem: true,
    reason: null,
    role: 'admin',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/scan/tok_1234567890abcdef']}>
      <Routes>
        <Route path="/scan/:token" element={<ScanRedemptionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ScanRedemptionPage', () => {
  beforeEach(() => {
    ctx.state = 'ready';
    ctx.data = context();
    ctx.error = null;
    redeem.mockReset();
    redeem.mockResolvedValue({
      business_id: 'biz-1',
      redemption_id: 'red-1',
      code: 'TPAAAA1111',
      reward_name: 'Taco gratis',
      points_spent: 40,
      customer_nickname: 'carla',
      status: 'delivered',
      origin: 'qr_scan',
      delivered_at: '2026-10-20T13:00:00.000Z',
      role: 'admin',
    });
  });

  it('muestra negocio, cliente y recompensa antes de confirmar', () => {
    renderPage();

    expect(screen.getByText('Taquería El Fogón')).toBeInTheDocument();
    expect(screen.getByText('Taco gratis')).toBeInTheDocument();
    expect(screen.getByText('@carla')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeEnabled();
  });

  it('confirma la entrega y ofrece registrar la compra', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Confirmar entrega' }));

    await waitFor(() =>
      expect(redeem).toHaveBeenCalledWith({ token: 'tok_1234567890abcdef' }),
    );
    expect(await screen.findByText('Entrega confirmada')).toBeInTheDocument();
    const registerLink = screen.getByRole('link', { name: /Registrar compra/ });
    expect(registerLink).toHaveAttribute('href', '/admin/purchases/new');
  });

  it('no permite entregar un QR vencido', () => {
    ctx.data = context({
      can_redeem: false,
      reason: 'token_expired',
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    renderPage();

    expect(screen.getByText('El QR venció')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled();
  });

  it('explica un token inválido y permite pegar el código manual', () => {
    ctx.state = 'error';
    ctx.data = null;
    ctx.error = new Error('invalid_token');
    renderPage();

    expect(screen.getByText('No pudimos validar este QR')).toBeInTheDocument();
    expect(screen.getByText(/no es válido/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText('Código manual del canje'),
    ).toBeInTheDocument();
  });
});
