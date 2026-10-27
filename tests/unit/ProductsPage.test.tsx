import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProductsPage } from '@/features/admin/ProductsPage';
import type { Product } from '@/types';

const upsert = vi.hoisted(() => vi.fn());

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
  products: [
    {
      id: 'prod-taco',
      business_id: 'biz-1',
      name: 'Taco de guisado',
      description: 'Con doble tortilla',
      price_cop: 2500,
      cost_cop: 800,
      is_active: true,
      kind: 'simple',
      combo_items: [],
      created_at: '2026-01-01T12:00:00.000Z',
      updated_at: '2026-01-01T12:00:00.000Z',
    },
    {
      id: 'prod-agua',
      business_id: 'biz-1',
      name: 'Agua fresca',
      description: null,
      price_cop: 1200,
      cost_cop: null,
      is_active: false,
      created_at: '2026-01-01T12:00:00.000Z',
      updated_at: '2026-01-01T12:00:00.000Z',
    },
  ] as Product[],
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useProducts: () => ({
    data: fixture.products,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpsertProduct: () => ({ mutateAsync: upsert, isPending: false }),
  useSetProductCombo: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
      <ProductsPage />
    </MemoryRouter>,
  );
}

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockResolvedValue({});
  });

  it('lista los productos con precio, costo y estado', () => {
    renderPage();

    expect(screen.getByText('Taco de guisado')).toBeInTheDocument();
    expect(screen.getByText('Agua fresca')).toBeInTheDocument();
    expect(screen.getByText('2.500', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Sin dato')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('filtra productos por nombre', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Buscar productos'), 'taco');

    expect(screen.getByText('Taco de guisado')).toBeInTheDocument();
    expect(screen.queryByText('Agua fresca')).not.toBeInTheDocument();
  });

  it('crea un producto con el precio interpretado en pesos', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Nuevo producto/i }));
    const dialog = within(screen.getByRole('dialog'));

    await user.type(dialog.getByLabelText('Nombre'), 'Quesadilla');
    await user.type(dialog.getByLabelText('Precio (COP)'), '3.500');
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        id: null,
        name: 'Quesadilla',
        priceCop: 3500,
        costCop: null,
        isActive: true,
      }),
    );
  });

  it('advierte cuando el costo supera el precio de venta', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Nuevo producto/i }));
    const dialog = within(screen.getByRole('dialog'));

    await user.type(dialog.getByLabelText('Nombre'), 'Quesadilla');
    await user.type(dialog.getByLabelText('Precio (COP)'), '2.000');
    await user.type(dialog.getByLabelText('Costo (COP, opcional)'), '2.500');

    expect(
      await screen.findByText(/el costo supera el precio de venta/i),
    ).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ priceCop: 2000, costCop: 2500 }),
    );
  });

  it('edita un producto conservando su estado', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Editar Taco de guisado' }),
    );
    const dialog = within(screen.getByRole('dialog'));
    const name = dialog.getByLabelText('Nombre');
    await user.clear(name);
    await user.type(name, 'Taco de guisado doble');
    await user.click(dialog.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'prod-taco',
        name: 'Taco de guisado doble',
        priceCop: 2500,
        costCop: 800,
        isActive: true,
      }),
    );
  });

  it('desactiva un producto', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Desactivar Taco de guisado' }),
    );

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod-taco', isActive: false }),
    );
  });
});
