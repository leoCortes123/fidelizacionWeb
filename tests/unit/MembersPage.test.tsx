import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MembersPage } from '@/features/admin/MembersPage';
import type { BusinessMembershipWithProfile, ProfileLookup } from '@/types';

const create = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const profiles = vi.hoisted(() => ({ current: [] as ProfileLookup[] }));

const fixture = vi.hoisted(() => ({
  business: {
    id: 'biz-1',
    name: 'Taquería El Fogón',
    slug: 'taqueria-el-fogon',
    timezone: 'America/Bogota',
    operating_days: [1, 2, 3, 4, 5, 6],
    is_active: true,
    created_by: 'user-admin',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    role: 'admin' as const,
    can_approve_redemptions: false,
  },
  members: [
    {
      id: 'mem-1',
      business_id: 'biz-1',
      user_id: 'user-ana',
      full_name: 'Ana Encargada',
      email: 'ana@example.test',
      role: 'encargado',
      can_approve_redemptions: true,
      created_by: 'user-admin',
      created_at: '2026-01-02T12:00:00.000Z',
      updated_at: '2026-01-02T12:00:00.000Z',
    },
  ] as BusinessMembershipWithProfile[],
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useBusinessMemberships: () => ({
    data: fixture.members,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateBusinessMembership: () => ({ mutateAsync: create, isPending: false }),
  useUpdateBusinessMembership: () => ({ mutateAsync: update, isPending: false }),
  useSearchProfiles: (_businessId: string, query: string) => ({
    data:
      query.trim().length >= 2
        ? profiles.current.filter((profile) =>
            `${profile.full_name} ${profile.email}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          )
        : [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: 'admin',
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MembersPage />
    </MemoryRouter>,
  );
}

describe('MembersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue({});
    update.mockResolvedValue({});
    profiles.current = [
      {
        user_id: 'user-luis',
        full_name: 'Luis Nuevo',
        email: 'luis@example.test',
        already_member: false,
      },
      {
        user_id: 'user-ana',
        full_name: 'Ana Encargada',
        email: 'ana@example.test',
        already_member: true,
      },
    ];
  });

  it('lista los miembros y alterna el permiso de aprobación', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Ana Encargada')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', {
      name: /Puede aprobar redenciones/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    await waitFor(() => expect(update).toHaveBeenCalledWith({
      businessId: 'biz-1',
      userId: 'user-ana',
      canApproveRedemptions: false,
    }));
  });

  it('busca por correo y añade un encargado con permiso', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Añadir miembro/i }));
    const dialog = within(screen.getByRole('dialog'));

    await user.type(dialog.getByLabelText('Buscar persona'), 'luis');
    expect(await dialog.findByText('Luis Nuevo')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Elegir' }));

    await user.click(dialog.getByRole('checkbox', { name: /Puede aprobar redenciones/i }));
    await user.click(dialog.getByRole('button', { name: 'Añadir miembro' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      businessId: 'biz-1',
      userId: 'user-luis',
      role: 'encargado',
      canApproveRedemptions: true,
    });
  });

  it('no permite añadir a quien ya es miembro', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Añadir miembro/i }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Buscar persona'), 'ana');

    expect(await dialog.findByText('Ya es miembro')).toBeInTheDocument();
    expect(dialog.queryByRole('button', { name: 'Elegir' })).not.toBeInTheDocument();
  });

  it('añade un cliente sin permiso de aprobación', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Añadir miembro/i }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Buscar persona'), 'luis');
    await dialog.findByText('Luis Nuevo');
    await user.click(dialog.getByRole('button', { name: 'Elegir' }));

    await user.click(dialog.getByRole('combobox', { name: /Rol en el negocio/i }));
    await user.click(await screen.findByRole('option', { name: 'Cliente' }));

    expect(
      dialog.queryByRole('checkbox', { name: /Puede aprobar redenciones/i }),
    ).not.toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Añadir miembro' }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'cliente', canApproveRedemptions: false }),
    );
  });
});
