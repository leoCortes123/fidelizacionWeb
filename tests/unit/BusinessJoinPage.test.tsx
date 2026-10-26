import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BusinessJoinPage } from '@/features/loyalty/BusinessJoinPage';
import { businessStorageKey } from '@/features/loyalty/businessContext';
import type { BusinessPublic } from '@/types';

const join = vi.hoisted(() => vi.fn());
const publicQuery = vi.hoisted(() => ({
  current: null as BusinessPublic | null,
  isLoading: false,
  isError: false,
}));
const auth = vi.hoisted(() => ({
  session: null as unknown,
  user: null as { id: string } | null,
}));

const business: BusinessPublic = {
  id: 'biz-1',
  name: 'Taquería El Fogón',
  slug: 'taqueria-el-fogon',
  timezone: 'America/Bogota',
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  loyalty_active: true,
};

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: auth.session,
    user: auth.user,
    roles: [],
    loading: false,
  }),
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinessPublic: () => ({
    data: publicQuery.current,
    isLoading: publicQuery.isLoading,
    isError: publicQuery.isError,
    error: publicQuery.isError ? new Error('No disponible') : null,
    refetch: vi.fn(),
  }),
  useJoinBusiness: () => ({ mutateAsync: join, isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/join/taqueria-el-fogon']}>
      <Routes>
        <Route path="/join/:slug" element={<BusinessJoinPage />} />
        <Route path="/customer/balance" element={<p>Saldo del cliente</p>} />
        <Route path="/admin/dashboard" element={<p>Panel de administración</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BusinessJoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publicQuery.current = business;
    publicQuery.isLoading = false;
    publicQuery.isError = false;
    auth.session = null;
    auth.user = null;
  });

  it('muestra la ficha pública y pide iniciar sesión si no hay sesión', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Taquería El Fogón' })).toBeInTheDocument();
    expect(screen.getByText('Programa de loopoints activo')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Entrar y unirme/i });
    expect(link).toHaveAttribute(
      'href',
      '/login?next=%2Fjoin%2Ftaqueria-el-fogon',
    );
  });

  it('afilia al usuario y recuerda el negocio antes de navegar', async () => {
    const user = userEvent.setup();
    auth.session = { user: { id: 'user-customer' } };
    auth.user = { id: 'user-customer' };
    join.mockResolvedValue({
      business_id: 'biz-1',
      business_name: 'Taquería El Fogón',
      slug: 'taqueria-el-fogon',
      membership_id: 'mem-1',
      role: 'cliente',
      already_member: false,
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: /Unirme a Taquería El Fogón/i }));

    await waitFor(() => expect(join).toHaveBeenCalledWith({ slug: 'taqueria-el-fogon' }));
    expect(await screen.findByText('Saldo del cliente')).toBeInTheDocument();
    expect(localStorage.getItem(businessStorageKey('user-customer'))).toBe('biz-1');
  });

  it('avisa cuando el negocio no existe', () => {
    publicQuery.current = null;
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'No encontramos este negocio' }),
    ).toBeInTheDocument();
  });

  it('explica que el programa aún no está activo', () => {
    publicQuery.current = { ...business, loyalty_active: false };
    renderPage();

    expect(screen.getByText('El programa aún no está activo')).toBeInTheDocument();
    expect(screen.getByText('Programa en preparación')).toBeInTheDocument();
  });
});
