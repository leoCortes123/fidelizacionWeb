import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuditPage } from '@/features/admin/AuditPage';
import type { Business, BusinessAuditFilters, BusinessAuditLog } from '@/types';

const calls = vi.hoisted(() => [] as unknown[][]);

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
  rows: [
    {
      id: 'log-1',
      business_id: 'biz-1',
      actor_email: 'ana@example.test',
      actor_name: 'Ana Admin',
      operation: 'purchase.registered',
      entity_type: 'loyalty_purchase_event',
      entity_id: 'event-1234567890',
      metadata: { amount_cop: 15500, points_earned: 15 },
      created_at: '2026-10-25T12:00:00.000Z',
      total_count: 30,
    },
    {
      id: 'log-2',
      business_id: 'biz-1',
      actor_email: 'carlos@example.test',
      actor_name: 'Carlos Encargado',
      operation: 'redemption.delivered',
      entity_type: 'loyalty_redemption',
      entity_id: 'redemption-9876543210',
      metadata: { reward_name: 'Taco individual', points_spent: 40 },
      created_at: '2026-10-24T12:00:00.000Z',
      total_count: 30,
    },
  ] as BusinessAuditLog[],
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({
    data: [fixture.business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessAuditLog: (...args: unknown[]) => {
    calls.push(args);
    return {
      data: fixture.rows,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business as Business,
    businesses: [fixture.business],
    selectedRole: 'admin',
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AuditPage />
    </MemoryRouter>,
  );
}

describe('AuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
  });

  it('lista las operaciones con etiquetas legibles y el actor', () => {
    renderPage();

    expect(screen.getAllByText('Compra registrada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Recompensa entregada').length).toBeGreaterThan(0);
    expect(screen.queryByText('purchase.registered')).not.toBeInTheDocument();
    expect(screen.getAllByText('Ana Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carlos Encargado').length).toBeGreaterThan(0);
    expect(screen.getByText(/30 operaciones · página 1 de 2/i)).toBeInTheDocument();
  });

  it('abre el detalle con los campos formateados y el JSON bajo demanda', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      within(screen.getByRole('table')).getByRole('button', {
        name: 'Ver detalle de Compra registrada',
      }),
    );

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Valor de la compra')).toBeInTheDocument();
    expect(dialog.getAllByText(/15\.500/).length).toBeGreaterThan(0);
    expect(dialog.getByText('Loopoints sumados')).toBeInTheDocument();
    expect(dialog.getAllByText(/15 loopoints/).length).toBeGreaterThan(0);
    expect(dialog.queryByText('amount_cop')).not.toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Ver JSON' }));
    expect(dialog.getByText(/"amount_cop"/)).toBeInTheDocument();
  });

  it('filtra por texto, actor y rango de fechas', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Buscar'), 'café');
    await user.type(screen.getByLabelText('Actor'), 'ana');
    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2026-10-31' },
    });
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => {
      const last = calls[calls.length - 1] as [
        string,
        BusinessAuditFilters,
        number,
        number,
      ];
      expect(last[0]).toBe('biz-1');
      expect(last[1].search).toBe('café');
      expect(last[1].actor).toBe('ana');
      expect(last[1].from).toBe('2026-10-01T05:00:00.000Z');
      expect(last[1].to).toBe('2026-11-01T05:00:00.000Z');
      expect(last[2]).toBe(25);
      expect(last[3]).toBe(0);
    });

    expect(screen.getByText('Texto: “café”')).toBeInTheDocument();
    expect(screen.getByText('Actor: ana')).toBeInTheDocument();
  });

  it('quita un filtro activo y vuelve a consultar sin él', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Buscar'), 'café');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await user.click(screen.getByRole('button', { name: /Quitar filtro Texto/ }));

    await waitFor(() => {
      const last = calls[calls.length - 1] as [
        string,
        BusinessAuditFilters,
        number,
        number,
      ];
      expect(last[1].search).toBeUndefined();
    });
    expect(screen.queryByText('Texto: “café”')).not.toBeInTheDocument();
  });

  it('pagina los resultados en el servidor', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      const last = calls[calls.length - 1] as [
        string,
        BusinessAuditFilters,
        number,
        number,
      ];
      expect(last[0]).toBe('biz-1');
      expect(last[1]).toEqual({});
      expect(last[2]).toBe(25);
      expect(last[3]).toBe(25);
    });
  });
});
