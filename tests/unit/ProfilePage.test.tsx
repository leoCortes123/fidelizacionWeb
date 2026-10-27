import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '@/features/profile/ProfilePage';
import type { MyProfile } from '@/types';

const updateProfile = vi.hoisted(() => vi.fn());
const availability = vi.hoisted(() => ({ data: true as boolean | undefined }));

const profile = vi.hoisted(() => ({
  id: 'user-1',
  full_name: 'Carla Cliente',
  email: 'carla@example.test',
  nickname: 'carlacliente',
  nickname_changes: 0,
  nickname_changes_left: 2,
  business_count: 1,
  created_at: '2026-02-11T12:00:00.000Z',
}));

vi.mock('@/features/profile/hooks', () => ({
  useMyProfile: () => ({
    data: profile as MyProfile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useNicknameAvailable: () => ({
    data: availability.data,
    isFetching: false,
  }),
  useUpdateProfile: () => ({ mutateAsync: updateProfile, isPending: false }),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    availability.data = true;
    updateProfile.mockResolvedValue({
      ...profile,
      nickname: 'carla-nueva',
      nickname_changes: 1,
      nickname_changes_left: 1,
    });
  });

  it('muestra el alias y los cambios disponibles', () => {
    renderPage();

    expect(screen.getByText('@carlacliente')).toBeInTheDocument();
    expect(
      screen.getByText(/Te quedan 2 de 2 cambios/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue('Carla Cliente');
    expect(screen.getByLabelText(/Alias público/)).toHaveValue('carlacliente');
  });

  it('avisa cuando el alias está disponible y guarda el perfil', async () => {
    const user = userEvent.setup();
    renderPage();

    const nickname = screen.getByLabelText(/Alias público/);
    await user.clear(nickname);
    await user.type(nickname, 'carla-nueva');

    await waitFor(() => {
      expect(screen.getByTestId('nickname-availability')).toHaveTextContent(
        'está disponible',
      );
    });

    await user.click(screen.getByRole('button', { name: /Guardar perfil/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        fullName: 'Carla Cliente',
        nickname: 'carla-nueva',
      });
    });
  });

  it('bloquea el guardado cuando el alias está ocupado', async () => {
    availability.data = false;
    const user = userEvent.setup();
    renderPage();

    const nickname = screen.getByLabelText(/Alias público/);
    await user.clear(nickname);
    await user.type(nickname, 'alias-ocupado');

    await waitFor(() => {
      expect(screen.getByTestId('nickname-availability')).toHaveTextContent(
        'no está disponible',
      );
    });

    await user.click(screen.getByRole('button', { name: /Guardar perfil/i }));

    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('bloquea el campo cuando se agotaron los 2 cambios', () => {
    const descriptor = Object.getOwnPropertyDescriptor(profile, 'nickname_changes_left');
    Object.defineProperty(profile, 'nickname_changes_left', {
      value: 0,
      configurable: true,
    });
    renderPage();

    expect(screen.getByLabelText(/Alias público/)).toBeDisabled();
    expect(
      screen.getByText(/Ya usaste tus 2 cambios de alias/i),
    ).toBeInTheDocument();

    if (descriptor) {
      Object.defineProperty(profile, 'nickname_changes_left', descriptor);
    }
  });
});
