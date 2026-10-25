import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';

const auth = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  state: {
    session: null,
    user: null,
    roles: [] as string[],
    loading: false,
    rolesLoading: false,
    displayName: '',
  },
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    ...auth.state,
    signInWithGoogle: auth.signInWithGoogle,
    signInWithPassword: auth.signInWithPassword,
    signUpWithPassword: auth.signUpWithPassword,
  }),
}));

describe('LoginPage', () => {
  it('inicia OAuth conservando el destino interno', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login?next=/claim/token-123']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Entra a tus puntos/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /continuar con google/i }),
    );

    expect(auth.signInWithGoogle).toHaveBeenCalledWith('/claim/token-123');
  });

  it('permite entrar con correo y contraseña', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^correo$/i), 'carla@example.test');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreto123');
    await user.click(screen.getByRole('button', { name: /entrar con correo/i }));

    expect(auth.signInWithPassword).toHaveBeenCalledWith(
      'carla@example.test',
      'secreto123',
    );
  });

  it('permite crear una cuenta simple sin verificación', async () => {
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /regístrate/i }));
    await user.type(screen.getByLabelText(/^nombre$/i), 'Carla Cliente');
    await user.type(screen.getByLabelText(/^correo$/i), 'carla@example.test');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreto123');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(auth.signUpWithPassword).toHaveBeenCalledWith({
      email: 'carla@example.test',
      password: 'secreto123',
      fullName: 'Carla Cliente',
      nextPath: '/customer',
    });
  });

  it('ignora destinos externos y usa el portal por defecto', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login?next=https://evil.example']}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: /continuar con google/i }),
    );

    expect(auth.signInWithGoogle).toHaveBeenCalledWith('/customer');
  });
});
