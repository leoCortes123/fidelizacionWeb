import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RedemptionsPage } from '@/features/customer/RedemptionsPage';
import {
  readRedemptionToken,
  saveRedemptionToken,
} from '@/features/loyalty/redemptionTokens';
import { redemptionScanUrl } from '@/lib/config';
import type { MyLoyaltyRedemption } from '@/types';

const reissue = vi.hoisted(() => vi.fn());
const rows = vi.hoisted(() => ({ current: [] as MyLoyaltyRedemption[] }));

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div
      data-testid="qr"
      data-value={value}
      aria-label="Código QR de la redención"
    />
  ),
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useMyLoyaltyRedemptions: () => ({
    data: rows.current,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useReissueRedemptionToken: () => ({ mutateAsync: reissue, isPending: false }),
}));

const businesses = vi.hoisted(() => ({ current: [] as Array<{ id: string; name: string }> }));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({ businesses: businesses.current }),
}));

const pending: MyLoyaltyRedemption = {
  id: 'red-1',
  business_id: 'biz-1',
  business_name: 'Taquería El Fogón',
  reward_name: 'Taco gratis',
  reward_type: 'free_product',
  points_spent: 40,
  code: 'TPAAAA1111',
  status: 'pending',
  created_at: '2026-10-20T12:00:00.000Z',
  approved_at: null,
  delivered_at: null,
  cancelled_at: null,
};

const futureIso = new Date(Date.now() + 2 * 3600 * 1000).toISOString();

function renderPage() {
  return render(
    <MemoryRouter>
      <RedemptionsPage />
    </MemoryRouter>,
  );
}

describe('RedemptionsPage del cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rows.current = [pending];
    businesses.current = [{ id: 'biz-1', name: 'Taquería El Fogón' }];
  });

  it('muestra el estado de cada solicitud y el negocio', () => {
    renderPage();

    expect(screen.getByText('Taco gratis')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de validar')).toBeInTheDocument();
    expect(screen.getByText('Taquería El Fogón')).toBeInTheDocument();
    expect(screen.getByText(/40 loopoints/)).toBeInTheDocument();
  });

  it('abre el QR guardado en la pestaña y muestra la cuenta atrás', async () => {
    const user = userEvent.setup();
    saveRedemptionToken(pending.id, {
      token: 'tok_guardado_1234567890',
      expires_at: futureIso,
      code: pending.code,
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver QR' }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByTestId('qr')).toHaveAttribute(
      'data-value',
      redemptionScanUrl('tok_guardado_1234567890'),
    );
    expect(dialog.getByRole('timer')).toHaveTextContent(/Vence en/);
  });

  it('recupera el QR reemitiéndolo cuando no está en el dispositivo', async () => {
    const user = userEvent.setup();
    reissue.mockResolvedValue({
      redemption_id: pending.id,
      token: 'tok_reemitido_abcdefghij',
      expires_at: futureIso,
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Recuperar QR' }));

    await waitFor(() => expect(reissue).toHaveBeenCalledWith({ redemptionId: pending.id }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByTestId('qr')).toHaveAttribute(
      'data-value',
      redemptionScanUrl('tok_reemitido_abcdefghij'),
    );
    expect(readRedemptionToken(pending.id)?.token).toBe('tok_reemitido_abcdefghij');
  });

  it('no ofrece QR cuando el canje ya fue validado', () => {
    rows.current = [
      {
        ...pending,
        status: 'approved',
        approved_at: '2026-10-21T12:00:00.000Z',
      },
    ];
    renderPage();

    expect(screen.getByText('Aprobado')).toBeInTheDocument();
    expect(screen.getByText(/ya validó el QR/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver QR' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recuperar QR' })).not.toBeInTheDocument();
  });

  it('muestra el estado vacío con acceso a los negocios', () => {
    rows.current = [];
    renderPage();

    expect(screen.getByText('Aún no has solicitado recompensas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis negocios' })).toBeInTheDocument();
  });

  it('filtra los canjes por negocio y muestra el detalle', async () => {
    const user = userEvent.setup();
    businesses.current = [
      { id: 'biz-1', name: 'Taquería El Fogón' },
      { id: 'biz-2', name: 'Café Central' },
    ];
    rows.current = [
      pending,
      {
        ...pending,
        id: 'red-2',
        business_id: 'biz-2',
        business_name: 'Café Central',
        reward_name: 'Café gratis',
        business_slug: 'cafe-central',
        status: 'delivered',
        delivered_at: '2026-10-22T15:00:00.000Z',
      },
    ];
    renderPage();

    await user.click(
      screen.getByRole('combobox', { name: 'Filtrar canjes por negocio' }),
    );
    await user.click(await screen.findByRole('option', { name: 'Café Central' }));

    expect(screen.queryByText('Taco gratis')).not.toBeInTheDocument();
    expect(screen.getByText('Café gratis')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText(/Café Central/)).toBeInTheDocument();
    expect(dialog.getByText(/@cafe-central/)).toBeInTheDocument();
    expect(dialog.getAllByText('Entregado').length).toBeGreaterThan(0);
  });
});
