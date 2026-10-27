import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClaimPage } from '@/features/purchases/ClaimPage';
import type { ClaimResult, PurchaseQrPreview } from '@/types';

const TOKEN = 'tok_123456789012345678901234567890';

const auth = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  state: {
    session: { user: { id: 'customer-1' } } as { user: { id: string } } | null,
    user: { id: 'customer-1' },
    roles: ['customer'] as string[],
    loading: false,
    rolesLoading: false,
    displayName: 'Carla Cliente',
  },
}));

const claim = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const preview = vi.hoisted(() => ({
  data: null as PurchaseQrPreview | null,
  isLoading: false,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ ...auth.state, signInWithGoogle: auth.signInWithGoogle }),
}));

vi.mock('@/features/purchases/hooks', () => ({
  usePurchaseQrPreview: () => preview,
  useClaimPurchase: () => claim,
}));

const pendingPreview: PurchaseQrPreview = {
  purchase_id: 'purchase-1',
  business_id: 'biz-1',
  business_name: 'Taquería El Fogón',
  business_slug: 'taqueria-el-fogon',
  amount_cop: 15500,
  points_preview: 15,
  status: 'pending_claim',
  claimed: false,
  expires_at: '2026-10-26T02:00:00.000Z',
  items: [],
  items_count: 0,
};

const result: ClaimResult = {
  purchase_id: 'purchase-1',
  business_id: 'biz-1',
  business_name: 'Taquería El Fogón',
  business_slug: 'taqueria-el-fogon',
  amount_cop: 15500,
  points_awarded: 15,
  balance: 15,
  claimed_at: '2026-10-22T02:00:00.000Z',
  duplicate: false,
};

function renderClaim(path = `/claim/${TOKEN}`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/claim/:token" element={<ClaimPage />} />
        <Route path="/customer" element={<div>Panel cliente</div>} />
        <Route path="/customer/business/:businessId" element={<div>Saldo cliente</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClaimPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.state.session = { user: { id: 'customer-1' } };
    preview.data = pendingPreview;
    preview.isLoading = false;
    preview.isError = false;
    claim.mutate.mockImplementation((_token, options) => {
      options?.onSuccess?.(result);
    });
  });

  it('muestra la compra y exige confirmación antes de acreditar', async () => {
    const user = userEvent.setup();
    renderClaim();

    expect(screen.getByText('Taquería El Fogón')).toBeInTheDocument();
    expect(screen.getByText(/15\.500/)).toBeInTheDocument();
    expect(claim.mutate).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /confirmar y sumar loopoints/i }),
    );

    expect(claim.mutate).toHaveBeenCalledWith(TOKEN, expect.any(Object));
    expect(await screen.findByText(/¡Loopoints acreditados!/i)).toBeInTheDocument();
    expect(screen.getByText(/\+15/)).toBeInTheDocument();
    expect(screen.getByText(/Taquería El Fogón/)).toBeInTheDocument();
  });

  it('ofrece crear cuenta con Google o con correo cuando no hay sesión', async () => {
    auth.state.session = null;
    const user = userEvent.setup();
    renderClaim();

    await user.click(
      screen.getByRole('button', { name: /continuar con google/i }),
    );
    expect(auth.signInWithGoogle).toHaveBeenCalledWith(`/claim/${TOKEN}`);

    expect(
      screen.getByRole('link', { name: /crear cuenta con correo/i }),
    ).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent(`/claim/${TOKEN}`)}&mode=register`,
    );
    expect(screen.getByRole('link', { name: /ya tengo cuenta/i })).toBeInTheDocument();
    expect(claim.mutate).not.toHaveBeenCalled();
  });

  it('informa cuando el QR ya fue reclamado', () => {
    preview.data = {
      ...pendingPreview,
      status: 'claimed',
      claimed: true,
    };
    renderClaim();

    expect(screen.getByText(/QR ya reclamado/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirmar y sumar loopoints/i }),
    ).not.toBeInTheDocument();
  });

  it('informa cuando el QR venció', () => {
    preview.data = { ...pendingPreview, status: 'expired' };
    renderClaim();

    expect(screen.getByText(/QR no disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/venció/i)).toBeInTheDocument();
  });

  it('rechaza enlaces con formato inválido sin consultar la compra', () => {
    renderClaim('/claim/corto');

    expect(screen.getByText(/enlace de compra inválido/i)).toBeInTheDocument();
    expect(claim.mutate).not.toHaveBeenCalled();
  });
});
