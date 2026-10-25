import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireBusinessRole } from '@/components/layout/RequireAuth';
import type { Business } from '@/types';

const ctx = vi.hoisted(() => ({
  businesses: [] as Business[],
  selectedBusiness: null as Business | null,
  selectedRole: null as 'admin' | 'encargado' | 'cliente' | null,
  canApproveRedemptions: false,
  setSelectedBusiness: vi.fn(),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    roles: ['customer'],
    loading: false,
    rolesLoading: false,
    rolesLoaded: true,
    rolesError: null,
    refreshRoles: vi.fn(),
    session: { user: { id: 'user-1' } },
  }),
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ctx,
}));

const business: Business = {
  id: 'biz-1',
  name: 'Taquería',
  slug: 'taqueria',
  timezone: 'America/Bogota',
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  created_by: 'user-1',
  created_at: '2026-01-01T12:00:00.000Z',
  updated_at: '2026-01-01T12:00:00.000Z',
  role: 'admin',
  can_approve_redemptions: false,
};

function renderGuard(roles: Array<'admin' | 'encargado' | 'cliente'>) {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route
          path="/admin/dashboard"
          element={
            <RequireBusinessRole roles={roles}>
              <p>Panel privado</p>
            </RequireBusinessRole>
          }
        />
        <Route path="/customer/balance" element={<p>Portal del cliente</p>} />
        <Route path="/encargado" element={<p>Portal del encargado</p>} />
        <Route path="/business/select" element={<p>Selector de negocio</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireBusinessRole', () => {
  beforeEach(() => {
    ctx.businesses = [business];
    ctx.selectedBusiness = business;
    ctx.selectedRole = 'admin';
  });

  it('deja pasar al rol permitido en el negocio seleccionado', () => {
    renderGuard(['admin']);
    expect(screen.getByText('Panel privado')).toBeInTheDocument();
  });

  it('redirige a un cliente fuera del panel de administración', () => {
    ctx.selectedRole = 'cliente';
    renderGuard(['admin']);
    expect(screen.queryByText('Panel privado')).not.toBeInTheDocument();
    expect(screen.getByText('Portal del cliente')).toBeInTheDocument();
  });

  it('redirige al encargado a su propio portal', () => {
    ctx.selectedRole = 'encargado';
    renderGuard(['admin']);
    expect(screen.queryByText('Panel privado')).not.toBeInTheDocument();
    expect(screen.getByText('Portal del encargado')).toBeInTheDocument();
  });

  it('permite al encargado entrar cuando el guard lo admite', () => {
    ctx.selectedRole = 'encargado';
    renderGuard(['admin', 'encargado']);
    expect(screen.getByText('Panel privado')).toBeInTheDocument();
  });

  it('deja renderizar la página cuando se está eligiendo negocio', () => {
    ctx.selectedBusiness = null;
    ctx.selectedRole = null;
    renderGuard(['admin']);
    expect(screen.getByText('Panel privado')).toBeInTheDocument();
  });

  it('envía al selector si la cuenta no tiene negocios', () => {
    ctx.businesses = [];
    ctx.selectedBusiness = null;
    ctx.selectedRole = null;
    renderGuard(['admin']);
    expect(screen.queryByText('Panel privado')).not.toBeInTheDocument();
    expect(screen.getByText('Selector de negocio')).toBeInTheDocument();
  });
});
