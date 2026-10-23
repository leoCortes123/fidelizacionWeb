import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireAdmin } from '@/components/layout/RequireAuth';

const auth = vi.hoisted(() => ({
  refreshRoles: vi.fn(),
  state: {
    session: null as unknown,
    roles: [] as string[],
    loading: false,
    rolesLoading: false,
    rolesLoaded: true,
    rolesError: null as unknown,
  },
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ ...auth.state, refreshRoles: auth.refreshRoles }),
}));

describe('RequireAdmin', () => {
  beforeEach(() => {
    auth.state.session = { user: { id: 'user-1' } };
    auth.state.roles = [];
    auth.state.loading = false;
    auth.state.rolesLoading = false;
    auth.state.rolesLoaded = true;
    auth.state.rolesError = new Error(
      'La conexión con el servidor tardó demasiado.',
    );
    auth.refreshRoles.mockClear();
  });

  it('ofrece reintentar cuando no se pudieron cargar los roles', () => {
    render(
      <MemoryRouter>
        <RequireAdmin>
          <p>Panel</p>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/No pudimos verificar tus permisos/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/tardó demasiado/i)).toBeInTheDocument();
    expect(screen.queryByText('Panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(auth.refreshRoles).toHaveBeenCalledTimes(1);
  });
});
