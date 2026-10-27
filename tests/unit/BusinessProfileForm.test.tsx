import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessProfileForm } from '@/features/admin/BusinessProfileForm';
import type { Business, BusinessProfile } from '@/types';

const updateProfile = vi.hoisted(() => vi.fn());
const setLogo = vi.hoisted(() => vi.fn());

const business: Business = {
  id: 'biz-1',
  name: 'Café Loopoint',
  slug: 'cafe-loopoint',
  timezone: 'America/Bogota',
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  created_by: 'user-admin',
  created_at: '2026-01-01T12:00:00.000Z',
  updated_at: '2026-01-01T12:00:00.000Z',
  role: 'admin',
  can_approve_redemptions: false,
};

const profile: BusinessProfile = {
  id: 'biz-1',
  name: 'Café Loopoint',
  slug: 'cafe-loopoint',
  timezone: 'America/Bogota',
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  description: 'Café de especialidad.',
  address: 'Calle 10 # 5-20',
  neighborhood: 'Centro',
  city: 'Bogotá',
  phone_whatsapp: '+573001234567',
  phone: null,
  instagram: 'cafeloopoint',
  website: 'https://cafeloopoint.co',
  logo_url: null,
  updated_at: '2026-01-01T12:00:00.000Z',
};

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinessProfile: () => ({
    data: profile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateBusinessProfile: () => ({
    mutateAsync: updateProfile,
    isPending: false,
  }),
  useSetBusinessLogo: () => ({ mutateAsync: setLogo, isPending: false }),
}));

describe('BusinessProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfile.mockImplementation(async (payload) => ({
      ...profile,
      name: payload.name,
      description: payload.description,
      phone_whatsapp: payload.phoneWhatsapp,
    }));
  });

  it('carga la ficha con los datos públicos', () => {
    render(<BusinessProfileForm business={business} />);

    expect(screen.getByLabelText(/Nombre del negocio/)).toHaveValue('Café Loopoint');
    expect(screen.getByLabelText(/Descripción/)).toHaveValue('Café de especialidad.');
    expect(screen.getByLabelText(/WhatsApp/)).toHaveValue('+573001234567');
    expect(screen.getByLabelText(/Enlace público/)).toHaveValue(
      '/join/cafe-loopoint',
    );
  });

  it('guarda los cambios de la ficha', async () => {
    const user = userEvent.setup();
    render(<BusinessProfileForm business={business} />);

    const name = screen.getByLabelText(/Nombre del negocio/);
    await user.clear(name);
    await user.type(name, 'Café Loopoint Centro');
    await user.click(
      screen.getByRole('button', { name: /Guardar datos del negocio/i }),
    );

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          name: 'Café Loopoint Centro',
          description: 'Café de especialidad.',
        }),
      );
    });
  });

  it('rechaza un WhatsApp inválido sin llamar al servidor', async () => {
    const user = userEvent.setup();
    render(<BusinessProfileForm business={business} />);

    const whatsapp = screen.getByLabelText(/WhatsApp/);
    await user.clear(whatsapp);
    await user.type(whatsapp, 'abc');
    await user.click(
      screen.getByRole('button', { name: /Guardar datos del negocio/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Escribe un WhatsApp válido/i),
      ).toBeInTheDocument();
    });
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
