import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  CustomerBusinessesPage,
  parseInvitationSlug,
} from '@/features/customer/CustomerBusinessesPage';
import type { CustomerBusinessSummary } from '@/types';

const summary = vi.hoisted(() => ({
  current: {
    data: [] as CustomerBusinessSummary[],
    isLoading: false,
    isError: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useCustomerBusinessesSummary: () => summary.current,
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ displayName: 'Carla Cliente' }),
}));

function row(
  overrides: Partial<CustomerBusinessSummary> & Pick<CustomerBusinessSummary, 'business_id' | 'name' | 'slug'>,
): CustomerBusinessSummary {
  return {
    logo_url: null,
    role: 'cliente',
    loyalty_active: true,
    balance: 0,
    ready_rewards: 0,
    pending_redemptions: 0,
    last_purchase_at: null,
    is_frequent: false,
    is_frequent_active: false,
    ...overrides,
  };
}

function renderPage(initialEntry = '/customer') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customer" element={<CustomerBusinessesPage />} />
        <Route path="/join/:slug" element={<p>Invitación abierta</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CustomerBusinessesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    summary.current = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  });

  it('muestra una tarjeta por negocio con su saldo y recompensas listas', () => {
    summary.current.data = [
      row({
        business_id: 'biz-1',
        name: 'Taquería El Fogón',
        slug: 'taqueria-el-fogon',
        balance: 50,
        ready_rewards: 1,
        is_frequent: true,
        is_frequent_active: true,
        last_purchase_at: '2026-10-20T15:00:00.000Z',
      }),
      row({
        business_id: 'biz-2',
        name: 'Café Central',
        slug: 'cafe-central',
        balance: 10,
      }),
      row({
        business_id: 'biz-3',
        name: 'Tienda Verde',
        slug: 'tienda-verde',
        loyalty_active: false,
      }),
    ];

    renderPage();

    expect(screen.getByRole('heading', { name: /¡Hola, Carla!/ })).toBeInTheDocument();
    expect(screen.getByTestId('total-points-balance')).toHaveTextContent('60');

    const taco = screen.getByRole('link', { name: /Taquería El Fogón/ });
    expect(taco).toHaveAttribute('href', '/customer/business/biz-1');
    expect(taco).toHaveTextContent('50');
    expect(taco).toHaveTextContent('1 lista');
    expect(taco).toHaveTextContent('Frecuente activo');
    expect(taco).toHaveTextContent('Última compra registrada');

    const cafe = screen.getByRole('link', { name: /Café Central/ });
    expect(cafe).toHaveAttribute('href', '/customer/business/biz-2');
    expect(cafe).toHaveTextContent('10');

    const shop = screen.getByRole('link', { name: /Tienda Verde/ });
    expect(shop).toHaveTextContent('Programa inactivo');
    expect(shop).toHaveTextContent('Sin compras todavía');
  });

  it('muestra el estado vacío y abre una invitación por enlace o código', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByText('Aún no participas en ningún negocio'),
    ).toBeInTheDocument();

    const input = screen.getByLabelText('Enlace o código del negocio');
    await user.type(input, 'no es un slug');
    await user.click(screen.getByRole('button', { name: 'Abrir invitación' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Pega el enlace/i);

    await user.clear(input);
    await user.type(input, 'https://loopoint.app/join/cafe-central');
    await user.click(screen.getByRole('button', { name: 'Abrir invitación' }));
    expect(screen.getByText('Invitación abierta')).toBeInTheDocument();
  });

  it('interpreta enlaces y códigos de invitación', () => {
    expect(parseInvitationSlug('cafe-central')).toBe('cafe-central');
    expect(parseInvitationSlug(' https://loopoint.app/join/cafe-central ')).toBe(
      'cafe-central',
    );
    expect(parseInvitationSlug('https://loopoint.app/join/cafe-central?x=1')).toBe(
      'cafe-central',
    );
    expect(parseInvitationSlug('Cafe Central')).toBeNull();
    expect(parseInvitationSlug('')).toBeNull();
  });
});
