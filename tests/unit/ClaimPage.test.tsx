import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClaimPage } from '@/features/purchases/ClaimPage';
import type { ClaimResult } from '@/types';

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

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ ...auth.state, signInWithGoogle: auth.signInWithGoogle }),
}));

vi.mock('@/features/purchases/hooks', () => ({
  useClaimPurchase: () => claim,
}));

const result: ClaimResult = {
  purchase_id: 'purchase-1',
  amount_cop: 15500,
  points_awarded: 15,
  balance: 15,
  claimed_at: '2026-10-22T02:00:00.000Z',
};

function renderClaim() {
  return render(
    <MemoryRouter initialEntries={[`/claim/${TOKEN}`]}>
      <Routes>
        <Route path="/claim/:token" element={<ClaimPage />} />
        <Route path="/customer" element={<div>Panel cliente</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClaimPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.state.session = { user: { id: 'customer-1' } };
    claim.mutate.mockImplementation((_token, options) => {
      options?.onSuccess?.(result);
    });
  });

  it('exige confirmación antes de acreditar y muestra el resultado', async () => {
    const user = userEvent.setup();
    renderClaim();

    expect(screen.getByText(/Asocia tu compra/i)).toBeInTheDocument();
    expect(claim.mutate).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /confirmar y sumar puntos/i }),
    );

    expect(claim.mutate).toHaveBeenCalledWith(TOKEN, expect.any(Object));
    expect(await screen.findByText(/¡Compra asociada!/i)).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText(/15 puntos/i)).toBeInTheDocument();
  });

  it('conserva el token en sessionStorage y lo usa al iniciar sesión', async () => {
    auth.state.session = null;
    const user = userEvent.setup();
    renderClaim();

    await waitFor(() =>
      expect(sessionStorage.getItem('tacos-pending-claim-token')).toBe(TOKEN),
    );
    await user.click(
      screen.getByRole('button', { name: /iniciar sesión con google/i }),
    );

    expect(auth.signInWithGoogle).toHaveBeenCalledWith(`/claim/${TOKEN}`);
  });

  it('rechaza enlaces con formato inválido sin llamar al servidor', () => {
    render(
      <MemoryRouter initialEntries={['/claim/corto']}>
        <Routes>
          <Route path="/claim/:token" element={<ClaimPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/enlace de compra inválido/i)).toBeInTheDocument();
    expect(claim.mutate).not.toHaveBeenCalled();
  });
});
